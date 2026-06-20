import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  template: `
    <div class="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
          Welcome to OT Assistant
        </h1>
        <p class="mt-4 text-xl text-slate-600 max-w-2xl mx-auto">
          Please choose your role to set up your account and get started.
        </p>
        <p class="mt-2 text-sm text-slate-400 max-w-2xl mx-auto">
          Note: You can change or switch your role at any time by clicking "Change Role" in the top navigation bar.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        <!-- Therapist Card -->
        <button 
          (click)="selectRole('therapist')"
          [disabled]="loading()"
          class="group relative text-left bg-white border-2 border-slate-200 rounded-2xl p-8 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
          [class.border-blue-500]="pendingRole() === 'therapist'"
        >
          <div>
            <div class="h-14 w-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
              <!-- Briefcase SVG -->
              <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              I am a Therapist
            </h2>
            <p class="mt-4 text-slate-500 text-sm leading-relaxed">
              Create and manage client profiles, perform intake evaluations, generate AI-powered clinical activity plans, and track progress logs.
            </p>
          </div>
          <div class="mt-8 w-full">
            <span class="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shadow-sm">
              @if (loading() && pendingRole() === 'therapist') {
                Saving...
              } @else {
                Continue as Therapist
              }
            </span>
          </div>
        </button>

        <!-- Client Card -->
        <button 
          (click)="selectRole('client')"
          [disabled]="loading()"
          class="group relative text-left bg-white border-2 border-slate-200 rounded-2xl p-8 hover:border-emerald-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
          [class.border-emerald-500]="pendingRole() === 'client'"
        >
          <div>
            <div class="h-14 w-14 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:bg-emerald-100 transition-colors">
              <!-- User SVG -->
              <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              I am a Client
            </h2>
            <p class="mt-4 text-slate-500 text-sm leading-relaxed">
              Complete your personalized intake questions, view your daily exercise and activity plans, and submit check-ins.
            </p>
          </div>
          <div class="mt-8 w-full">
            <span class="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200 shadow-sm">
              @if (loading() && pendingRole() === 'client') {
                Saving...
              } @else {
                Continue as Client
              }
            </span>
          </div>
        </button>
      </div>

      @if (error()) {
        <div class="mt-8 max-w-md mx-auto bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-700 font-medium">
                {{ error() }}
              </p>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class OnboardingComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  pendingRole = signal<'therapist' | 'client' | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  async selectRole(role: 'therapist' | 'client') {
    this.pendingRole.set(role);
    this.loading.set(true);
    this.error.set(null);
    try {
      const updatedUser = await this.api.selectRole(role);
      this.auth.userProfile.set(updatedUser);
      
      if (role === 'therapist') {
        await this.router.navigate(['/therapist']);
      } else {
        await this.router.navigate(['/client']);
      }
    } catch (e: any) {
      console.error(e);
      this.error.set(e.message || 'Failed to select role. Please try again.');
      this.pendingRole.set(null);
    } finally {
      this.loading.set(false);
    }
  }
}
