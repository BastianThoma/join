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

  /**
   * Prüft, ob der aktuelle Benutzer ein Gast ist
   * @returns true wenn Gast-Account
   */
  isGuestUser(): boolean {
    const currentUser = this.auth.currentUser;
    return currentUser?.email === 'guest@join-demo.com';
  }

  /**
   * Gibt die aktuelle User-ID zurück
   * @returns User-ID oder null
   */
  getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  /**
   * Prüft, ob der Benutzer Schreibrechte hat
   * @returns true wenn normale User-Rechte oder Admin
   */
  canModifyData(): boolean {
    // Gäste können keine Daten ändern (außer als Admin für Demo-Setup)
    return !this.isGuestUser() || this.isAdmin();
  }

  /**
   * Prüft Admin-Status (für Demo-Daten-Setup)
   * @returns true wenn Admin (für jetzt: nur für Setup)
   */
  private isAdmin(): boolean {
    // Prüfen ob localStorage verfügbar ist
    if (typeof localStorage === 'undefined') {
      return false;
    }
    
    try {
      return localStorage.getItem('join_admin_mode') === 'true';
    } catch (error) {
      console.warn('localStorage not accessible:', error);
      return false;
    }
  }

  /**
   * Aktiviert Admin-Modus für Demo-Setup
   */
  enableAdminMode(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('join_admin_mode', 'true');
        console.log('Admin-Modus aktiviert');
      } catch (error) {
        console.error('Fehler beim Aktivieren des Admin-Modus:', error);
      }
    }
  }

  /**
   * Deaktiviert Admin-Modus
   */
  disableAdminMode(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('join_admin_mode');
        console.log('Admin-Modus deaktiviert');
      } catch (error) {
        console.error('Fehler beim Deaktivieren des Admin-Modus:', error);
      }
    }
  }

  /**
   * Prüft aktuellen Admin-Status (für UI)
   */
  getAdminStatus(): boolean {
    return this.isAdmin();
  }
}