
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

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

  ngOnDestroy() {
    window.removeEventListener('scroll', this.handleScrollOrResize);
    window.removeEventListener('resize', this.handleScrollOrResize);
  }

  handleScrollOrResize = () => {
    const isSmallScreen = window.innerWidth < 390;
    const isScrolled = window.scrollY > 0;
    this.hideLogo = isSmallScreen && isScrolled;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
