import sys
import json
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import TimeSeriesSplit
from datetime import timedelta
import time
import joblib
import os
import uuid

def create_features(df, target_variable):
    """
    Creates time series features from a datetime index.
    """
    df['date'] = pd.to_datetime(df['date'])
    df['dayofweek'] = df['date'].dt.dayofweek
    df['month'] = df['date'].dt.month
    df['year'] = df['date'].dt.year
    df['dayofyear'] = df['date'].dt.dayofyear
    df['weekofyear'] = df['date'].dt.isocalendar().week.astype(int)
    
    # Lag features
    for lag in [1, 7, 14]:
        df[f'{target_variable}_lag_{lag}'] = df[target_variable].shift(lag)
        
    # Rolling window features
    for window in [7, 14]:
        df[f'{target_variable}_rolling_mean_{window}'] = df[target_variable].rolling(window=window).mean()
        df[f'{target_variable}_rolling_std_{window}'] = df[target_variable].rolling(window=window).std()
        
    # Use backfill to handle NaNs created by shift and rolling
    df = df.bfill()
    return df

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
    user_features = request.get("features", [])
    model_name = request.get("modelUsed", "linear_regression")
    hyperparameters = request.get("hyperparameters", {})
    horizon = request.get("horizon", 30)

    if not data or not target:
        print(json.dumps({"error": "Missing data or target variable"}))
        sys.exit(1)

    df = pd.DataFrame(data)
    
    if "date" not in df.columns:
        print(json.dumps({"error": "Input data must contain a 'date' column."}))
        sys.exit(1)
        
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)
    df = df.ffill().bfill() # Initial fill for any existing gaps

    # --- Feature Engineering ---
    engineered_df = create_features(df.copy(), target)
    
    engineered_feature_names = [col for col in engineered_df.columns if col.startswith(f'{target}_lag_') or col.startswith(f'{target}_rolling_')]
    date_feature_names = ['dayofweek', 'month', 'year', 'dayofyear', 'weekofyear']
    
    final_features = sorted(list(set(user_features + engineered_feature_names + date_feature_names)))
    
    # Ensure all final features exist in the dataframe and are not the target
    final_features = [f for f in final_features if f in engineered_df.columns and f != target]

    X = engineered_df[final_features]
    y = engineered_df[target]

    # --- Time Series Cross-Validation ---
    tscv = TimeSeriesSplit(n_splits=5)
    train_index, test_index = list(tscv.split(X))[-1]
    
    X_train, X_test = X.iloc[train_index], X.iloc[test_index]
    y_train, y_test = y.iloc[train_index], y.iloc[test_index]

    if model_name == "random_forest":
        model = RandomForestRegressor(
            n_estimators=hyperparameters.get('n_estimators', 100),
            max_depth=hyperparameters.get('max_depth', None),
            min_samples_split=hyperparameters.get('min_samples_split', 2),
            random_state=42,
            n_jobs=-1
        )
    else:
        model = LinearRegression()

    start_time = time.time()
    model.fit(X_train, y_train)
    training_duration = time.time() - start_time

    # --- Evaluate on Test Set ---
    y_pred_test = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    
    # --- Retrain on Full Data for Future Predictions ---
    full_model = model.fit(X, y)
    
    model_id = str(uuid.uuid4())
    model_path = os.path.join(models_dir, f"{model_id}.pkl")
    joblib.dump(full_model, model_path)

    # --- Generate Future Forecast ---
    margin_of_error = 1.96 * rmse
    last_date = engineered_df["date"].iloc[-1]
    freq = engineered_df["date"].diff().median()
    
    future_dates = pd.date_range(start=last_date + freq, periods=horizon, freq=freq)
    future_df = pd.DataFrame({'date': future_dates})

    # For future predictions, we need to create features for the future dates.
    # This involves carrying over last known values and then iteratively predicting.
    # For a simpler but effective approach, we'll create features based on the available data.
    
    full_history_df = pd.concat([engineered_df, future_df], ignore_index=True)
    full_history_df = create_features(full_history_df, target) # This will create date features and NaNs for lags/rolling
    
    X_future = full_history_df[final_features].iloc[-horizon:]
    
    y_pred_future = full_model.predict(X_future)
    
    y_pred_full_insample = full_model.predict(X)

    # --- Construct Chart Data ---
    forecast_data = []
    history_len = min(120, len(df))
    start_idx = len(df) - history_len
    
    for i in range(start_idx, len(df)):
        is_test_sample = i in test_index
        forecast_data.append({
            "date": df["date"].iloc[i].strftime("%Y-%m-%d"),
            "actual": float(df[target].iloc[i]),
            "predicted": float(y_pred_full_insample[i]),
            # Only show confidence bounds for test set and future predictions
            "bounds": [float(y_pred_full_insample[i] - margin_of_error), float(y_pred_full_insample[i] + margin_of_error)] if is_test_sample else None
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
        "featuresUsed": final_features,
        "forecastData": forecast_data,
        "modelPath": model_path,
        "trainingDuration": training_duration,
    }

    print(json.dumps(result, allow_nan=False))

if __name__ == "__main__":
    main()
