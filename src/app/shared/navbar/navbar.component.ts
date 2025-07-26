import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  navItems = [
    { label: 'Summary', icon: 'summary', route: '/summary' },
    { label: 'Add Task', icon: 'add_task', route: '/add-task' },
    { label: 'Board', icon: 'board', route: '/board' },
    { label: 'Contacts', icon: 'contacts', route: '/contacts' }
  ];
  
  getActive(route: string): boolean {
    return location.pathname === route;
  }
}
