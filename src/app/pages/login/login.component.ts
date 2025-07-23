import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  constructor(private auth: Auth, private router: Router) {}

  email: string = '';
  errorMessage: string = '';

  logoAnimActive = false;
  hideLogo: boolean = false;

  password: string = '';
  showPassword: boolean = false;

  ngOnInit() {
    setTimeout(() => {
      this.logoAnimActive = true;
    }, 1000); // Startet die Animation nach 1 Sekunde

    window.addEventListener('scroll', this.handleScrollOrResize);
    window.addEventListener('resize', this.handleScrollOrResize);
    this.handleScrollOrResize();
  }

  async login() {
    this.errorMessage = '';
    try {
      await signInWithEmailAndPassword(this.auth, this.email, this.password);
      this.email = '';
      this.password = '';
      localStorage.setItem('join_greeting_show', '1');
      this.router.navigate(['/summary']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Login fehlgeschlagen';
    }
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.handleScrollOrResize);
    window.removeEventListener('resize', this.handleScrollOrResize);
  }

  handleScrollOrResize = () => {
    const isSmallScreen = window.innerWidth < 390;
    const isScrolled = window.scrollY > 0;
    this.hideLogo = isSmallScreen && isScrolled;
  };

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
