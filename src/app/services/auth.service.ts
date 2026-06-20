import { Injectable, signal } from '@angular/core';
import type { Clerk } from '@clerk/clerk-js';
import { environment } from '../../environments/environment';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private clerk!: Clerk;
  private initPromise: Promise<void> | null = null;
  private syncPromise: Promise<User | null> | null = null;
  
  // Reactive signals
  isLoaded = signal(false);
  isSignedIn = signal(false);
  userProfile = signal<User | null>(null);

  constructor() {}

  init(): Promise<void> {
    if (this.isLoaded()) return Promise.resolve();
    if (this.initPromise) return this.initPromise;

    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Clerk authentication is only available in the browser.'));
    }

    this.initPromise = Promise.all([
      import('@clerk/clerk-js'),
      import('@clerk/ui')
    ]).then(async ([{ Clerk }, { ui }]) => {
      this.assertClerkKey();
      this.clerk = new Clerk(environment.clerkPublishableKey);
      await this.clerk.load({ ui });
      
      this.clerk.addListener((payload: any) => {
        const isCurrentlySignedIn = !!payload.session;
        this.isSignedIn.set(isCurrentlySignedIn);
        
        const user = this.clerk.user;
        if (isCurrentlySignedIn && user) {
          this.syncPromise = (async () => {
            try {
              const token = await payload.session.getToken();
              const res = await fetch(`${environment.apiUrl}/me`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  name: user.fullName || user.username || 'Unknown',
                  email: user.primaryEmailAddress?.emailAddress || ''
                })
              });
              if (res.ok) {
                const dbUser = await res.json();
                this.userProfile.set(dbUser);
                return dbUser;
              }
            } catch (err) {
              console.error('Failed to sync user profile', err);
            }
            return null;
          })();
        } else {
          this.userProfile.set(null);
          this.syncPromise = null;
        }
      });

      this.isLoaded.set(true);
    });

    return this.initPromise;
  }

  async getToken(): Promise<string | null | undefined> {
    return this.clerk?.session?.getToken();
  }

  async getProfile(): Promise<User | null> {
    if (!this.isSignedIn()) return null;
    if (this.userProfile()) return this.userProfile();
    if (this.syncPromise) return this.syncPromise;
    return null;
  }

  mountSignIn(element: HTMLDivElement): void {
    this.clerk?.mountSignIn(element, {
      fallbackRedirectUrl: '/therapist',
      routing: 'hash'
    });
  }

  mountSignUp(element: HTMLDivElement): void {
    this.clerk?.mountSignUp(element, {
      fallbackRedirectUrl: '/therapist',
      routing: 'hash'
    });
  }

  async signOut(): Promise<void> {
    await this.clerk?.signOut();
    this.isSignedIn.set(false);
    this.userProfile.set(null);
  }

  private assertClerkKey(): void {
    const key = environment.clerkPublishableKey?.trim();
    if (!key || !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) {
      throw new Error('Invalid Clerk publishable key. Set environment.clerkPublishableKey.');
    }
  }
}
