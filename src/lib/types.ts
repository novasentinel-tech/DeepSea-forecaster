export interface FileDetails {
  rows: number;
  columns: string[];
  datetime_column: string;
  numeric_columns: string[];
  created_at: string;
  size_mb: number;
  memory_usage_mb: number;
}

export interface FileList {
  total: number;
  files: Record<string, FileDetails>;
}

export interface ModelDetails {
  type: 'lstm' | 'prophet';
  file_id: string;
  lookback?: number;
  epochs?: number;
  batch_size?: number;
  numeric_cols: string[];
  train_loss?: number;
  created_at: string;
  status: string;
  predictions_count: number;
}

export interface ModelList {
  total: number;
  models: Record<string, ModelDetails>;
}

export interface Anomaly {
  period: number;
  value: number;
  zscore: number;
  anomaly_type: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  models_in_memory?: number;
  dataframes_in_memory?: number;
  version?: string;
  name?: string;
  models_loaded?: number;
  files_uploaded?: number;
}

export interface ForecastData {
  model_id: string;
  model_type: 'lstm' | 'prophet';
  forecast_date: string;
  periods: number;

  forecast: {
    values: number[][];
    column_names: string[];
    data_type: string;
  };

  timestamps: {
    dates: string[];
    datetimes: string[];
    unix_timestamps: number[];
    interval: string;
    timezone: string;
  };

  confidence_intervals?: {
    lower_bound_95: number[][];
    upper_bound_95: number[][];
    lower_bound_80: number[][];
    upper_bound_80: number[][];
  };
  
  uncertainties?: {
    trend_uncertainty: number[];
    seasonal_uncertainty: number[];
    observation_error: number;
    confidence_interval_95: {
      lower: number[];
      upper: number[];
    };
  };

  actual_vs_forecast: {
    actual_last_24?: number[][];
    actual?: number[];
    forecast_24?: number[][];
    forecast?: number[]; // Can be null for prophet
    mean_absolute_error?: number;
    rmse: number;
    mape: number;
    r2?: number;
    directional_accuracy?: number;
  };

  statistics: {
    forecast_mean: number;
    forecast_std: number;
    forecast_min: number;
    forecast_max: number;
    forecast_median?: number;
    forecast_percentile_25?: number;
    forecast_percentile_75?: number;
    volatility?: number;
    confidence_level?: number;
  };

  technical_indicators?: {
    rsi: Record<string, any>;
    macd: Record<string, any>;
    bollinger_bands: Record<string, any>;
    moving_averages: Record<string, any>;
  };

  trend_analysis?: {
    overall_trend: 'upward' | 'downward' | 'sideways';
    trend_strength: number;
    slope: number;
    change_percent: number;
    volatility_forecast: number;
  };
  
  forecast_components?: {
    trend: number[];
    yearly_seasonality: number[];
    weekly_seasonality: number[];
    monthly_seasonality?: number[];
    holiday_effects: any[];
  };

  anomalies?: {
    detected: boolean;
    count: number;
    anomalies: Anomaly[];
  };

  correlation_analysis?: {
    forecast_vs_volume: number;
    forecast_vs_rsi: number;
    forecast_vs_macd: number;
    with_historical_data: number;
  };

  performance_summary?: {
    model_confidence: number;
    prediction_reliability: 'high' | 'medium' | 'low';
    recommendation: string;
    risk_level: 'low' | 'medium' | 'high';
  };
  
  generated_at: string;
  execution_time_ms: number;
  cache_hit?: boolean;
}

export interface TrainLSTMResponse {
    model_id: string;
    model_type: string;
    rows_used: number;
    features: number;
    training_data: Record<string, any>;
    metrics: Record<string, any>;
    training_history: Record<string, any>;
    model_stats: Record<string, any>;
    data_info: Record<string, any>;
    performance: Record<string, any>;
    created_at: string;
    expires_at: string | null;
    status: string;
}

export interface TrainProphetResponse {
  model_id: string;
  model_type: string;
  prophet_config: Record<string, any>;
  seasonality_analysis: Record<string, any>;
  trend_analysis: Record<string, any>;
  metrics: Record<string, any>;
  model_components: Record<string, any>;
  data_summary: Record<string, any>;
  training_time_seconds: number;
  created_at: string;
}

export interface UploadCSVResponse {
  file_id: string;
  rows: number;
  columns: string[];
  datetime_column: string;
  numeric_columns: string[];
  uploaded_at: string;
}
