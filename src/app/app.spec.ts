import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { App } from './app';
import { AuthService } from './services/auth.service';

class AuthServiceStub {
  isLoaded = signal(true);
  isSignedIn = signal(false);
  init = vi.fn().mockResolvedValue(undefined);
  signOut = vi.fn().mockResolvedValue(undefined);
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: AuthService, useClass: AuthServiceStub },
        provideNoopAnimations(),
        providePrimeNG({
          ripple: true,
          theme: {
            preset: Aura,
            options: {
              darkModeSelector: '.app-dark',
            },
          },
        }),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('OT Assistant');
  });
});
