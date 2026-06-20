import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const therapistGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoaded()) {
    await auth.init();
  }

  if (!auth.isSignedIn()) {
    return router.createUrlTree(['/login']);
  }

  const profile = await auth.getProfile();
  const role = profile?.role || 'none';
  if (role === 'none') {
    return router.createUrlTree(['/onboarding']);
  }
  if (role === 'therapist' || role === 'admin') {
    return true;
  }

  return router.createUrlTree(['/client']);
};

export const clientGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoaded()) {
    await auth.init();
  }

  if (!auth.isSignedIn()) {
    return router.createUrlTree(['/login']);
  }

  const profile = await auth.getProfile();
  const role = profile?.role || 'none';
  if (role === 'none') {
    return router.createUrlTree(['/onboarding']);
  }
  if (role === 'client') {
    return true;
  }

  return router.createUrlTree(['/therapist']);
};

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoaded()) {
    await auth.init();
  }

  if (auth.isSignedIn()) {
    const profile = await auth.getProfile();
    const role = profile?.role || 'none';
    if (role === 'none') {
      return router.createUrlTree(['/onboarding']);
    }
    if (role === 'client') {
      return router.createUrlTree(['/client']);
    }
    return router.createUrlTree(['/therapist']);
  }
  
  return true;
};

export const onboardingGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoaded()) {
    await auth.init();
  }

  if (!auth.isSignedIn()) {
    return router.createUrlTree(['/login']);
  }

  const profile = await auth.getProfile();
  const role = profile?.role || 'none';
  if (role === 'none') {
    return true;
  }
  if (role === 'client') {
    return router.createUrlTree(['/client']);
  }
  return router.createUrlTree(['/therapist']);
};
