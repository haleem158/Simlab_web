// frontend/src/lib/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds for long simulations
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // Server responded with error status
          const message = (error.response.data as any)?.detail || 'An error occurred';
          throw new Error(message);
        } else if (error.request) {
          // Request made but no response
          throw new Error('No response from server. Please check your connection.');
        } else {
          // Error in request setup
          throw new Error(error.message);
        }
      }
    );
  }

  // Token Supply Endpoints
  async simulateTokenSupply(params: any) {
    const response = await this.client.post('/api/v1/token-supply/simulate', params);
    return response.data;
  }

  async monteCarloTokenSupply(params: any) {
    const response = await this.client.post('/api/v1/token-supply/monte-carlo', params);
    return response.data;
  }

  async getTokenSupplyPresets() {
    const response = await this.client.get('/api/v1/token-supply/presets');
    return response.data;
  }

  // Token Impact Endpoints
  async simulateTokenImpact(params: any) {
    const response = await this.client.post('/api/v1/token-impact/simulate', params);
    return response.data;
  }

  async uploadCSV(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post('/api/v1/token-impact/upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getSampleCSV() {
    const response = await this.client.get('/api/v1/token-impact/sample-csv');
    return response.data;
  }

  // Vesting Endpoints
  async simulateVesting(params: any) {
    const response = await this.client.post('/api/v1/vesting/simulate', params);
    return response.data;
  }

  async saveVestingProfile(profileName: string, params: any) {
    const response = await this.client.post(`/api/v1/vesting/profiles?name=${encodeURIComponent(profileName)}`, params);
    return response.data;
  }
  async getVestingProfile(profileId: string) {
    const response = await this.client.get(`/api/v1/vesting/profiles/${profileId}`);
    return response.data;
  }

  async listVestingProfiles() {
    const response = await this.client.get('/api/v1/vesting/profiles');
    return response.data;
  }

  async getVestingPresets() {
  const response = await this.client.get('/api/v1/vesting/presets');
  return response.data;
}

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;