import type {
  FileList,
  ModelList,
  ForecastData,
  TrainLSTMResponse,
  TrainProphetResponse,
  UploadCSVResponse,
  HealthStatus,
} from './types';

export class TOTEMDeepseaClient {
  private apiKey: string | undefined;
  private apiHost: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_API_KEY;
    // Todas as requisições devem passar pelo proxy do Next.js para evitar problemas de CORS.
    this.apiHost = '/api'; 

    if (!this.apiKey) {
      console.warn(
        'A variável de ambiente NEXT_PUBLIC_API_KEY não está definida. A API pode falhar se for necessária autenticação.'
      );
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiHost}${
      endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    }`;

    const headers = new Headers(options.headers);

    if (this.apiKey) {
      headers.set('Authorization', `Bearer ${this.apiKey}`);
    }

    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (e: any) {
      const networkErrorMessage = `Erro de rede ao tentar acessar ${url}: ${e.message}.`;
      console.error(networkErrorMessage);
      // O erro agora é mais genérico e útil
      throw new Error(
        `Falha na conexão com a API. Verifique se o servidor da API Python está em execução e se as configurações no arquivo .env estão corretas.`
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = `Erro na API (${response.status} ${
        response.statusText
      }): ${errorText || 'O servidor não retornou uma mensagem de erro.'}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      return response.json() as Promise<T>;
    } catch (e: any) {
      const jsonErrorMessage = `Falha ao analisar a resposta JSON da API: ${e.message}`;
      console.error(jsonErrorMessage);
      throw new Error(jsonErrorMessage);
    }
  }

  async uploadCSV(file: File): Promise<UploadCSVResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/upload_csv', {
      method: 'POST',
      body: formData,
    });
  }

  async trainLSTM(
    fileId: string,
    options: { lookback: number; epochs: number; batch_size: number }
  ): Promise<TrainLSTMResponse> {
    return this.request('/train_lstm', {
      method: 'POST',
      body: JSON.stringify({
        file_id: fileId,
        lookback: options.lookback,
        epochs: options.epochs,
        batch_size: options.batch_size,
      }),
    });
  }

  async trainProphet(
    fileId: string,
    options: {
      quarterly_seasonality: boolean;
      yearly_seasonality: boolean;
      interval_width: number;
    }
  ): Promise<TrainProphetResponse> {
    return this.request('/train_prophet', {
      method: 'POST',
      body: JSON.stringify({
        file_id: fileId,
        ...options,
      }),
    });
  }

  async forecastLSTM(modelId: string, periods = 24): Promise<ForecastData> {
    return this.request(`/forecast_lstm?model_id=${modelId}&periods=${periods}`);
  }

  async forecastProphet(modelId: string, periods = 24): Promise<ForecastData> {
    return this.request(
      `/forecast_prophet?model_id=${modelId}&periods=${periods}`
    );
  }

  async getModels(): Promise<ModelList> {
    return this.request('/models');
  }

  async getFiles(): Promise<FileList> {
    return this.request('/files');
  }

  async getTechnicalAnalysis(modelId: string, periods = 24): Promise<any> {
    return this.request(`/technical_analysis/${modelId}?periods=${periods}`);
  }

  async getHealth(): Promise<HealthStatus> {
    return this.request('/health');
  }
}
