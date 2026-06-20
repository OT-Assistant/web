import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login';
import { TherapistDashboardComponent } from './features/therapist/dashboard';
import { ClientDetailComponent } from './features/therapist/client-detail';
import { PlanEditorComponent } from './features/therapist/plan-editor';
import { ClientHomeComponent } from './features/client/home';
import { ClientIntakeComponent } from './features/client/intake';
import { OnboardingComponent } from './features/auth/onboarding';
import { therapistGuard, clientGuard, guestGuard, onboardingGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'onboarding', component: OnboardingComponent, canActivate: [onboardingGuard] },
  { path: 'therapist', component: TherapistDashboardComponent, canActivate: [therapistGuard] },
  { path: 'therapist/client/:id', component: ClientDetailComponent, canActivate: [therapistGuard] },
  { path: 'therapist/client/:id/plan', component: PlanEditorComponent, canActivate: [therapistGuard] },
  { path: 'client', component: ClientHomeComponent, canActivate: [clientGuard] },
  { path: 'client/intake', component: ClientIntakeComponent, canActivate: [clientGuard] },
  { path: '', redirectTo: 'therapist', pathMatch: 'full' }
];
