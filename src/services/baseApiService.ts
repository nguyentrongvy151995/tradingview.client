/**
 * Base API Service - Function-based approach
 * Provides common HTTP methods (GET, POST, PUT, DELETE) for API calls
 */

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  data?: any;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
  baseURL?: string;
}

export interface ApiConfig {
  baseURL: string;
  defaultHeaders: Record<string, string>;
  timeout: number;
}

// Global configuration
let globalConfig: ApiConfig = {
  baseURL: 'http://localhost:3003',
  defaultHeaders: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout for longer requests
};

/**
 * Set base URL for all requests
 */
export function setBaseURL(url: string): void {
  globalConfig.baseURL = url;
}

/**
 * Set default headers for all requests
 */
export function setDefaultHeaders(headers: Record<string, string>): void {
  globalConfig.defaultHeaders = { ...globalConfig.defaultHeaders, ...headers };
}

/**
 * Set authorization token
 */
export function setAuthToken(token: string): void {
  globalConfig.defaultHeaders['Authorization'] = `Bearer ${token}`;
}

/**
 * Remove authorization token
 */
export function removeAuthToken(): void {
  delete globalConfig.defaultHeaders['Authorization'];
}

/**
 * Set default timeout
 */
export function setTimeout(timeout: number): void {
  globalConfig.timeout = timeout;
}

/**
 * Get current configuration
 */
export function getConfig(): ApiConfig {
  return { ...globalConfig };
}

/**
 * Build full URL
 */
function buildURL(endpoint: string, requestConfig?: RequestConfig): string {
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // Use baseURL from config only once, fallback to global config
  const baseURL = requestConfig?.baseURL ?? globalConfig.baseURL;
  const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
}

/**
 * Build request headers
 */
function buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  return {
    ...globalConfig.defaultHeaders,
    ...customHeaders,
  };
}

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let data: any;
  
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    const errorMessage = data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
    const apiError: ApiError = {
      message: errorMessage,
      status: response.status,
      data,
    };
    throw apiError;
  }

  return {
    data,
    status: response.status,
    message: data?.message,
  };
}

/**
 * Create abort controller with timeout
 */
function createAbortController(config?: RequestConfig): AbortController {
  const controller = new AbortController();
  
  if (config?.signal) {
    config.signal.addEventListener('abort', () => {
      controller.abort();
    });
  }

  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, config?.timeout || globalConfig.timeout);

  controller.signal.addEventListener('abort', () => {
    window.clearTimeout(timeoutId);
  });

  return controller;
}


/**
 * Configure API base URL and settings
 */
export function configureApiService(config: Partial<ApiConfig>): void {
  if (config.baseURL !== undefined) {
    globalConfig.baseURL = config.baseURL;
  }
  if (config.defaultHeaders) {
    globalConfig.defaultHeaders = { ...globalConfig.defaultHeaders, ...config.defaultHeaders };
  }
  if (config.timeout !== undefined) {
    globalConfig.timeout = config.timeout;
  }
}

/**
 * GET request using global config
 */
export async function get<T = any>(endpoint: string, config?: Omit<RequestConfig, 'baseURL'>): Promise<ApiResponse<T>> {
  const controller = createAbortController(config);
  
  try {
    const response = await fetch(buildURL(endpoint, config), {
      method: 'GET',
      headers: buildHeaders(config?.headers),
      signal: controller.signal,
    });

    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * POST request using global config
 */
export async function post<T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'baseURL'>): Promise<ApiResponse<T>> {
  const controller = createAbortController(config);
  
  try {
    const response = await fetch(buildURL(endpoint, config), {
      method: 'POST',
      headers: buildHeaders(config?.headers),
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });

    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * PUT request using global config
 */
export async function put<T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'baseURL'>): Promise<ApiResponse<T>> {
  const controller = createAbortController(config);
  
  try {
    const response = await fetch(buildURL(endpoint, config), {
      method: 'PUT',
      headers: buildHeaders(config?.headers),
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });

    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * PATCH request using global config
 */
export async function patch<T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'baseURL'>): Promise<ApiResponse<T>> {
  const controller = createAbortController(config);
  
  try {
    const response = await fetch(buildURL(endpoint, config), {
      method: 'PATCH',
      headers: buildHeaders(config?.headers),
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });

    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * DELETE request using global config
 */
export async function deleteRequest<T = any>(endpoint: string, config?: Omit<RequestConfig, 'baseURL'>): Promise<ApiResponse<T>> {
  const controller = createAbortController(config);
  
  try {
    const response = await fetch(buildURL(endpoint, config), {
      method: 'DELETE',
      headers: buildHeaders(config?.headers),
      signal: controller.signal,
    });

    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Upload file using global config
 */
export async function uploadFile<T = any>(
  endpoint: string,
  file: File,
  fieldName?: string,
  additionalData?: Record<string, any>,
  config?: Omit<RequestConfig, 'baseURL'>
): Promise<ApiResponse<T>> {
  const controller = createAbortController(config);
  
  try {
    const formData = new FormData();
    formData.append(fieldName || 'file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    const headers = { ...globalConfig.defaultHeaders, ...config?.headers };
    // Remove Content-Type to let browser set it automatically for FormData
    delete headers['Content-Type'];

    const response = await fetch(buildURL(endpoint, config), {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });

    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}


// Default API service object
const apiService = {
  // Main functions
  get,
  post,
  put,
  patch,
  delete: deleteRequest,
  uploadFile,
  
  // Configuration functions
  configureApiService,
  setBaseURL,
  setDefaultHeaders,
  setAuthToken,
  removeAuthToken,
  setTimeout,
  getConfig,
};

export default apiService;