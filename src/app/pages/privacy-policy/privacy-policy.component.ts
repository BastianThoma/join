import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * PrivacyPolicyComponent
 * 
 * Datenschutzerklärung nach EU-DSGVO Standards
 * Informiert Nutzer über Datenverarbeitung, Rechte und Kontaktmöglichkeiten
 * 
 * @author Join Development Team
 * @version 1.0.0
 * @since 2024
 */
@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss']
})
export class PrivacyPolicyComponent {
  
  /** Aktuelles Datum für "Letzte Aktualisierung" */
  readonly lastUpdated = '3. November 2025';
  
  /** E-Mail-Adresse für Datenschutz-Anfragen */
  readonly privacyEmail = 'privacy@join-app.com';
  
  /** Verantwortliche Person/Organisation */
  readonly responsiblePerson = 'Join Development Team';

  /**
   * Scrollt zum Seitenanfang
   * Verbessert die Benutzerfreundlichkeit bei langen Dokumenten
   */
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}