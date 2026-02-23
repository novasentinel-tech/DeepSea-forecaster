import sys
import json
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from datetime import timedelta

def main():
    # Read input from stdin
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
    horizon = request.get("horizon", 30)

    if not data or not target:
        print(json.dumps({"error": "Missing data or target variable"}))
        sys.exit(1)

    df = pd.DataFrame(data)
    
    # Ensure date column exists and is datetime
    if "date" not in df.columns:
        # Generate a fake date index if missing
        df["date"] = pd.date_range(start="2020-01-01", periods=len(df), freq="D")
    else:
        df["date"] = pd.to_datetime(df["date"])

    df = df.sort_values("date").reset_index(drop=True)
    
    # Handle missing values
    df = df.ffill().bfill()

    # If features list is empty, create a simple time index feature
    if not features:
        df["time_idx"] = np.arange(len(df))
        features = ["time_idx"]
    
    # Prepare training data
    X_train = df[features].values
    y_train = df[target].values

    # Initialize model
    if model_name == "random_forest":
        model = RandomForestRegressor(n_estimators=50, random_state=42)
    else:
        model = LinearRegression()

    # Train model
    model.fit(X_train, y_train)

    # Calculate metrics on training data
    y_pred_train = model.predict(X_train)
    mae = mean_absolute_error(y_train, y_pred_train)
    rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
    
    # Simple heuristic for prediction intervals (95% CI)
    # Using RMSE as an estimate of standard deviation of errors
    margin_of_error = 1.96 * rmse

    # Prepare future data points
    last_date = df["date"].iloc[-1]
    
    # Try to infer frequency, fallback to Days
    if len(df) > 1:
        freq = df["date"].iloc[-1] - df["date"].iloc[-2]
    else:
        freq = timedelta(days=1)
        
    future_dates = [last_date + (i+1)*freq for i in range(horizon)]
    
    # Prepare future features
    # For MVP, we forward-fill the last known feature values
    last_features = df[features].iloc[-1].values
    X_future = np.tile(last_features, (horizon, 1))
    
    # If using time_idx, we should increment it
    if "time_idx" in features:
        idx = features.index("time_idx")
        last_time_idx = df["time_idx"].iloc[-1]
        X_future[:, idx] = np.arange(last_time_idx + 1, last_time_idx + 1 + horizon)

    # Predict future
    y_pred_future = model.predict(X_future)

    # Format output
    forecast_data = []
    
    # Add historical data (last 30 points to avoid huge payload)
    history_len = min(60, len(df))
    for i in range(len(df) - history_len, len(df)):
        forecast_data.append({
            "date": df["date"].iloc[i].strftime("%Y-%m-%d"),
            "actual": float(df[target].iloc[i]),
            "predicted": float(y_pred_train[i]),
            "bounds": [float(y_pred_train[i] - margin_of_error), float(y_pred_train[i] + margin_of_error)]
        })
        
    # Add future predictions
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
        "forecastData": forecast_data
    }

    print(json.dumps(result))

if __name__ == "__main__":
    main()
