import type { AgentCapabilities } from '../types';

export class ApiService {
  private static getHeaders(token?: string | null): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  static async login(email: string, password: string):Promise<{ ok: boolean; data: any }> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    return { ok: response.ok, data };
  }

  static async register(name: string, email: string, password: string): Promise<{ ok: boolean; data: any }> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    return { ok: response.ok, data };
  }

  static async getCapabilities(token: string): Promise<AgentCapabilities | null> {
    try {
      const response = await fetch('/api/agents/capabilities', {
        headers: this.getHeaders(token),
      });
      if (response.status === 401) {
        return null;
      }
      return await response.json();
    } catch {
      return null;
    }
  }

  static async sendV1Chat(message: string, token: string | null): Promise<any> {
    const response = await fetch('/api/agents/chat', {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ message }),
    });
    return await response.json();
  }

  static async sendV2SwarmChat(message: string, token: string | null): Promise<any> {
    const response = await fetch('/api/v2/graph/chat', {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ message }),
    });
    return await response.json();
  }

  static async approveSwarmExecution(sessionId: string, token: string | null): Promise<{ ok: boolean; data: any }> {
    const response = await fetch('/api/v2/graph/approve', {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ sessionId }),
    });
    const data = await response.json();
    return { ok: response.ok, data };
  }
}
