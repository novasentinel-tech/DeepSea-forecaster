# **App Name**: DeepSea Forecaster

## Core Features:

- CSV Data Upload: Allow users to upload CSV files containing time series data via the `/upload_csv` endpoint.
- LSTM Model Training: Train LSTM models using uploaded data via the `/train_lstm` endpoint, with configurable parameters such as lookback, epochs, and batch size.
- Prophet Model Training: Train Prophet models using uploaded data via the `/train_prophet` endpoint, allowing for configurations of quarterly and yearly seasonality.
- LSTM Forecasting: Generate forecasts using trained LSTM models via the `/forecast_lstm` endpoint, displaying a range of metrics.
- Model Performance Tool: Use the model confidence score, prediction reliability rating, recommendation, and risk level returned in the JSON to create a plain text analysis summary for display in the UI. In its reasoning, the LLM tool should attempt to follow this pattern: Confidence of X%, prediction reliability rating of Y, giving the investment advice of Z, with a risk level of W.
- List Models and Files: Enable users to list available models and uploaded files using the `/models` and `/files` endpoints for management and selection.
- Technical Analysis: Use data provided by the /technical_analysis endpoint to automatically create a detailed technical analysis report. Use values and signals from RSI, MACD, Bollinger Bands and moving averages in the technical analysis. Use an LLM reasoning tool to determine overall buy or sell signals from these data. Note any anomalies detected by the anomaly detectors, and assess the risks, rewards and uncertainties that are summarized in the API output.

## Style Guidelines:

- Primary color: Deep blue (#293B5F) to reflect depth and reliability. It is similar in hue but is heavily desaturated compared to cobalt or cerulean.
- Background color: Light gray (#E5E9F2) to provide a clean and modern backdrop.
- Accent color: Teal (#39A7A7) to highlight interactive elements and provide a sense of calm and clarity. The accent will offer strong contrast against the light-toned background.
- Body and headline font: 'Inter', a grotesque-style sans-serif known for its modern, neutral, and objective appearance, which will ensure readability and clarity throughout the application.
- Use minimalist line icons to represent various data points and functions. Icons should be in the teal accent color (#39A7A7) for consistency.
- Maintain a clean, data-centric layout with clear sections for data upload, model training, forecasting, and analysis results. Use white space effectively to avoid clutter.
- Subtle transitions and loading animations to enhance user experience during data processing and model training. Keep animations brief and purposeful.