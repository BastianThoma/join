import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Auth, createUserWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { Router } from '@angular/router';

/**
 * Register Component für die Benutzerregistrierung
 * 
 * Diese Komponente verwaltet die Registrierung neuer Benutzer mit Firebase Authentication.
 * Sie implementiert umfassendes Form-Handling, Validierung und Barrierefreiheits-Features.
 * 
 * @description Standalone Angular Komponente mit semantischem HTML und WCAG 2.1 AA Compliance
 * @author Join Team
 * @since v1.0.0
 * @example
 * ```html
 * <app-register></app-register>
 * ```
 */
@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit, OnDestroy {
  
  // ====== Form Properties ======
  
  /**
   * Benutzername für die Registrierung
   * @type {string}
   * @memberof RegisterComponent
   */
  name: string = '';
  
  /**
   * E-Mail-Adresse für die Registrierung
   * @type {string}
   * @memberof RegisterComponent
   */
  email: string = '';
  
  /**
   * Passwort für die Registrierung
   * @type {string}
   * @memberof RegisterComponent
   */
  password: string = '';
  
  /**
   * Passwort-Bestätigung für die Registrierung
   * @type {string}
   * @memberof RegisterComponent
   */
  confirmPassword: string = '';
  
  /**
   * Zustand der Datenschutzbestimmungen-Checkbox
   * @type {boolean}
   * @memberof RegisterComponent
   */
  acceptPrivacy: boolean = false;
  
  // ====== UI State Properties ======
  
  /**
   * Kontrolliert die Sichtbarkeit des Passworts
   * @type {boolean}
   * @memberof RegisterComponent
   */
  showPassword: boolean = false;
  
  /**
   * Kontrolliert die Sichtbarkeit der Passwort-Bestätigung
   * @type {boolean}
   * @memberof RegisterComponent
   */
  showConfirmPassword: boolean = false;
  
  /**
   * Steuert die Sichtbarkeit des Logos basierend auf Bildschirmgröße und Scroll-Position
   * @type {boolean}
   * @memberof RegisterComponent
   */
  hideLogo: boolean = false;
  
  // ====== Message Properties ======
  
  /**
   * Fehlermeldung für die Anzeige im UI
   * @type {string}
   * @memberof RegisterComponent
   */
  errorMessage: string = '';
  
  /**
   * Erfolgsmeldung für die Anzeige im UI
   * @type {string}
   * @memberof RegisterComponent
   */
  successMessage: string = '';

  /**
   * Constructor für RegisterComponent
   * 
   * @param {Auth} auth - Firebase Auth Service für Authentifizierung
   * @param {Router} router - Angular Router für Navigation
   * @memberof RegisterComponent
   */
  constructor(private auth: Auth, private router: Router) {}

  /**
   * OnInit Lifecycle Hook
   * 
   * Initialisiert die Komponente, setzt Event Listener für responsive
   * Logo-Behandlung und konfiguriert Barrierefreiheits-Features.
   * 
   * @memberof RegisterComponent
   */
  ngOnInit(): void {
    this.setupResponsiveLogoHandling();
    this.setupAccessibilityFeatures();
  }

  /**
   * OnDestroy Lifecycle Hook
   * 
   * Bereinigt Event Listener zur Vermeidung von Memory Leaks.
   * 
   * @memberof RegisterComponent
   */
  ngOnDestroy(): void {
    this.cleanupEventListeners();
  }

  // ====== Initialization Methods ======

  /**
   * Konfiguriert responsive Logo-Behandlung
   * 
   * @private
   * @memberof RegisterComponent
   */
  private setupResponsiveLogoHandling(): void {
    window.addEventListener('scroll', this.handleScrollOrResize);
    window.addEventListener('resize', this.handleScrollOrResize);
    this.handleScrollOrResize();
  }

  /**
   * Konfiguriert Barrierefreiheits-Features
   * 
   * Setzt Screen Reader Ankündigungen und Keyboard Navigation auf.
   * Implementiert WCAG 2.1 AA Richtlinien.
   * 
   * @private
   * @memberof RegisterComponent
   */
  private setupAccessibilityFeatures(): void {
    // Screen Reader Ankündigung für Seiten-Navigation
    this.announceToScreenReader('Registrierungs-Seite geladen. Füllen Sie das Formular aus, um ein neues Konto zu erstellen.');
  }

  /**
   * Bereinigt Event Listener
   * 
   * @private
   * @memberof RegisterComponent
   */
  private cleanupEventListeners(): void {
    window.removeEventListener('scroll', this.handleScrollOrResize);
    window.removeEventListener('resize', this.handleScrollOrResize);
  }

  // ====== Event Handler Methods ======

  /**
   * Behandelt Scroll- und Resize-Events für responsive Logo-Anzeige
   * 
   * Das Logo wird auf kleinen Bildschirmen beim Scrollen ausgeblendet,
   * um mehr Platz für das Formular zu schaffen.
   * 
   * @memberof RegisterComponent
   */
  handleScrollOrResize = (): void => {
    const isSmallScreen = window.innerWidth < 390;
    const isScrolled = window.scrollY > 0;
    this.hideLogo = isSmallScreen && isScrolled;
  };

  // ====== Accessibility Methods ======

  /**
   * Sendet Nachricht an Screen Reader
   * 
   * Erstellt temporäres Element für Live-Region Ankündigungen,
   * um Screen Reader über wichtige Änderungen zu informieren.
   * 
   * @param {string} message - Nachricht für Screen Reader
   * @private
   * @memberof RegisterComponent
   */
  private announceToScreenReader(message: string): void {
    // Erstelle temporäres Element für Screen Reader Ankündigung
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.classList.add('sr-only');
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Entferne Element nach kurzer Zeit
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }

  // ====== Password Visibility Methods ======

  /**
   * Wechselt die Sichtbarkeit des Passwort-Feldes
   * 
   * Implementiert barrierefreie Password-Visibility mit korrekten
   * ARIA-Attributen für Screen Reader.
   * 
   * @memberof RegisterComponent
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    
    // Screen Reader Information über Änderung
    const message = this.showPassword 
      ? 'Passwort wird jetzt angezeigt' 
      : 'Passwort wird jetzt versteckt';
    this.announceToScreenReader(message);
  }

  /**
   * Wechselt die Sichtbarkeit des Passwort-Bestätigung-Feldes
   * 
   * Implementiert barrierefreie Password-Visibility mit korrekten
   * ARIA-Attributen für Screen Reader.
   * 
   * @memberof RegisterComponent
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
    
    // Screen Reader Information über Änderung
    const message = this.showConfirmPassword 
      ? 'Passwort-Bestätigung wird jetzt angezeigt' 
      : 'Passwort-Bestätigung wird jetzt versteckt';
    this.announceToScreenReader(message);
  }

  // ====== Form Validation Methods ======

  /**
   * Validiert die Übereinstimmung der Passwörter
   * 
   * @returns {boolean} True wenn Passwörter übereinstimmen
   * @private
   * @memberof RegisterComponent
   */
  private validatePasswordMatch(): boolean {
    return this.password === this.confirmPassword;
  }

  /**
   * Validiert die Vollständigkeit aller Formularfelder
   * 
   * @returns {boolean} True wenn alle Felder gültig sind
   * @private
   * @memberof RegisterComponent
   */
  private validateForm(): boolean {
    return !!(
      this.name.trim() &&
      this.email.trim() &&
      this.password.length >= 6 &&
      this.confirmPassword.length >= 6 &&
      this.validatePasswordMatch() &&
      this.acceptPrivacy
    );
  }

  /**
   * Bereinigt Fehlermeldungen
   * 
   * @private
   * @memberof RegisterComponent
   */
  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // ====== Registration Methods ======

  /**
   * Führt die Benutzerregistrierung durch
   * 
   * Validiert Formulardaten, ruft Firebase Authentication auf und
   * behandelt Erfolgs- und Fehlerfälle mit barrierefreien Meldungen.
   * 
   * @async
   * @memberof RegisterComponent
   */
  async register(): Promise<void> {
    try {
      // Bereinige vorherige Meldungen
      this.clearMessages();

      // Validiere Formular
      if (!this.validateForm()) {
        this.handleValidationError();
        return;
      }

      // Spezifische Passwort-Validierung
      if (!this.validatePasswordMatch()) {
        this.errorMessage = 'Die Passwörter stimmen nicht überein.';
        this.announceToScreenReader('Fehler: Die Passwörter stimmen nicht überein.');
        return;
      }

      // Screen Reader Information über Registrierungsvorgang
      this.announceToScreenReader('Registrierung wird durchgeführt...');

      // Firebase Registrierung
      const credential = await createUserWithEmailAndPassword(
        this.auth,
        this.email,
        this.password
      );

      // Benutzerprofil mit Namen aktualisieren
      if (credential.user && this.name.trim()) {
        await updateProfile(credential.user, { displayName: this.name.trim() });
      }

      this.handleRegistrationSuccess();

    } catch (error: any) {
      this.handleRegistrationError(error);
    }
  }

  /**
   * Behandelt Validierungsfehler
   * 
   * @private
   * @memberof RegisterComponent
   */
  private handleValidationError(): void {
    this.errorMessage = 'Bitte füllen Sie alle Felder korrekt aus und akzeptieren Sie die Datenschutzbestimmungen.';
    this.announceToScreenReader('Fehler: ' + this.errorMessage);
  }

  /**
   * Behandelt erfolgreiche Registrierung
   * 
   * @private
   * @memberof RegisterComponent
   */
  private handleRegistrationSuccess(): void {
    this.successMessage = 'Registrierung erfolgreich! Sie werden zur Anmelde-Seite weitergeleitet...';
    this.announceToScreenReader('Erfolg: Registrierung abgeschlossen. Sie werden automatisch zur Anmelde-Seite weitergeleitet.');
    
    // Navigation nach erfolgreicher Registrierung
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 1200);
  }

  /**
   * Behandelt Registrierungsfehler von Firebase
   * 
   * Übersetzt Firebase Error Codes in benutzerfreundliche deutsche Meldungen
   * und stellt diese für Screen Reader zur Verfügung.
   * 
   * @param {any} error - Firebase Error Object
   * @private
   * @memberof RegisterComponent
   */
  private handleRegistrationError(error: any): void {
    console.error('Registrierung fehlgeschlagen:', error);
    
    let userFriendlyMessage = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
    
    // Spezifische Firebase Error Codes
    if (error?.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          userFriendlyMessage = 'Diese E-Mail-Adresse ist bereits registriert.';
          break;
        case 'auth/invalid-email':
          userFriendlyMessage = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
          break;
        case 'auth/weak-password':
          userFriendlyMessage = 'Das Passwort ist zu schwach. Bitte wählen Sie ein stärkeres Passwort.';
          break;
        case 'auth/network-request-failed':
          userFriendlyMessage = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
          break;
        case 'auth/operation-not-allowed':
          userFriendlyMessage = 'E-Mail/Passwort-Anmeldung ist nicht aktiviert.';
          break;
        case 'auth/too-many-requests':
          userFriendlyMessage = 'Zu viele Versuche. Bitte warten Sie einen Moment und versuchen Sie es erneut.';
          break;
        default:
          userFriendlyMessage = 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.';
      }
    }
    
    this.errorMessage = userFriendlyMessage;
    this.announceToScreenReader('Fehler: ' + userFriendlyMessage);
  }
}
