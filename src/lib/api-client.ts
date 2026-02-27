/**
 * API Client Configuration
 * 
 * Uses NEXT_PUBLIC_API_URL environment variable to configure the base URL
 * for all API requests. Falls back to localhost:4000 for local development.
 * 
 * Production deployment should set:
 * NEXT_PUBLIC_API_URL=https://mission-control-api.uchitel.ca
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * API Client helper for making requests
 */
export const apiClient = {
  baseUrl: API_BASE_URL,

  /**
   * Build full API URL from path
   * @param path - API path (e.g., '/api/v1/projects')
   */
  url(path: string): string {
    // Remove leading slash if present (baseUrl already has it or doesn't need it)
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  },

  /**
   * Fetch helper with automatic URL prefixing
   */
  async fetch(path: string, options?: RequestInit): Promise<Response> {
    return fetch(this.url(path), options);
  },

  /**
   * GET request helper
   */
  async get<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await this.fetch(path, {
      ...options,
      method: 'GET',
    });
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json();
  },

  /**
   * POST request helper
   */
  async post<T>(path: string, data?: unknown, options?: RequestInit): Promise<T> {
    const res = await this.fetch(path, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json();
  },

  /**
   * PATCH request helper
   */
  async patch<T>(path: string, data?: unknown, options?: RequestInit): Promise<T> {
    const res = await this.fetch(path, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json();
  },

  /**
   * DELETE request helper
   */
  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await this.fetch(path, {
      ...options,
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json();
  },
};
