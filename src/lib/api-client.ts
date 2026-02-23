import type {
  FileList,
  ModelList,
  ForecastData,
  TrainLSTMResponse,
  TrainProphetResponse,
  UploadCSVResponse
} from './types';

export class TOTEMDeepseaClient {
  private apiKey: string;
  private apiHost: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_API_KEY || "";
    this.apiHost = '/api';
    
    if (!this.apiKey) {
      console.warn('API_KEY is not provided. Please set NEXT_PUBLIC_API_KEY in your .env file.');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.apiHost}${endpoint}`;
    
    const headers = new Headers(options.headers);

    if (this.apiKey) {
      headers.set('Authorization', `Bearer ${this.apiKey}`);
    }

    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  async uploadCSV(file: File): Promise<UploadCSVResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/upload_csv', {
        method: 'POST',
        body: formData
    });
  }

  async trainLSTM(fileId: string, options: { lookback: number; epochs: number; batch_size: number; }): Promise<TrainLSTMResponse> {
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

  async trainProphet(fileId: string, options: { quarterly_seasonality: boolean, yearly_seasonality: boolean, interval_width: number }): Promise<TrainProphetResponse> {
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
    return this.request(`/forecast_prophet?model_id=${modelId}&periods=${periods}`);
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
}
