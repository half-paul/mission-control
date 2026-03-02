/**
 * API Client Configuration
 * 
 * Single Container Deployment (default):
 * - Frontend and API run in the same container (Next.js with API routes)
 * - NEXT_PUBLIC_API_URL defaults to empty string → uses relative URLs
 * - Example: fetch('/api/v1/projects') → same origin
 * 
 * Multi-Container Deployment (optional):
 * - Frontend and API run separately
 * - Set NEXT_PUBLIC_API_URL=https://api.example.com
 * - Example: fetch('/api/v1/projects') → https://api.example.com/api/v1/projects
 * 
 * Environment Variables:
 * - BASE_URL: Public base URL (e.g., https://mission-control.uchitel.ca)
 * - NEXT_PUBLIC_API_URL: Optional API URL (empty = same origin, relative URLs)
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

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
    return fetch(this.url(path), {
      ...options,
      credentials: 'include', // Always include cookies for authentication
    });
  },

  /**
   * GET request helper
   */
  async get<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await this.fetch(path, {
      ...options,
      method: 'GET',
    });
    
    // Handle 401 Unauthorized - redirect to login
    if (res.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
      throw new Error('Authentication required');
    }
    
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
  async delete<T>(path: string, options?: RequestInit): Promise<T | void> {
    const res = await this.fetch(path, {
      ...options,
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    if (res.status === 204) return;
    return res.json();
  },
};
