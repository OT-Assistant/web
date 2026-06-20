import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Client } from '../../models';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-therapist-dashboard',
  standalone: true,
  imports: [TableModule, ButtonModule, DatePipe, FormsModule],
  template: `
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Your Clients</h2>
        <p-button label="Add Client" icon="pi pi-plus" size="small" (onClick)="openModal()"></p-button>
      </div>

      <p-table [value]="clients()" styleClass="p-datatable-sm" [tableStyle]="{ 'min-width': '50rem' }">
        <ng-template #header>
          <tr>
            <th>Display Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Weekly Progress</th>
            <th>Last Active</th>
            <th>Unread Messages</th>
            <th>Actions</th>
          </tr>
        </ng-template>
        <ng-template #body let-client>
          <tr>
            <td class="font-medium text-gray-900">{{ client.display_name }}</td>
            <td class="text-gray-600 text-sm">{{ client.email || 'N/A' }}</td>
            <td>
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                [class.bg-green-100]="client.status === 'active'"
                [class.text-green-800]="client.status === 'active'"
                [class.bg-yellow-100]="client.status === 'invited'"
                [class.text-yellow-800]="client.status === 'invited'">
                {{ client.status }}
              </span>
            </td>
            <td>
              <div class="flex items-center gap-2">
                <div class="w-20 bg-gray-100 rounded-full h-2 overflow-hidden shrink-0">
                  <div class="h-2 rounded-full transition-all duration-300"
                       [class.bg-green-500]="client.weekly_completion_rate >= 80"
                       [class.bg-amber-500]="client.weekly_completion_rate >= 40 && client.weekly_completion_rate < 80"
                       [class.bg-red-500]="client.weekly_completion_rate < 40"
                       [style.width.%]="client.weekly_completion_rate"></div>
                </div>
                <span class="text-xs font-bold"
                      [class.text-green-600]="client.weekly_completion_rate >= 80"
                      [class.text-amber-600]="client.weekly_completion_rate >= 40 && client.weekly_completion_rate < 80"
                      [class.text-red-600]="client.weekly_completion_rate < 40">
                  {{ client.weekly_completion_rate }}%
                </span>
              </div>
            </td>
            <td>
              @if (client.last_active_at) {
                <span class="text-xs font-semibold" [class.text-red-600]="isInactive(client.last_active_at)" [class.text-gray-700]="!isInactive(client.last_active_at)">
                  {{ client.last_active_at | date:'MMM d, h:mm a' }}
                </span>
                @if (isInactive(client.last_active_at)) {
                  <span class="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-red-50 text-red-700 border border-red-200 uppercase tracking-wider">
                    Inactive
                  </span>
                }
              } @else {
                <span class="text-xs text-red-500 font-semibold">Never Active</span>
                <span class="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-red-50 text-red-700 border border-red-200 uppercase tracking-wider">
                  Inactive
                </span>
              }
            </td>
            <td>
              @if ((client.unread_message_count || 0) > 0) {
                <span class="inline-flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 animate-pulse">
                  {{ client.unread_message_count }}
                </span>
              } @else {
                <span class="text-xs text-gray-400">0</span>
              }
            </td>
            <td>
              <a [href]="'/therapist/client/' + client.id">
                <p-button label="View Details" severity="secondary" size="small" [text]="true"></p-button>
              </a>
            </td>
          </tr>
        </ng-template>
        <ng-template #empty>
          <tr>
            <td colspan="7" class="text-center py-8 text-gray-500">No clients found. Add one to get started!</td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Add Client Modal -->
    @if (showModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" (click)="closeModal()"></div>

        <!-- Modal Content Container -->
        <div class="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden transform transition-all duration-300 scale-100 z-10">
          <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 class="text-xl font-bold text-slate-900">Add New Client</h3>
            <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form (submit)="submitForm(); $event.preventDefault()" class="p-6 space-y-4">
            @if (error()) {
              <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm text-red-800 font-medium">
                      {{ error() }}
                    </p>
                  </div>
                </div>
              </div>
            }

            <div class="flex flex-col gap-1.5">
              <label for="displayName" class="text-sm font-semibold text-slate-700">Display Name <span class="text-red-500">*</span></label>
              <input 
                id="displayName"
                type="text" 
                [(ngModel)]="displayName" 
                name="displayName"
                required
                class="w-full border-slate-200 rounded-xl shadow-sm border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800"
                placeholder="John Doe"
                [disabled]="submitting()"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="email" class="text-sm font-semibold text-slate-700">Email Address</label>
              <input 
                id="email"
                type="email" 
                [(ngModel)]="email" 
                name="email"
                class="w-full border-slate-200 rounded-xl shadow-sm border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800"
                placeholder="john.doe@example.com"
                [disabled]="submitting()"
              />
              <p class="text-xs text-slate-400">If the client logs in with this email, their account will link automatically.</p>
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="notes" class="text-sm font-semibold text-slate-700">Therapist Notes</label>
              <textarea 
                id="notes"
                [(ngModel)]="notes" 
                name="notes"
                rows="3"
                class="w-full border-slate-200 rounded-xl shadow-sm border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800"
                placeholder="Initial assessment details or special requirements..."
                [disabled]="submitting()"
              ></textarea>
            </div>

            <div class="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <p-button 
                label="Cancel" 
                severity="secondary" 
                (onClick)="closeModal()" 
                [disabled]="submitting()"
              ></p-button>
              
              <button 
                type="submit" 
                [disabled]="submitting() || !displayName.trim()"
                class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
              >
                @if (submitting()) {
                  <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                } @else {
                  Save Client
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class TherapistDashboardComponent implements OnInit {
  private api = inject(ApiService);
  
  clients = signal<Client[]>([]);
  showModal = signal(false);
  
  // Form fields
  displayName = '';
  email = '';
  notes = '';
  
  submitting = signal(false);
  error = signal<string | null>(null);

  async ngOnInit() {
    await this.loadClients();
  }

  async loadClients() {
    try {
      const data = await this.api.getClients();
      this.clients.set(data);
    } catch (e) {
      console.error('Failed to load clients', e);
    }
  }

  openModal() {
    this.displayName = '';
    this.email = '';
    this.notes = '';
    this.error.set(null);
    this.showModal.set(true);
  }

  closeModal() {
    if (!this.submitting()) {
      this.showModal.set(false);
    }
  }

  async submitForm() {
    if (!this.displayName.trim()) {
      this.error.set('Display name is required.');
      return;
    }
    
    this.submitting.set(true);
    this.error.set(null);

    try {
      await this.api.createClient({
        display_name: this.displayName.trim(),
        email: this.email.trim() || undefined,
        notes: this.notes.trim() || undefined
      });
      await this.loadClients();
      this.closeModal();
    } catch (e: any) {
      console.error('Failed to create client:', e);
      this.error.set(e.message || 'Failed to create client. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  isInactive(lastActiveStr?: string | null): boolean {
    if (!lastActiveStr) return true;
    const lastActive = new Date(lastActiveStr.replace(' ', 'T'));
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return lastActive < threeDaysAgo;
  }
}
