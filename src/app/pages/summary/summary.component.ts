import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../shared/user.service';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
})
export class SummaryComponent implements OnInit {
  showGreeting = true;
  greeting = '';
  name = '';

  constructor(public userService: UserService) {}

  ngOnInit() {
    if (localStorage.getItem('join_greeting_show') === '1') {
      const user = this.userService.user();
      this.name = user?.displayName || user?.email?.split('@')[0] || '';
      this.greeting = this.getGreeting();
      setTimeout(() => {
        this.showGreeting = false;
        localStorage.removeItem('join_greeting_show');
      }, 2500);
    } else {
      this.showGreeting = false;
    }
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 5) return 'Gute Nacht';
    if (hour < 11) return 'Guten Morgen';
    if (hour < 17) return 'Guten Tag';
    if (hour < 22) return 'Guten Abend';
    return 'Gute Nacht';
  }
}
