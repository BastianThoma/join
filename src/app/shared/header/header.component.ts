
/**
 * HeaderComponent
 *
 * Stellt den Seitenkopf der Anwendung dar. Enthält das Logo und das Benutzerprofil.
 *
 * - Nutzt semantisches HTML und ARIA-Attribute für Barrierefreiheit (WCAG 2.1 AA).
 * - Initialen werden als Benutzerkürzel angezeigt.
 * - Logout-Funktionalität für Sicherheit
 */
import { Component, Input, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  
  /** AuthService für sicheren Logout */
  private authService = inject(AuthService);
  
  /** Router für Navigation */
  private router = inject(Router);
  
  /**
   * Initialen des angemeldeten Benutzers (wird im Header angezeigt).
   * Default: 'G'
   */
  @Input() initials: string = 'G';
  
  /** Zustand des User-Dropdown-Menüs */
  showUserMenu: boolean = false;
  
  /**
   * Schaltet das User-Menü um
   */
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }
  
  /**
   * Schließt das User-Menü
   */
  closeUserMenu(): void {
    this.showUserMenu = false;
  }
  
  /**
   * Schließt alle offenen Menüs
   */
  closeAllMenus(): void {
    this.showUserMenu = false;
  }
  
  /**
   * Schließt Menüs beim Klick außerhalb
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.app-header__user-menu')) {
      this.closeAllMenus();
    }
  }
  
  /**
   * Schließt Menüs bei Escape-Taste
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeAllMenus();
  }
  
  /**
   * Navigiert zur Startseite beim Logo-Klick
   * Eingeloggt: Summary, Nicht eingeloggt: Login
   */
  navigateToHome(): void {
    if (this.authService.canAccessProtectedRoute()) {
      // User ist eingeloggt → Summary
      this.router.navigate(['/summary']);
    } else {
      // User ist nicht eingeloggt → Login
      this.router.navigate(['/login']);
    }
  }
  
  /**
   * Meldet den aktuellen Benutzer ab
   * Verwendet AuthService für vollständigen und sicheren Logout
   */
  async logout(): Promise<void> {
    this.closeAllMenus();
    await this.authService.logout();
  }
}
