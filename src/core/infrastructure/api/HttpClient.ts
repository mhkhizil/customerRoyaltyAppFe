import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { API_CONFIG, API_ENDPOINTS, PUBLIC_AUTH_PATHS } from "./constants";
import { refreshAccessToken } from "../auth/sessionTokenRefresh";
import {
  tokenCookies,
  isTokenExpired,
  isTokenExpiringSoon,
  getTimeUntilExpiration,
  clearAuthAndRedirectToLogin,
} from "@/lib/cookies";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const NO_REFRESH_RETRY_PATHS: readonly string[] = [
  API_ENDPOINTS.AUTH.LOGIN,
  API_ENDPOINTS.AUTH.REFRESH,
  API_ENDPOINTS.AUTH.LOGOUT,
];

/**
 * Base HTTP client using Axios
 * Handles common configuration and error handling for API requests
 * Implements CSRF protection for all non-GET requests (except login)
 * Includes JWT refresh + expiration handling
 */
export class HttpClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private csrfToken: string | null = null;
  private csrfSupported: boolean = true;
  private isRedirecting: boolean = false;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_CONFIG.BASE_URL;
    this.csrfToken = tokenCookies.getCsrfToken();

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    this.client.interceptors.request.use(
      async (config) => {
        let token = tokenCookies.getToken();

        if (token && isTokenExpired(token)) {
          const refreshed = await refreshAccessToken();
          if (!refreshed) {
            this.handleTokenExpiration();
            return Promise.reject(new Error("Token expired"));
          }
          token = tokenCookies.getToken();
        } else if (token && isTokenExpiringSoon(token, 5)) {
          await refreshAccessToken();
          token = tokenCookies.getToken();
        }

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (config.data instanceof FormData) {
          delete config.headers["Content-Type"];
        }

        if (
          ["GET", "HEAD", "OPTIONS"].includes(
            config.method?.toUpperCase() || ""
          )
        ) {
          return config;
        }

        if (config.url && PUBLIC_AUTH_PATHS.includes(config.url)) {
          return config;
        }

        if (this.csrfSupported && this.csrfToken) {
          config.headers["X-CSRF-Token"] = this.csrfToken;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error.response?.status;
        const config = error.config as RetryableRequestConfig | undefined;
        const requestUrl = config?.url ?? "";

        if (status === 401 && config) {
          const canRetry =
            !config._retry &&
            !NO_REFRESH_RETRY_PATHS.includes(requestUrl);

          if (canRetry) {
            config._retry = true;
            const refreshed = await refreshAccessToken();
            if (refreshed) {
              const nextToken = tokenCookies.getToken();
              if (nextToken) {
                config.headers.Authorization = `Bearer ${nextToken}`;
              }
              return this.client.request(config);
            }
          }

          const isLoginRequest = requestUrl === API_ENDPOINTS.AUTH.LOGIN;
          const isOnLoginPage = window.location.pathname === "/login";

          if (!isLoginRequest && !isOnLoginPage) {
            this.handleTokenExpiration();
            return Promise.reject(new Error("Authentication required"));
          }
        }

        if (
          status === 403 &&
          error.response?.data?.message?.includes("CSRF")
        ) {
          this.csrfToken = null;
          this.csrfSupported = true;
          tokenCookies.removeCsrfToken();
          console.error("CSRF token invalid, please retry");
        }

        return Promise.reject(error);
      }
    );
  }

  private handleTokenExpiration(): void {
    if (this.isRedirecting) return;

    this.isRedirecting = true;
    this.csrfToken = null;
    this.csrfSupported = true;
    clearAuthAndRedirectToLogin();
  }

  public isTokenValid(): boolean {
    const token = tokenCookies.getToken();
    if (!token) return false;
    return !isTokenExpired(token);
  }

  public isTokenExpiringSoon(warningMinutes: number = 5): boolean {
    const token = tokenCookies.getToken();
    if (!token) return false;
    return isTokenExpiringSoon(token, warningMinutes);
  }

  public getTimeUntilExpiration(): number {
    const token = tokenCookies.getToken();
    if (!token) return 0;

    return getTimeUntilExpiration(token);
  }

  async refreshCsrfToken(): Promise<string | null> {
    try {
      const token = tokenCookies.getToken();
      if (!token) {
        throw new Error("No JWT token available");
      }

      if (!this.csrfSupported) {
        return null;
      }

      const response = await axios.get(
        `${this.baseUrl}${API_ENDPOINTS.CSRF.TOKEN}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      this.csrfToken = response.data.token;
      if (this.csrfToken) {
        tokenCookies.setCsrfToken(this.csrfToken);
      }
      return this.csrfToken;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        this.csrfSupported = false;
      } else {
        console.error("Failed to refresh CSRF token:", error);
      }
      this.csrfToken = null;
      tokenCookies.removeCsrfToken();
      return null;
    }
  }

  clearCsrfToken(): void {
    this.csrfToken = null;
    this.csrfSupported = true;
    tokenCookies.removeCsrfToken();
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(
      url,
      data,
      config
    );
    return response.data;
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(
      url,
      data,
      config
    );
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }
}
