import sys
import json
import logging
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import TimeSeriesSplit
from datetime import timedelta
import time
import joblib
import os
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

def create_features(df, target_variable):
    """
    Creates time series features from a datetime index.

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame with a 'date' column.
    target_variable : str
        Name of the target column.

    Returns
    -------
    pd.DataFrame
        DataFrame with original columns plus new engineered features.
    """
    # Make a copy to avoid modifying the original DataFrame
    df = df.copy()
    df['date'] = pd.to_datetime(df['date'])
    
    # Date-based features
    df['dayofweek'] = df['date'].dt.dayofweek
    df['month'] = df['date'].dt.month
    df['year'] = df['date'].dt.year
    df['dayofyear'] = df['date'].dt.dayofyear
    df['weekofyear'] = df['date'].dt.isocalendar().week.astype(int)
    df['is_weekend'] = (df['dayofweek'] >= 5).astype(int)   # Saturday=5, Sunday=6
    
    # Placeholder for holiday feature - in a real scenario you would merge with an external holiday calendar
    # For demonstration, we treat holidays as weekends (can be replaced with actual holiday data)
    # Here we just create an empty column; in production you would populate it.
    # Since we cannot know future holidays without external data, we'll leave it as 0 for now.
    df['is_holiday'] = 0  # Placeholder: user can override if they provide holiday data

    # Lag features (only past values, no future leakage)
    for lag in [1, 7, 14]:
        df[f'{target_variable}_lag_{lag}'] = df[target_variable].shift(lag)

    # Rolling window features (also only use past data)
    for window in [7, 14]:
        df[f'{target_variable}_rolling_mean_{window}'] = df[target_variable].rolling(window=window).mean()
        df[f'{target_variable}_rolling_std_{window}'] = df[target_variable].rolling(window=window).std()

    return df

def calculate_metrics(y_true, y_pred):
    """
    Calculate multiple regression metrics.

    Parameters
    ----------
    y_true : array-like
        True target values.
    y_pred : array-like
        Predicted target values.

    Returns
    -------
    dict
        Dictionary with MAE, RMSE, R², and MAPE.
    """
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    
    # MAPE: avoid division by zero by replacing zeros with a small number or ignore them
    # Here we use a safe version: filter out zeros in y_true
    y_true_safe = np.array(y_true)
    y_pred_safe = np.array(y_pred)
    non_zero_mask = y_true_safe != 0
    if np.any(non_zero_mask):
        mape = np.mean(np.abs((y_true_safe[non_zero_mask] - y_pred_safe[non_zero_mask]) / y_true_safe[non_zero_mask])) * 100
    else:
        mape = np.nan
    
    return {
        "mae": mae,
        "rmse": rmse,
        "r2": r2,
        "mape": mape
    }

def train_and_evaluate(model, X, y, n_splits=5):
    """
    Train a model using Time Series Cross-Validation and return metrics.

    Parameters
    ----------
    model : sklearn estimator
        The model to train.
    X : pd.DataFrame
        Feature matrix.
    y : pd.Series
        Target vector.
    n_splits : int
        Number of splits for time series cross-validation.

    Returns
    -------
    dict
        Dictionary with average MAE, RMSE, residual standard deviation, and also per-fold details.
    """
    tscv = TimeSeriesSplit(n_splits=n_splits)
    mae_scores, rmse_scores, r2_scores, mape_scores = [], [], [], []
    residuals = np.array([])
    fold_details = []

    for fold, (train_index, test_index) in enumerate(tscv.split(X)):
        X_train, X_test = X.iloc[train_index], X.iloc[test_index]
        y_train, y_test = y.iloc[train_index], y.iloc[test_index]

        model.fit(X_train, y_train)
        y_pred_test = model.predict(X_test)

        # Calculate metrics for this fold
        fold_metrics = calculate_metrics(y_test, y_pred_test)
        mae_scores.append(fold_metrics["mae"])
        rmse_scores.append(fold_metrics["rmse"])
        r2_scores.append(fold_metrics["r2"])
        mape_scores.append(fold_metrics["mape"])
        residuals = np.concatenate([residuals, y_test - y_pred_test])
        
        fold_details.append({
            "fold": fold + 1,
            "train_size": len(train_index),
            "test_size": len(test_index),
            "mae": fold_metrics["mae"],
            "rmse": fold_metrics["rmse"],
            "r2": fold_metrics["r2"],
            "mape": fold_metrics["mape"]
        })

    return {
        "mae": np.mean(mae_scores),
        "rmse": np.mean(rmse_scores),
        "r2": np.mean(r2_scores),
        "mape": np.mean(mape_scores),
        "residual_std": np.std(residuals),
        "fold_details": fold_details
    }

def infer_frequency(dates):
    """
    Infer the most common frequency between consecutive dates.

    Parameters
    ----------
    dates : pd.Series
        Sorted datetime series.

    Returns
    -------
    pd.Timedelta or None
        Inferred frequency, or None if cannot determine.
    """
    if len(dates) < 2:
        return None
    diffs = dates.diff().dropna()
    # Use the most frequent diff as frequency
    mode_diff = diffs.mode()
    if len(mode_diff) > 0:
        return mode_diff.iloc[0]
    # Fallback to median
    return diffs.median()

def main():
    # Ensure models directory exists
    models_dir = 'models'
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
        logger.info(f"Created directory: {models_dir}")

    # Read input from stdin
    input_str = sys.stdin.read()
    if not input_str:
        logger.error("No input received")
        print(json.dumps({"error": "No input received"}))
        return

    try:
        request = json.loads(input_str)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON input: {e}")
        print(json.dumps({"error": "Invalid JSON input"}))
        sys.exit(1)

    data = request.get("data", [])
    target = request.get("targetVariable")
    user_features = request.get("features", [])
    model_choice = request.get("algorithm", "auto")
    hyperparameters = request.get("hyperparameters", {})
    horizon = request.get("horizon", 30)
    forecast_start_date_str = request.get("forecastStartDate")


    # Validate input
    if not data or not target:
        logger.error("Missing data or target variable")
        print(json.dumps({"error": "Missing data or target variable"}))
        sys.exit(1)

    df = pd.DataFrame(data)

    if "date" not in df.columns:
        logger.error("Input data must contain a 'date' column")
        print(json.dumps({"error": "Input data must contain a 'date' column."}))
        sys.exit(1)

    # Convert date and sort
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    # Check for duplicate dates
    if df["date"].duplicated().any():
        logger.warning("Duplicate dates found. Keeping first occurrence.")
        df = df.drop_duplicates(subset=["date"], keep="first").reset_index(drop=True)

    # Data Cleaning: forward fill and drop remaining NaNs (no data leakage)
    df = df.ffill().dropna().reset_index(drop=True)
    logger.info(f"Data shape after cleaning: {df.shape}")

    # Feature Engineering
    logger.info("Creating features...")
    engineered_df = create_features(df.copy(), target)
    engineered_feature_names = [col for col in engineered_df.columns if col.startswith(f'{target}_lag_') or col.startswith(f'{target}_rolling_')]
    date_feature_names = ['dayofweek', 'month', 'year', 'dayofyear', 'weekofyear', 'is_weekend', 'is_holiday']
    final_features = sorted(list(set(user_features + engineered_feature_names + date_feature_names)))
    final_features = [f for f in final_features if f in engineered_df.columns and f != target]

    # Drop rows with NaNs created by lags/rolling
    final_df = engineered_df.dropna().reset_index(drop=True)
    logger.info(f"Final data shape after feature engineering (NaNs dropped): {final_df.shape}")

    if len(final_df) < 20: # Arbitrary threshold, needs enough data for even one split
        logger.error("No data left after feature engineering. Possibly too short series.")
        print(json.dumps({"error": "Insufficient data after feature engineering to perform validation. Please provide a longer time series."}))
        sys.exit(1)

    X = final_df[final_features]
    y = final_df[target]

    logger.info(f"Features used: {final_features}")
    logger.info(f"Number of samples: {len(X)}")

    # Start timing
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
        logger.info(f"Training {model_name}...")
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
        comparison_results[model_name] = {"rmse": metrics["rmse"], "mae": metrics["mae"], "r2": metrics["r2"]}

        if metrics["rmse"] < best_metrics["rmse"]:
            best_metrics = metrics
            best_model = model_instance
            best_model_name = model_name

    logger.info(f"Best model: {best_model_name} with RMSE={best_metrics['rmse']:.4f}")

    # Retrain best model on full data
    logger.info("Retraining best model on full dataset...")
    best_model.fit(X, y)
    y_pred_full_insample = best_model.predict(X)

    # Feature importance (if applicable)
    feature_importance = {}
    if best_model_name == "random_forest":
        importances = best_model.feature_importances_
        feature_importance = dict(sorted(zip(final_features, importances), key=lambda item: item[1], reverse=True))
        logger.info("Feature importance calculated.")

    training_duration = time.time() - start_time
    logger.info(f"Training completed in {training_duration:.2f} seconds")

    # Save model
    model_id = str(uuid.uuid4())
    model_path = os.path.join(models_dir, f"{model_id}.pkl")
    joblib.dump(best_model, model_path)
    logger.info(f"Model saved to {model_path}")

    # --- Generate Future Forecast (Iteratively) ---
    margin_of_error = 1.96 * best_metrics["residual_std"]

    history_df = final_df.copy()
    future_predictions = []

    last_date = history_df["date"].iloc[-1]
    freq = infer_frequency(history_df["date"])
    if freq is None:
        freq = pd.Timedelta(days=1)  # default to daily
        logger.warning("Could not infer frequency; defaulting to daily.")
        
    start_date = pd.to_datetime(forecast_start_date_str) if forecast_start_date_str else (last_date + freq)

    future_dates = pd.date_range(start=start_date, periods=horizon, freq=freq)
    logger.info(f"Forecasting {horizon} steps ahead with frequency {freq}")

    for date in future_dates:
        temp_history_for_features = create_features(history_df, target)
        next_step_features = temp_history_for_features.iloc[[-1]][final_features]
        prediction = best_model.predict(next_step_features)[0]
        future_predictions.append(prediction)

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

    # --- Assemble result JSON ---
    result = {
        "metrics": {
            "mae": float(best_metrics["mae"]),
            "rmse": float(best_metrics["rmse"]),
            "r2": float(best_metrics["r2"]),
            "mape": float(best_metrics["mape"]) if not np.isnan(best_metrics["mape"]) else None,
            "residual_std": float(best_metrics["residual_std"])
        },
        "featuresUsed": final_features,
        "autoGeneratedFeatures": {
            "lag": [1, 7, 14],
            "rolling_mean": [7, 14],
            "rolling_std": [7, 14],
            "date_features": date_feature_names
        },
        "forecastData": forecast_data,
        "modelPath": model_path,
        "trainingDuration": training_duration,
        "featureImportance": feature_importance,
        "trainingConfig": {
            "modelUsed": best_model_name,
            "algorithmChoice": model_choice,
            "comparison": comparison_results,
            "hyperparameters": hyperparameters if best_model_name == 'random_forest' else {},
            "crossValidation": {
                "method": "TimeSeriesSplit",
                "n_splits": 5,
                "fold_details": best_metrics.get("fold_details", [])
            },
            "featureEngineering": True,
            "confidenceInterval": "95% (based on residual std dev)",
            "frequency": str(freq)
        }
    }

    print(json.dumps(result, allow_nan=False))
    logger.info("Forecast generation completed successfully.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        import traceback
        import sys
        import json

        # Captura o traceback completo
        tb = traceback.format_exc()

        # Log no console (opcional, mas útil)
        print(tb, file=sys.stderr)

        # Retorna um JSON consistente com erro
        print(json.dumps({
            "error": str(e),
            "traceback": tb
        }))
        sys.exit(1)

    