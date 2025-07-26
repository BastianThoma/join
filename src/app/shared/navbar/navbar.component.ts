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
    { label: 'Summary', icon: 'summary_icon', route: '/summary' },
    { label: 'Add Task', icon: 'addTask_icon', route: '/add-task' },
    { label: 'Board', icon: 'board_icon', route: '/board' },
    { label: 'Contacts', icon: 'contacts_icon', route: '/contacts' }
  ];
  
  getActive(route: string): boolean {
    return location.pathname === route;
  }
}
