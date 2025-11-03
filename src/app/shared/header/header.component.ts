
/**
 * HeaderComponent
 *
 * Stellt den Seitenkopf der Anwendung dar. Enthält das Logo und das Benutzerprofil.
 *
 * - Nutzt semantisches HTML und ARIA-Attribute für Barrierefreiheit (WCAG 2.1 AA).
 * - Initialen werden als Benutzerkürzel angezeigt.
 * - Logout-Funktionalität für Sicherheit
 */
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  
  /** AuthService für sicheren Logout */
  private authService = inject(AuthService);
  
  /**
   * Initialen des angemeldeten Benutzers (wird im Header angezeigt).
   * Default: 'G'
   */
  @Input() initials: string = 'G';
  
  /**
   * Meldet den aktuellen Benutzer ab
   * Verwendet AuthService für vollständigen und sicheren Logout
   */
  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
