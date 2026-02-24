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
    # Make a copy to avoid modifying the original DataFrame
    df = df.copy()
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
    
    # --- Data Cleaning (No Data Leakage) ---
    # Use forward fill and then drop any remaining NaNs at the beginning
    df = df.ffill().dropna()
    df = df.reset_index(drop=True)

    # --- Feature Engineering ---
    engineered_df = create_features(df.copy(), target)
    
    engineered_feature_names = [col for col in engineered_df.columns if col.startswith(f'{target}_lag_') or col.startswith(f'{target}_rolling_')]
    date_feature_names = ['dayofweek', 'month', 'year', 'dayofyear', 'weekofyear']
    
    final_features = sorted(list(set(user_features + engineered_feature_names + date_feature_names)))
    final_features = [f for f in final_features if f in engineered_df.columns and f != target]

    # Drop NaNs created by feature engineering
    engineered_df = engineered_df.dropna().reset_index(drop=True)
    
    X = engineered_df[final_features]
    y = engineered_df[target]

    # --- Time Series Cross-Validation ---
    n_splits = 5
    tscv = TimeSeriesSplit(n_splits=n_splits)
    
    mae_scores = []
    rmse_scores = []
    residuals = np.array([])
    
    start_time = time.time()
    for train_index, test_index in tscv.split(X):
        X_train, X_test = X.iloc[train_index], X.iloc[test_index]
        y_train, y_test = y.iloc[train_index], y.iloc[test_index]

        if model_name == "random_forest":
            model_cv = RandomForestRegressor(
                n_estimators=hyperparameters.get('n_estimators', 100),
                max_depth=hyperparameters.get('max_depth', None),
                min_samples_split=hyperparameters.get('min_samples_split', 2),
                random_state=42,
                n_jobs=-1
            )
        else:
            model_cv = LinearRegression()

        model_cv.fit(X_train, y_train)
        y_pred_test = model_cv.predict(X_test)
        
        mae_scores.append(mean_absolute_error(y_test, y_pred_test))
        rmse_scores.append(np.sqrt(mean_squared_error(y_test, y_pred_test)))
        residuals = np.concatenate([residuals, y_test - y_pred_test])
    
    training_duration = time.time() - start_time

    # Calculate average metrics and residual std
    avg_mae = np.mean(mae_scores)
    avg_rmse = np.mean(rmse_scores)
    residual_std = np.std(residuals)

    # --- Retrain on Full Data for Future Predictions and Feature Importance ---
    if model_name == "random_forest":
        full_model = RandomForestRegressor(
            n_estimators=hyperparameters.get('n_estimators', 100),
            max_depth=hyperparameters.get('max_depth', None),
            min_samples_split=hyperparameters.get('min_samples_split', 2),
            random_state=42,
            n_jobs=-1
        )
    else:
        full_model = LinearRegression()
        
    full_model.fit(X, y)
    y_pred_full_insample = full_model.predict(X)

    feature_importance = {}
    if model_name == "random_forest":
        importances = full_model.feature_importances_
        feature_importance = dict(sorted(zip(final_features, importances), key=lambda item: item[1], reverse=True))

    model_id = str(uuid.uuid4())
    model_path = os.path.join(models_dir, f"{model_id}.pkl")
    joblib.dump(full_model, model_path)

    # --- Generate Future Forecast (Iteratively) ---
    margin_of_error = 1.96 * residual_std
    
    history = engineered_df.copy()
    y_pred_future = []
    
    last_date = history["date"].iloc[-1]
    freq = history["date"].diff().median()
    future_dates = pd.date_range(start=last_date + freq, periods=horizon, freq=freq)

    for date in future_dates:
        # Create features for the single next step
        next_step_df = history.iloc[[-1]].copy()
        next_step_df['date'] = date
        
        # Recalculate date-based features
        next_step_df['dayofweek'] = next_step_df['date'].dt.dayofweek
        next_step_df['month'] = next_step_df['date'].dt.month
        next_step_df['year'] = next_step_df['date'].dt.year
        next_step_df['dayofyear'] = next_step_df['date'].dt.dayofyear
        next_step_df['weekofyear'] = next_step_df['date'].dt.isocalendar().week.astype(int)

        X_next = next_step_df[final_features]
        prediction = full_model.predict(X_next)[0]
        y_pred_future.append(prediction)
        
        # Append the prediction to history to be used for next step's features
        new_row = next_step_df.copy()
        new_row[target] = prediction
        history = pd.concat([history, new_row], ignore_index=True)
        # Re-create lag/rolling features based on the new "history"
        history = create_features(history, target)

    # --- Construct Chart Data ---
    forecast_data = []
    
    for i in range(len(engineered_df)):
        forecast_data.append({
            "date": engineered_df["date"].iloc[i].strftime("%Y-%m-%d"),
            "actual": float(engineered_df[target].iloc[i]),
            "predicted": float(y_pred_full_insample[i]),
            "bounds": None # No bounds for historical fit for clarity
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
            "mae": float(avg_mae),
            "rmse": float(avg_rmse)
        },
        "featuresUsed": final_features,
        "forecastData": forecast_data,
        "modelPath": model_path,
        "trainingDuration": training_duration,
        "featureImportance": feature_importance,
        "trainingConfig": {
            "model": model_name,
            "hyperparameters": hyperparameters,
            "splits": n_splits,
            "featureEngineering": True
        }
    }

    print(json.dumps(result, allow_nan=False))

if __name__ == "__main__":
    main()
