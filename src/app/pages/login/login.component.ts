import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

/**
 * LoginComponent - Hauptkomponente für Benutzeranmeldung
 * 
 * Diese Komponente behandelt die Benutzerauthentifizierung mit Firebase Auth
 * und bietet eine vollständig barrierefreie Login-Oberfläche nach WCAG 2.1 AA Standards.
 * 
 * Features:
 * - Firebase-Authentifizierung
 * - Animierte Logo-Darstellung
 * - Responsive Design mit Mobile-First Ansatz
 * - Passwort-Sichtbarkeits-Toggle
 * - Umfassende Formvalidierung
 * - Screen Reader Unterstützung
 * - Keyboard-Navigation
 * 
 * @author Join Development Team
 * @version 1.0.0
 * @since 2024
 */

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {

  // === Authentication Properties ===
  
  /** E-Mail-Adresse für die Anmeldung */
  email: string = '';
  
  /** Passwort für die Anmeldung */
  password: string = '';
  
  /** Fehlermeldung bei Login-Problemen */
  errorMessage: string = '';

  // === UI State Properties ===
  
  /** Kontrolliert die Logo-Animation */
  logoAnimActive: boolean = false;
  
  /** Kontrolliert die Logo-Sichtbarkeit bei kleinen Bildschirmen */
  hideLogo: boolean = false;
  
  /** Kontrolliert die Passwort-Sichtbarkeit */
  showPassword: boolean = false;

  // === Private Properties ===
  
  /** Timer ID für die Logo-Animation */
  private logoAnimationTimer?: number;

  /**
   * Konstruktor
   * Initialisiert die benötigten Services
   * 
   * @param auth - Firebase Auth Service
   * @param router - Angular Router Service
   */
  constructor(
    private auth: Auth, 
    private router: Router
  ) {}

  /**
   * Component Initialization
   * Startet Logo-Animation und Event Listeners
   */
  ngOnInit(): void {
    this.initializeLogoAnimation();
    this.setupEventListeners();
    this.handleScrollOrResize();
  }

  /**
   * Component Cleanup
   * Entfernt Event Listeners und Timer
   */
  ngOnDestroy(): void {
    this.removeEventListeners();
    this.clearLogoAnimationTimer();
  }

  // === Authentication Methods ===

  /**
   * Behandelt den Login-Prozess
   * Validiert Eingaben und authentifiziert den Benutzer über Firebase
   * 
   * @returns Promise<void>
   */
  async login(): Promise<void> {
    // Reset error state
    this.errorMessage = '';
    
    // Basic validation
    if (!this.email.trim() || !this.password.trim()) {
      this.errorMessage = 'Bitte füllen Sie alle Pflichtfelder aus.';
      return;
    }

    try {
      // Authenticate with Firebase
      await signInWithEmailAndPassword(this.auth, this.email, this.password);
      
      // Clear form data
      this.clearLoginForm();
      
      // Set greeting flag for summary page
      localStorage.setItem('join_greeting_show', '1');
      
      // Navigate to summary
      await this.router.navigate(['/summary']);
      
    } catch (error: any) {
      this.handleLoginError(error);
    }
  }

  /**
   * Behandelt Login-Fehler und setzt benutzerfreundliche Fehlermeldungen
   * 
   * @param error - Firebase Auth Error
   */
  private handleLoginError(error: any): void {
    console.error('Login error:', error);
    
    // Map Firebase error codes to user-friendly messages
    switch (error.code) {
      case 'auth/user-not-found':
        this.errorMessage = 'Kein Benutzer mit dieser E-Mail-Adresse gefunden.';
        break;
      case 'auth/wrong-password':
        this.errorMessage = 'Falsches Passwort. Bitte versuchen Sie es erneut.';
        break;
      case 'auth/invalid-email':
        this.errorMessage = 'Ungültige E-Mail-Adresse.';
        break;
      case 'auth/user-disabled':
        this.errorMessage = 'Dieser Benutzeraccount wurde deaktiviert.';
        break;
      case 'auth/too-many-requests':
        this.errorMessage = 'Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.';
        break;
      default:
        this.errorMessage = error.message || 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.';
    }
  }

  /**
   * Löscht die Login-Formulardaten
   */
  private clearLoginForm(): void {
    this.email = '';
    this.password = '';
    this.showPassword = false;
  }

  // === UI Interaction Methods ===

  /**
   * Schaltet die Passwort-Sichtbarkeit um
   * Wichtig für Accessibility - Benutzer können ihr Passwort überprüfen
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // === Logo Animation Methods ===

  /**
   * Initialisiert die Logo-Animation
   * Startet nach 1 Sekunde für bessere UX
   */
  private initializeLogoAnimation(): void {
    this.logoAnimationTimer = window.setTimeout(() => {
      this.logoAnimActive = true;
    }, 1000);
  }

  /**
   * Löscht den Logo-Animation Timer
   */
  private clearLogoAnimationTimer(): void {
    if (this.logoAnimationTimer) {
      window.clearTimeout(this.logoAnimationTimer);
      this.logoAnimationTimer = undefined;
    }
  }

  // === Event Handling Methods ===

  /**
   * Richtet Event Listeners für Scroll und Resize ein
   */
  private setupEventListeners(): void {
    window.addEventListener('scroll', this.handleScrollOrResize);
    window.addEventListener('resize', this.handleScrollOrResize);
  }

  /**
   * Entfernt Event Listeners
   */
  private removeEventListeners(): void {
    window.removeEventListener('scroll', this.handleScrollOrResize);
    window.removeEventListener('resize', this.handleScrollOrResize);
  }

  /**
   * Behandelt Scroll- und Resize-Events
   * Versteckt das Logo auf kleinen Bildschirmen beim Scrollen
   * 
   * Arrow function um 'this' Context zu bewahren
   */
  private handleScrollOrResize = (): void => {
    const isSmallScreen = window.innerWidth < 390;
    const isScrolled = window.scrollY > 0;
    this.hideLogo = isSmallScreen && isScrolled;
  };

  // === Utility Methods ===

  /**
   * Prüft ob das Login-Formular gültig ist
   * 
   * @returns boolean - True wenn alle Validierungen bestanden
   */
  isFormValid(): boolean {
    return this.email.trim().length > 0 && 
           this.password.trim().length > 0 && 
           this.isValidEmail(this.email);
  }

  /**
   * Validiert E-Mail-Format
   * 
   * @param email - Zu validierende E-Mail-Adresse
   * @returns boolean - True wenn E-Mail gültig
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Gibt den aktuellen Authentifizierungsstatus zurück
   * 
   * @returns boolean - True wenn Benutzer authentifiziert
   */
  isAuthenticated(): boolean {
    return !!this.auth.currentUser;
  }
}
