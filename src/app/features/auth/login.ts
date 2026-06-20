import { Component, ElementRef, ViewChild, AfterViewInit, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html'
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('signInDiv') signInDiv!: ElementRef<HTMLDivElement>;
  private auth = inject(AuthService);

  ngAfterViewInit() {
    // Wait for Clerk to load if it hasn't already
    const checkLoaded = setInterval(() => {
      if (this.auth.isLoaded()) {
        clearInterval(checkLoaded);
        this.auth.mountSignIn(this.signInDiv.nativeElement);
      }
    }, 100);
  }
}
