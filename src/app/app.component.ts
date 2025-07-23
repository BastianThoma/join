import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './shared/header/header.component';
import { UserService } from './shared/user.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'join';

  constructor(public userService: UserService) {}

  isAuthRoute(): boolean {
    const path = window.location.pathname;
    return path === '/login' || path === '/register';
  }
}
