import { Component, OnInit, inject, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-client-intake',
  standalone: true,
  imports: [CardModule, ButtonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto py-8 px-4">
      <div class="mb-4">
        <button (click)="goHome()" class="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 text-sm font-medium cursor-pointer">
          &larr; Back to Dashboard
        </button>
      </div>
      <p-card header="Welcome! Let's get started.">
        <p class="text-gray-600 mb-6">Please tell us a bit about your goals and current challenges.</p>

        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-12">
            <svg class="animate-spin h-8 w-8 text-primary-600 mb-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-gray-500 text-sm">Loading your intake form...</p>
          </div>
        } @else {
          <div class="flex flex-col gap-6">
            @if (successMessage()) {
              <div class="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg transition-all duration-300">
                <div class="flex items-start">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-emerald-800">
                      {{ successMessage() }}
                    </p>
                    <div class="mt-2">
                      <button (click)="goHome()" class="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline">
                        Go to Home Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }

            @if (errorMessage()) {
              <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm text-red-800 font-medium">
                      {{ errorMessage() }}
                    </p>
                  </div>
                </div>
              </div>
            }

            <div class="flex flex-col gap-2">
              <label class="font-semibold text-gray-900">What are your primary goals?</label>
              <textarea 
                [(ngModel)]="goals" 
                rows="4" 
                class="w-full border-gray-300 rounded-md shadow-sm border p-3 focus:ring-primary-500 focus:border-primary-500" 
                placeholder="E.g., I want to improve my grip strength"
                [disabled]="submitting()"
              ></textarea>
            </div>
            
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-gray-900">What daily challenges do you face?</label>
              <textarea 
                [(ngModel)]="challenges" 
                rows="3" 
                class="w-full border-gray-300 rounded-md shadow-sm border p-3 focus:ring-primary-500 focus:border-primary-500" 
                placeholder="E.g., Opening jars is difficult"
                [disabled]="submitting()"
              ></textarea>
            </div>
            
            <div class="flex gap-4">
              <p-button 
                [label]="submitting() ? 'Submitting...' : 'Submit Intake'" 
                (onClick)="submit()" 
                [disabled]="submitting()"
                styleClass="flex-1"
              ></p-button>
              
              <p-button 
                label="Cancel" 
                severity="secondary" 
                (onClick)="goHome()" 
                [disabled]="submitting()"
              ></p-button>
            </div>
          </div>
        }
      </p-card>
    </div>
  `
})
export class ClientIntakeComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  goals = '';
  challenges = '';
  
  loading = signal(true);
  submitting = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  async ngOnInit() {
    try {
      const intake = await this.api.getMyIntake();
      if (intake) {
        if (intake.goals_json) {
          try {
            const parsed = JSON.parse(intake.goals_json);
            this.goals = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : intake.goals_json;
          } catch {
            this.goals = intake.goals_json;
          }
        }
        this.challenges = intake.daily_challenges || '';
      }
    } catch (e: any) {
      console.error('Failed to load intake data:', e);
      this.errorMessage.set(e.message || 'Failed to load existing intake data.');
    } finally {
      this.loading.set(false);
    }
  }

  async submit() {
    this.submitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    try {
      await this.api.submitMyIntake({
        goals: this.goals,
        challenges: this.challenges
      });
      this.successMessage.set('Your intake information has been submitted successfully.');
      
      // Auto-redirect to dashboard after 2 seconds
      setTimeout(() => {
        if (this.successMessage()) {
          this.goHome();
        }
      }, 2000);
    } catch (e: any) {
      console.error('Failed to submit intake:', e);
      this.errorMessage.set(e.message || 'Failed to submit intake. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  goHome() {
    this.router.navigate(['/client']);
  }
}

