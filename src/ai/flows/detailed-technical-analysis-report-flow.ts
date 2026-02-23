'use server';
/**
 * @fileOverview A Genkit flow for generating a detailed technical analysis report.
 *
 * - detailedTechnicalAnalysisReport - A function that generates a comprehensive technical analysis report.
 * - DetailedTechnicalAnalysisReportInput - The input type for the detailedTechnicalAnalysisReport function.
 * - DetailedTechnicalAnalysisReportOutput - The return type for the detailedTechnicalAnalysisReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import 'dotenv/config'; // Load environment variables

// Define the input schema
const DetailedTechnicalAnalysisReportInputSchema = z.object({
  modelId: z.string().describe('The ID of the trained model (LSTM or Prophet).'),
  periods: z.number().default(24).describe('The number of periods for the forecast and analysis.'),
});
export type DetailedTechnicalAnalysisReportInput = z.infer<typeof DetailedTechnicalAnalysisReportInputSchema>;

// Define the output schema
const DetailedTechnicalAnalysisReportOutputSchema = z.object({
  report: z.string().describe('A detailed technical analysis report.'),
});
export type DetailedTechnicalAnalysisReportOutput = z.infer<typeof DetailedTechnicalAnalysisReportOutputSchema>;

// --- API Client Helper (based on provided example) ---
class TOTEMDeepseaClient {
  private apiKey: string;
  private apiHost: string;

  constructor(apiKey: string, apiHost: string) {
    if (!apiKey) {
      throw new Error('API_KEY is not provided.');
    }
    if (!apiHost) {
      throw new Error('API_HOST is not provided.');
    }
    this.apiKey = apiKey;
    this.apiHost = apiHost;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.apiHost}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  async getTechnicalAnalysis(modelId: string, periods: number): Promise<any> {
    return this.request(`/technical_analysis/${modelId}?periods=${periods}`);
  }

  async forecastLSTM(modelId: string, periods: number): Promise<any> {
    return this.request(`/forecast_lstm?model_id=${modelId}&periods=${periods}`);
  }

  async forecastProphet(modelId: string, periods: number): Promise<any> {
    return this.request(`/forecast_prophet?model_id=${modelId}&periods=${periods}`);
  }
}

// Instantiate the client with environment variables
const API_KEY = process.env.API_KEY;
const API_HOST = process.env.API_HOST;

if (!API_KEY || !API_HOST) {
  throw new Error('API_KEY or API_HOST environment variables are not set. Please check your .env file or deployment configuration.');
}

const deepseaClient = new TOTEMDeepseaClient(API_KEY, API_HOST);

// Define the prompt
const detailedTechnicalAnalysisReportPrompt = ai.definePrompt({
  name: 'detailedTechnicalAnalysisReportPrompt',
  input: {
    schema: z.object({
      technicalAnalysisData: z.any().describe('Raw JSON data from the /technical_analysis endpoint.'),
      forecastData: z.any().describe('Raw JSON data from the /forecast_lstm or /forecast_prophet endpoint.'),
      modelConfidencePercentage: z.number().describe('Model confidence as a percentage.'),
      anomaliesWithIndex: z.array(z.object({
        period: z.number(),
        value: z.number(),
        zscore: z.number(),
        anomaly_type: z.string(),
        index: z.number(), // Added for display
      })).describe('Anomalies with their 1-based index.'),
    }),
  },
  output: {
    schema: DetailedTechnicalAnalysisReportOutputSchema,
  },
  prompt: `You are an expert financial analyst. Your task is to generate a detailed technical analysis report based on the provided forecast and technical indicator data.

Synthesize the data from RSI, MACD, Bollinger Bands, and Moving Averages.
Determine an an overall buy/sell/hold signal and provide a concise recommendation.
Identify and describe any detected anomalies, their potential impact, and assess the overall risks, rewards, and uncertainties summarized in the API output.

Structure your report clearly with the following sections:

## Technical Analysis Report for Model: {{{forecastData.model_id}}}

### 1. Overall Market Sentiment and Recommendation
Based on the synthesized data, what is the overall market sentiment (bullish, bearish, neutral) and your primary recommendation (STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL)? Explain your reasoning briefly.

Overall Recommendation: {{{forecastData.performance_summary.recommendation}}}
Overall Signal: {{{technicalAnalysisData.signals.overall_signal}}}
Confidence: {{modelConfidencePercentage}}%
Prediction Reliability: {{{forecastData.performance_summary.prediction_reliability}}}
Risk Level: {{{forecastData.performance_summary.risk_level}}}

### 2. Key Technical Indicators

#### Relative Strength Index (RSI)
- Current Value: {{{technicalAnalysisData.indicators.rsi.values.0}}}
- Interpretation: {{{technicalAnalysisData.indicators.rsi.interpretation}}}
- Thresholds: Overbought ({{{technicalAnalysisData.indicators.rsi.threshold_overbought}}}), Oversold ({{{technicalAnalysisData.indicators.rsi.threshold_oversold}}})
- Insights: Describe what the RSI indicates about the current momentum.

#### Moving Average Convergence Divergence (MACD)
- MACD Line: {{{technicalAnalysisData.indicators.macd.macd.0}}}
- Signal Line: {{{technicalAnalysisData.indicators.macd.signal.0}}}
- Histogram: {{{technicalAnalysisData.indicators.macd.histogram.0}}}
- Signal Cross: {{{technicalAnalysisData.indicators.macd.signal_cross}}}
- Insights: Explain the implications of the MACD lines and histogram. Is there a bullish or bearish crossover?

#### Bollinger Bands
- Upper Band: {{{technicalAnalysisData.indicators.bollinger_bands.upper.0}}}
- Middle Band (SMA): {{{technicalAnalysisData.indicators.bollinger_bands.middle.0}}}
- Lower Band: {{{technicalAnalysisData.indicators.bollinger_bands.lower.0}}}
- Bandwidth: {{{technicalAnalysisData.indicators.bollinger_bands.band_width}}}
- Price Position: {{{technicalAnalysisData.indicators.bollinger_bands.price_position}}}
- Insights: What do the Bollinger Bands suggest about volatility and potential price reversals? Is the price near the upper, middle, or lower band?

#### Moving Averages (from Forecast Data for broader context)
- SMA 10: {{{forecastData.technical_indicators.moving_averages.sma_10}}}
- SMA 20: {{{forecastData.technical_indicators.moving_averages.sma_20}}}
- SMA 50: {{{forecastData.technical_indicators.moving_averages.sma_50}}}
- EMA 10: {{{forecastData.technical_indicators.moving_averages.ema_10}}}
- EMA 20: {{{forecastData.technical_indicators.moving_averages.ema_20}}}
- Insights: Analyze the relationship between short-term and long-term moving averages. Are there any bullish or bearish crossovers?

### 3. Trend Analysis
- Overall Trend: {{{forecastData.trend_analysis.overall_trend}}}
- Trend Strength: {{{forecastData.trend_analysis.trend_strength}}}
- Slope: {{{forecastData.trend_analysis.slope}}}
- Change Percent: {{{forecastData.trend_analysis.change_percent}}}
- Volatility Forecast: {{{forecastData.trend_analysis.volatility_forecast}}}
- Insights: Summarize the current trend and its strength.

### 4. Anomaly Detection
{{#if forecastData.anomalies.detected}}
- Detected: Yes ({{forecastData.anomalies.count}} anomalies)
{{#each anomaliesWithIndex}}
  - Anomaly {{{this.index}}}:
    - Period: {{{this.period}}}
    - Value: {{{this.value}}}
    - Z-Score: {{{this.zscore}}}
    - Type: {{{this.anomaly_type}}}
{{/each}}
- Impact Assessment: Discuss the potential impact of these anomalies on future price movements or model reliability.
{{else}}
- Detected: No significant anomalies found.
{{/if}}

### 5. Risk and Uncertainty Assessment
- Model Confidence: {{modelConfidencePercentage}}%
- Prediction Reliability: {{{forecastData.performance_summary.prediction_reliability}}}
- Risk Level: {{{forecastData.performance_summary.risk_level}}}
- Insights: Elaborate on the risks and uncertainties associated with this forecast, considering the model's confidence and reliability.

### 6. Conclusion
Provide a brief concluding statement summarizing the report's findings and reiterating the main recommendation.
`,
});

// Define the flow
const detailedTechnicalAnalysisReportFlow = ai.defineFlow(
  {
    name: 'detailedTechnicalAnalysisReportFlow',
    inputSchema: DetailedTechnicalAnalysisReportInputSchema,
    outputSchema: DetailedTechnicalAnalysisReportOutputSchema,
  },
  async (input) => {
    // Fetch technical analysis data
    const technicalAnalysisData = await deepseaClient.getTechnicalAnalysis(input.modelId, input.periods);

    // Fetch forecast data. Assuming LSTM for now, but a more robust system would determine model_type.
    const forecastData = await deepseaClient.forecastLSTM(input.modelId, input.periods);

    // Pre-process data for the prompt to ensure correct Handlebars rendering
    const modelConfidencePercentage = Math.round(forecastData.performance_summary.model_confidence * 100);
    const anomaliesWithIndex = (forecastData.anomalies.anomalies || []).map((anomaly: any, index: number) => ({
      ...anomaly,
      index: index + 1,
    }));

    // Call the prompt with the combined and pre-processed data
    const { output } = await detailedTechnicalAnalysisReportPrompt({
      technicalAnalysisData,
      forecastData,
      modelConfidencePercentage,
      anomaliesWithIndex,
    });

    if (!output) {
      throw new Error('Failed to generate technical analysis report.');
    }

    return output;
  }
);

// Exported wrapper function
export async function detailedTechnicalAnalysisReport(
  input: DetailedTechnicalAnalysisReportInput
): Promise<DetailedTechnicalAnalysisReportOutput> {
  return detailedTechnicalAnalysisReportFlow(input);
}
