import sys
import json
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from datetime import timedelta
import time
import joblib
import os
import uuid

def main():
    # Ensure models directory exists
    models_dir = 'models'
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)

    input_str = sys.stdin.read()
    if not input_str:
        return
        
    try:
        request = json.loads(input_str)
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON input"}))
        sys.exit(1)

    data = request.get("data", [])
    target = request.get("targetVariable")
    features = request.get("features", [])
    model_name = request.get("modelUsed", "linear_regression")
    hyperparameters = request.get("hyperparameters", {})
    horizon = request.get("horizon", 30)

    if not data or not target:
        print(json.dumps({"error": "Missing data or target variable"}))
        sys.exit(1)

    df = pd.DataFrame(data)
    
    if "date" not in df.columns:
        df["date"] = pd.date_range(start="2020-01-01", periods=len(df), freq="D")
    else:
        df["date"] = pd.to_datetime(df["date"])

    df = df.sort_values("date").reset_index(drop=True)
    df = df.ffill().bfill()

    if not features:
        df["time_idx"] = np.arange(len(df))
        features = ["time_idx"]
    
    X_train = df[features].values
    y_train = df[target].values

    if model_name == "random_forest":
        model = RandomForestRegressor(n_estimators=hyperparameters.get('n_estimators', 50), random_state=42)
    else:
        model = LinearRegression()

    start_time = time.time()
    model.fit(X_train, y_train)
    training_duration = time.time() - start_time

    # Save the model
    model_id = str(uuid.uuid4())
    model_path = os.path.join(models_dir, f"{model_id}.pkl")
    joblib.dump(model, model_path)

    y_pred_train = model.predict(X_train)
    mae = mean_absolute_error(y_train, y_pred_train)
    rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
    
    margin_of_error = 1.96 * rmse

    last_date = df["date"].iloc[-1]
    
    if len(df) > 1:
        freq = df["date"].iloc[-1] - df["date"].iloc[-2]
    else:
        freq = timedelta(days=1)
        
    future_dates = [last_date + (i+1)*freq for i in range(horizon)]
    
    last_features = df[features].iloc[-1].values
    X_future = np.tile(last_features, (horizon, 1))
    
    if "time_idx" in features:
        idx = features.index("time_idx")
        last_time_idx = df["time_idx"].iloc[-1]
        X_future[:, idx] = np.arange(last_time_idx + 1, last_time_idx + 1 + horizon)

    y_pred_future = model.predict(X_future)

    forecast_data = []
    history_len = min(60, len(df))
    for i in range(len(df) - history_len, len(df)):
        forecast_data.append({
            "date": df["date"].iloc[i].strftime("%Y-%m-%d"),
            "actual": float(df[target].iloc[i]),
            "predicted": float(y_pred_train[i]),
            "bounds": [float(y_pred_train[i] - margin_of_error), float(y_pred_train[i] + margin_of_error)]
        })
        
    for i in range(horizon):
        forecast_data.append({
            "date": future_dates[i].strftime("%Y-%m-%d"),
            "actual": None,
            "predicted": float(y_pred_future[i]),
            "bounds": [float(y_pred_future[i] - margin_of_error), float(y_pred_future[i] + margin_of_error)]
        })

    result = {
        "metrics": {
            "mae": float(mae),
            "rmse": float(rmse)
        },
        "forecastData": forecast_data,
        "modelPath": model_path,
        "trainingDuration": training_duration,
    }

    print(json.dumps(result))

if __name__ == "__main__":
    main()
