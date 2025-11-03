import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { authState } from '@angular/fire/auth';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * AuthService
 * 
 * Zentraler Service für Authentifizierungslogik und Sicherheitsüberprüfungen.
 * Verhindert unbefugten Zugriff auf geschützte Bereiche.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  /** Firebase Auth Service */
  private auth = inject(Auth);
  
  /** Angular Router Service */
  private router = inject(Router);
  
  /** Aktueller Authentifizierungsstatus */
  public isAuthenticated$: Observable<boolean>;
  
  /** Manuelles Login-Flag für zusätzliche Sicherheit */
  private manualLoginSubject = new BehaviorSubject<boolean>(false);
  public manualLogin$ = this.manualLoginSubject.asObservable();

  constructor() {
    // Observable für Authentifizierungsstatus
    this.isAuthenticated$ = authState(this.auth).pipe(
      map(user => !!user)
    );
    
    // Bei Browser-Refresh das manuelle Login-Flag zurücksetzen
    this.resetManualLoginOnRefresh();
  }

  /**
   * Setzt das manuelle Login-Flag
   * Wird aufgerufen, wenn sich ein Benutzer explizit anmeldet
   */
  setManualLogin(): void {
    this.manualLoginSubject.next(true);
    // Flag in sessionStorage speichern (wird bei Browser-Refresh gelöscht)
    sessionStorage.setItem('join_manual_login', 'true');
  }

  /**
   * Prüft, ob der Benutzer sich manuell angemeldet hat
   * Verhindert automatische Anmeldung durch Firebase Persistenz
   */
  hasManualLogin(): boolean {
    return sessionStorage.getItem('join_manual_login') === 'true';
  }

  /**
   * Setzt das manuelle Login-Flag bei Browser-Refresh zurück
   */
  private resetManualLoginOnRefresh(): void {
    // Prüfen ob sessionStorage verfügbar ist
    if (typeof sessionStorage !== 'undefined') {
      const manualLogin = sessionStorage.getItem('join_manual_login');
      if (manualLogin === 'true') {
        this.manualLoginSubject.next(true);
      }
    }
  }

  /**
   * Vollständiger Logout
   * Löscht Firebase-Session und manuelle Login-Flags
   */
  async logout(): Promise<void> {
    try {
      // Firebase Session beenden
      await this.auth.signOut();
      
      // Manuelle Login-Flags zurücksetzen
      this.manualLoginSubject.next(false);
      sessionStorage.removeItem('join_manual_login');
      
      // Zur Login-Seite weiterleiten
      await this.router.navigate(['/login']);
      
    } catch (error) {
      console.error('Fehler beim Abmelden:', error);
    }
  }

  /**
   * Prüft, ob Zugriff auf geschützte Bereiche erlaubt ist
   * Erfordert sowohl Firebase Auth als auch manuellen Login
   */
  canAccessProtectedRoute(): boolean {
    const hasFirebaseAuth = !!this.auth.currentUser;
    const hasManualLogin = this.hasManualLogin();
    
    return hasFirebaseAuth && hasManualLogin;
  }

  /**
   * Erzwingt Logout, wenn unauthorisierter Zugriff festgestellt wird
   */
  async enforceLogout(): Promise<void> {
    console.warn('Unauthorized access detected - forcing logout');
    await this.logout();
  }
}