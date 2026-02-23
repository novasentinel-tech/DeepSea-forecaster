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
  modelId: z.string().describe('O ID do modelo treinado (LSTM ou Prophet).'),
  periods: z.number().default(24).describe('O número de períodos para a previsão e análise.'),
});
export type DetailedTechnicalAnalysisReportInput = z.infer<typeof DetailedTechnicalAnalysisReportInputSchema>;

// Define the output schema
const DetailedTechnicalAnalysisReportOutputSchema = z.object({
  report: z.string().describe('Um relatório detalhado de análise técnica.'),
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
  
  async getModels(): Promise<any> {
    return this.request('/models');
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
      technicalAnalysisData: z.any().describe('Dados JSON brutos do endpoint /technical_analysis.'),
      forecastData: z.any().describe('Dados JSON brutos do endpoint /forecast_lstm ou /forecast_prophet.'),
      modelConfidencePercentage: z.number().describe('Confiança do modelo como uma porcentagem.'),
      anomaliesWithIndex: z.array(z.object({
        period: z.number(),
        value: z.number(),
        zscore: z.number(),
        anomaly_type: z.string(),
        index: z.number(), // Added for display
      })).describe('Anomalias com seu índice baseado em 1.'),
    }),
  },
  output: {
    schema: DetailedTechnicalAnalysisReportOutputSchema,
  },
  prompt: `Você é um analista financeiro especialista. Sua tarefa é gerar um relatório de análise técnica detalhado com base nos dados de previsão e indicadores técnicos fornecidos.

Sintetize os dados de RSI, MACD, Bandas de Bollinger e Médias Móveis.
Determine um sinal geral de compra/venda/manter e forneça uma recomendação concisa.
Identifique e descreva quaisquer anomalias detectadas, seu impacto potencial, e avalie os riscos, recompensas e incertezas gerais resumidos na saída da API.

Estruture seu relatório claramente com as seguintes seções:

## Relatório de Análise Técnica para o Modelo: {{{forecastData.model_id}}}

### 1. Sentimento Geral do Mercado e Recomendação
Com base nos dados sintetizados, qual é o sentimento geral do mercado (otimista, pessimista, neutro) e sua recomendação principal (COMPRA_FORTE, COMPRA, MANTER, VENDA, VENDA_FORTE)? Explique seu raciocínio brevemente.

Recomendação Geral: {{{forecastData.performance_summary.recommendation}}}
Sinal Geral: {{{technicalAnalysisData.signals.overall_signal}}}
Confiança: {{modelConfidencePercentage}}%
Confiabilidade da Previsão: {{{forecastData.performance_summary.prediction_reliability}}}
Nível de Risco: {{{forecastData.performance_summary.risk_level}}}

### 2. Indicadores Técnicos Chave

#### Índice de Força Relativa (RSI)
- Valor Atual: {{{technicalAnalysisData.indicators.rsi.values.0}}}
- Interpretação: {{{technicalAnalysisData.indicators.rsi.interpretation}}}
- Limiares: Sobrecomprado ({{{technicalAnalysisData.indicators.rsi.threshold_overbought}}}), Sobrevendido ({{{technicalAnalysisData.indicators.rsi.threshold_oversold}}})
- Insights: Descreva o que o RSI indica sobre o momento atual.

#### Convergência e Divergência de Médias Móveis (MACD)
- Linha MACD: {{{technicalAnalysisData.indicators.macd.macd.0}}}
- Linha de Sinal: {{{technicalAnalysisData.indicators.macd.signal.0}}}
- Histograma: {{{technicalAnalysisData.indicators.macd.histogram.0}}}
- Cruzamento de Sinal: {{{technicalAnalysisData.indicators.macd.signal_cross}}}
- Insights: Explique as implicações das linhas MACD e do histograma. Existe um cruzamento otimista ou pessimista?

#### Bandas de Bollinger
- Banda Superior: {{{technicalAnalysisData.indicators.bollinger_bands.upper.0}}}
- Banda Média (SMA): {{{technicalAnalysisData.indicators.bollinger_bands.middle.0}}}
- Banda Inferior: {{{technicalAnalysisData.indicators.bollinger_bands.lower.0}}}
- Largura da Banda: {{{technicalAnalysisData.indicators.bollinger_bands.band_width}}}
- Posição do Preço: {{{technicalAnalysisData.indicators.bollinger_bands.price_position}}}
- Insights: O que as Bandas de Bollinger sugerem sobre a volatilidade e potenciais reversões de preço? O preço está perto da banda superior, média ou inferior?

#### Médias Móveis (dos Dados de Previsão para contexto mais amplo)
- SMA 10: {{{forecastData.technical_indicators.moving_averages.sma_10}}}
- SMA 20: {{{forecastData.technical_indicators.moving_averages.sma_20}}}
- SMA 50: {{{forecastData.technical_indicators.moving_averages.sma_50}}}
- EMA 10: {{{forecastData.technical_indicators.moving_averages.ema_10}}}
- EMA 20: {{{forecastData.technical_indicators.moving_averages.ema_20}}}
- Insights: Analise a relação entre as médias móveis de curto e longo prazo. Existem cruzamentos otimistas ou pessimistas?

### 3. Análise de Tendência
- Tendência Geral: {{{forecastData.trend_analysis.overall_trend}}}
- Força da Tendência: {{{forecastData.trend_analysis.trend_strength}}}
- Inclinação: {{{forecastData.trend_analysis.slope}}}
- Variação Percentual: {{{forecastData.trend_analysis.change_percent}}}
- Previsão de Volatilidade: {{{forecastData.trend_analysis.volatility_forecast}}}
- Insights: Resuma a tendência atual e sua força.

### 4. Detecção de Anomalias
{{#if forecastData.anomalies.detected}}
- Detectado: Sim ({{forecastData.anomalies.count}} anomalias)
{{#each anomaliesWithIndex}}
  - Anomalia {{{this.index}}}:
    - Período: {{{this.period}}}
    - Valor: {{{this.value}}}
    - Z-Score: {{{this.zscore}}}
    - Tipo: {{{this.anomaly_type}}}
{{/each}}
- Avaliação de Impacto: Discuta o impacto potencial dessas anomalias nos movimentos de preços futuros ou na confiabilidade do modelo.
{{else}}
- Detectado: Nenhuma anomalia significativa encontrada.
{{/if}}

### 5. Avaliação de Risco e Incerteza
- Confiança do Modelo: {{modelConfidencePercentage}}%
- Confiabilidade da Previsão: {{{forecastData.performance_summary.prediction_reliability}}}
- Nível de Risco: {{{forecastData.performance_summary.risk_level}}}
- Insights: Elabore sobre os riscos e incertezas associados a esta previsão, considerando a confiança e a confiabilidade do modelo.

### 6. Conclusão
Forneça uma breve declaração final resumindo as conclusões do relatório e reiterando a recomendação principal.
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
    // Determine model type to call the correct forecast endpoint
    const models = (await deepseaClient.getModels() as any).models;
    const modelDetails = models[input.modelId];
    if (!modelDetails) {
        throw new Error(`Model with ID ${input.modelId} not found.`);
    }
    const modelType = modelDetails.type;

    // Fetch data concurrently
    const [technicalAnalysisData, forecastData] = await Promise.all([
        deepseaClient.getTechnicalAnalysis(input.modelId, input.periods),
        modelType === 'lstm' 
            ? deepseaClient.forecastLSTM(input.modelId, input.periods) 
            : deepseaClient.forecastProphet(input.modelId, input.periods)
    ]);


    // Pre-process data for the prompt to ensure correct Handlebars rendering
    const modelConfidencePercentage = Math.round((forecastData.performance_summary?.model_confidence || 0) * 100);
    const anomaliesWithIndex = (forecastData.anomalies?.anomalies || []).map((anomaly: any, index: number) => ({
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
