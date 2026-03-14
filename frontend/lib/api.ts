const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const DEFAULT_TIMEOUT_MS = 15000;

export async function fetchApi<T>(endpoint: string, options: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
    const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        let token = null;
        if (typeof window !== 'undefined') {
            if (window.location.pathname.startsWith('/admin')) token = localStorage.getItem('adminToken');
            else if (window.location.pathname.startsWith('/student')) token = localStorage.getItem('studentId');
            else token = localStorage.getItem('ambassadorId') || localStorage.getItem('adminToken') || localStorage.getItem('studentId');
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(fetchOptions.headers as Record<string, string>),
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...fetchOptions,
            signal: controller.signal,
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `API error: ${response.status}`);
        }

        return response.json();
    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please check your connection and try again.');
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

export const api = {
    get: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, body: any) => fetchApi<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    patch: <T>(endpoint: string, body: any) => fetchApi<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'DELETE' }),
};
