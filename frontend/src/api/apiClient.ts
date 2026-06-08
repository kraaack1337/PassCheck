/**
 * Base API client for making requests to the backend.
 * Uses native fetch. Can be expanded later to use Axios if needed.
 */
export const apiClient = {
  /**
   * Fetches leaks from the backend by prefix.
   */
  async getLeaksByPrefix(prefix: string): Promise<string> {
    const response = await fetch(`/api/v1/leaks/${prefix}`);
    
    if (!response.ok) {
      throw new Error(`Сервер ответил: ${response.status}`);
    }

    return response.text();
  }
};
