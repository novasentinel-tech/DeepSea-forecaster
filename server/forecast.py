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

def train_and_evaluate(model, X, y, n_splits=5):
    """
    Train a model using Time Series Cross-Validation and return metrics.
    """
    tscv = TimeSeriesSplit(n_splits=n_splits)
    mae_scores, rmse_scores = [], []
    residuals = np.array([])
    
    for train_index, test_index in tscv.split(X):
        X_train, X_test = X.iloc[train_index], X.iloc[test_index]
        y_train, y_test = y.iloc[train_index], y.iloc[test_index]

        model.fit(X_train, y_train)
        y_pred_test = model.predict(X_test)
        
        mae_scores.append(mean_absolute_error(y_test, y_pred_test))
        rmse_scores.append(np.sqrt(mean_squared_error(y_test, y_pred_test)))
        residuals = np.concatenate([residuals, y_test - y_pred_test])
        
    return {
        "mae": np.mean(mae_scores),
        "rmse": np.mean(rmse_scores),
        "residual_std": np.std(residuals)
    }

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
    model_choice = request.get("algorithm", "auto")
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
    df = df.ffill().dropna().reset_index(drop=True)

    # --- Feature Engineering ---
    engineered_df = create_features(df.copy(), target)
    engineered_feature_names = [col for col in engineered_df.columns if col.startswith(f'{target}_lag_') or col.startswith(f'{target}_rolling_')]
    date_feature_names = ['dayofweek', 'month', 'year', 'dayofyear', 'weekofyear']
    final_features = sorted(list(set(user_features + engineered_feature_names + date_feature_names)))
    final_features = [f for f in final_features if f in engineered_df.columns and f != target]

    # Drop NaNs created by feature engineering
    final_df = engineered_df.dropna().reset_index(drop=True)
    X = final_df[final_features]
    y = final_df[target]
    
    start_time = time.time()
    
    best_model = None
    best_model_name = ""
    best_metrics = {"rmse": float('inf')}
    comparison_results = {}

    models_to_try = []
    if model_choice == "auto":
        models_to_try = ["linear_regression", "random_forest"]
    else:
        models_to_try = [model_choice]

    for model_name in models_to_try:
        if model_name == "random_forest":
            model_instance = RandomForestRegressor(
                n_estimators=hyperparameters.get('n_estimators', 100),
                max_depth=hyperparameters.get('max_depth', None),
                min_samples_split=hyperparameters.get('min_samples_split', 2),
                random_state=42,
                n_jobs=-1
            )
        else:
            model_instance = LinearRegression()
        
        metrics = train_and_evaluate(model_instance, X, y)
        comparison_results[model_name] = {"rmse": metrics["rmse"]}
        
        if metrics["rmse"] < best_metrics["rmse"]:
            best_metrics = metrics
            best_model = model_instance
            best_model_name = model_name

    # --- Retrain the best model on Full Data ---
    best_model.fit(X, y)
    y_pred_full_insample = best_model.predict(X)

    feature_importance = {}
    if best_model_name == "random_forest":
        importances = best_model.feature_importances_
        feature_importance = dict(sorted(zip(final_features, importances), key=lambda item: item[1], reverse=True))

    training_duration = time.time() - start_time
    
    model_id = str(uuid.uuid4())
    model_path = os.path.join(models_dir, f"{model_id}.pkl")
    joblib.dump(best_model, model_path)

    # --- Generate Future Forecast (Iteratively) ---
    margin_of_error = 1.96 * best_metrics["residual_std"]
    
    history_df = final_df.copy()
    future_predictions = []
    
    last_date = history_df["date"].iloc[-1]
    freq = history_df["date"].diff().median()
    future_dates = pd.date_range(start=last_date + freq, periods=horizon, freq=freq)

    for date in future_dates:
        # Create features for the single next step based on current history
        temp_history_for_features = create_features(history_df, target)
        next_step_features = temp_history_for_features.iloc[[-1]][final_features]
        
        prediction = best_model.predict(next_step_features)[0]
        future_predictions.append(prediction)
        
        # Append the new prediction to history to use in the next iteration
        new_row_dict = {col: [None] for col in history_df.columns}
        new_row_dict['date'] = [date]
        new_row_dict[target] = [prediction]
        new_row = pd.DataFrame(new_row_dict)
        
        history_df = pd.concat([history_df, new_row], ignore_index=True)

    # --- Construct Chart Data ---
    forecast_data = []
    
    for i in range(len(final_df)):
        forecast_data.append({
            "date": final_df["date"].iloc[i].strftime("%Y-%m-%d"),
            "actual": float(final_df[target].iloc[i]),
            "predicted": float(y_pred_full_insample[i]),
            "bounds": None
        })
        
    for i in range(horizon):
        forecast_data.append({
            "date": future_dates[i].strftime("%Y-%m-%d"),
            "actual": None,
            "predicted": float(future_predictions[i]),
            "bounds": [float(future_predictions[i] - margin_of_error), float(future_predictions[i] + margin_of_error)]
        })

    result = {
        "metrics": {
            "mae": float(best_metrics["mae"]),
            "rmse": float(best_metrics["rmse"])
        },
        "featuresUsed": final_features,
        "forecastData": forecast_data,
        "modelPath": model_path,
        "trainingDuration": training_duration,
        "featureImportance": feature_importance,
        "trainingConfig": {
            "modelUsed": best_model_name,
            "algorithmChoice": model_choice,
            "comparison": comparison_results,
            "hyperparameters": hyperparameters if best_model_name == 'random_forest' else {},
            "splits": 5,
            "featureEngineering": True
        }
    }

    print(json.dumps(result, allow_nan=False))

if __name__ == "__main__":
    main()
