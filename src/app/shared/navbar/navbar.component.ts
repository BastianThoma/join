
/**
 * NavbarComponent
 *
 * Die Navigationsleiste der Anwendung. Stellt die Hauptnavigation bereit und erfüllt Barrierefreiheitsanforderungen (WCAG 2.1 AA).
 *
 * - Verwendet semantisches HTML und ARIA-Rollen für Screenreader.
 * - Die Navigationspunkte werden aus dem navItems-Array generiert.
 * - Die Methode getActive(route) prüft, ob ein Navigationspunkt aktiv ist.
 */
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
  /**
   * Navigationspunkte für die Hauptnavigation.
   * label: Anzeigename
   * icon: Icon-Dateiname (ohne Suffix)
   * route: Router-Link
   */
  navItems = [
    { label: 'Summary', icon: 'summary_icon', route: '/summary' },
    { label: 'Add Task', icon: 'addTask_icon', route: '/add-task' },
    { label: 'Board', icon: 'board_icon', route: '/board' },
    { label: 'Contacts', icon: 'contacts_icon', route: '/contacts' }
  ];

  /**
   * Prüft, ob die übergebene Route der aktuellen Route entspricht.
   *
   * @param route Die zu prüfende Route
   * @returns true, wenn die Route aktiv ist
   */
  getActive(route: string): boolean {
    return location.pathname === route;
  }
}
