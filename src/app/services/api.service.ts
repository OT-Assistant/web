import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private auth = inject(AuthService);
  private baseUrl = environment.apiUrl;

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.auth.getToken();
    
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await window.fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async syncProfile() {
    return this.fetch<any>('/me');
  }

  async updateProfile(data: { name: string; email: string }) {
    return this.fetch<any>('/me', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async selectRole(role: 'therapist' | 'client' | 'none') {
    return this.fetch<any>('/me/role', {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  }
  
  // Clients
  async getClients() {
    return this.fetch<any[]>('/clients');
  }
  
  async getClient(id: string) {
    return this.fetch<any>(`/clients/${id}`);
  }

  async createClient(data: { display_name: string; email?: string; notes?: string }) {
    return this.fetch<any>('/clients', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateClient(id: string, data: { display_name: string; email?: string; notes?: string }) {
    return this.fetch<any>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteClient(id: string) {
    return this.fetch<any>(`/clients/${id}`, {
      method: 'DELETE'
    });
  }

  async getClientIntake(clientId: string) {
    return this.fetch<any>(`/clients/${clientId}/intake`);
  }

  async getMyIntake() {
    return this.fetch<any>('/me/intake');
  }

  async submitMyIntake(data: { goals: string; challenges: string }) {
    return this.fetch<any>('/me/intake', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // AI Plans
  async generatePlan(client_id: string, therapist_notes?: string, options?: { age_range?: string; available_equipment?: string; session_length_minutes?: number }) {
    return this.fetch<any>('/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ client_id, therapist_notes, ...options })
    });
  }

  // Treatment Plans
  async saveClientPlan(clientId: string, planData: { title: string; summary?: string; source?: string; activities: any[] }) {
    return this.fetch<any>('/plans', {
      method: 'POST',
      body: JSON.stringify({
        client_id: clientId,
        ...planData
      })
    });
  }

  async getClientPlan(clientId: string) {
    return this.fetch<any>(`/plans/client/${clientId}`);
  }

  async getMyPlan() {
    return this.fetch<any>('/plans/me');
  }

  async updatePlan(planId: string, data: { title: string; summary?: string; activities: any[] }) {
    return this.fetch<any>(`/plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deletePlan(planId: string) {
    return this.fetch<any>(`/plans/${planId}`, {
      method: 'DELETE'
    });
  }

  async getClientCompletions(clientId: string) {
    return this.fetch<any[]>(`/progress/client/${clientId}`);
  }

  async logActivityCompletion(activityId: string, data: { effort: string; note?: string }) {
    return this.fetch<any>(`/progress/activities/${activityId}/completions`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getClientMessages(clientId: string) {
    return this.fetch<any[]>(`/messages/client/${clientId}`);
  }

  async sendMessage(clientId: string, body: string) {
    return this.fetch<any>(`/messages/client/${clientId}`, {
      method: 'POST',
      body: JSON.stringify({ body })
    });
  }
}
