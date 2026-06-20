import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from './services/auth.service';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly appName = 'OT Assistant';
  public auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);

  async ngOnInit() {
    await this.auth.init();
  }

  async changeRole() {
    try {
      const updatedUser = await this.api.selectRole('none');
      this.auth.userProfile.set(updatedUser);
      await this.router.navigate(['/onboarding']);
    } catch (e) {
      console.error('Failed to change role', e);
    }
  }
}
