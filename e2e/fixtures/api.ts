/**
 * API Client Wrapper
 * Provides typed API methods for testing
 */

import { CONFIG } from '../config';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiClient {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string = CONFIG.API_BASE, token?: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  setToken(token: string): void {
    this.token = token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
      timeout: CONFIG.FETCH_TIMEOUT,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: responseData.error || `HTTP ${response.status}`,
          data: responseData,
        };
      }

      return {
        success: true,
        data: responseData,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  async login(email: string, password: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    return this.request('POST', '/auth/login', { email, password });
  }

  async refresh(refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> {
    return this.request('POST', '/auth/refresh', { refreshToken });
  }

  async getUser(): Promise<ApiResponse<any>> {
    return this.request('GET', '/auth/me');
  }

  async getClientes(): Promise<ApiResponse<any[]>> {
    return this.request('GET', '/clientes');
  }

  async getCliente(id: string): Promise<ApiResponse<any>> {
    return this.request('GET', `/clientes/${id}`);
  }

  async createCliente(data: any): Promise<ApiResponse<any>> {
    return this.request('POST', '/clientes', data);
  }

  async updateCliente(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request('PUT', `/clientes/${id}`, data);
  }

  async deleteCliente(id: string): Promise<ApiResponse<void>> {
    return this.request('DELETE', `/clientes/${id}`);
  }

  async uploadAvatar(userId: string, formData: FormData): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/users/${userId}/avatar`;
    const options: RequestInit = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
      timeout: CONFIG.FETCH_TIMEOUT,
    };

    try {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  async getRenovals(): Promise<ApiResponse<any[]>> {
    return this.request('GET', '/renovals');
  }

  async createRenovall(data: any): Promise<ApiResponse<any>> {
    return this.request('POST', '/renovals', data);
  }

  async updateRenovall(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request('PUT', `/renovals/${id}`, data);
  }
}

export async function createAuthenticatedClient(email: string, password: string): Promise<ApiClient> {
  const client = new ApiClient();
  const response = await client.login(email, password);

  if (!response.success || !response.data?.accessToken) {
    throw new Error(`Login failed: ${response.error}`);
  }

  client.setToken(response.data.accessToken);
  return client;
}
