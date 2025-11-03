import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * LegalNoticeComponent
 * 
 * Impressum nach deutschem Recht (TMG §5, RStV §55)
 * Erfüllt die gesetzlichen Informationspflichten für Websites
 * 
 * @author Join Development Team
 * @version 1.0.0
 * @since 2024
 */
@Component({
  selector: 'app-legal-notice',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './legal-notice.component.html',
  styleUrls: ['./legal-notice.component.scss']
})
export class LegalNoticeComponent {
  
  /** Aktuelles Datum für "Letzte Aktualisierung" */
  readonly lastUpdated = '3. November 2025';
  
  /** Kontakt-E-Mail für rechtliche Anfragen */
  readonly legalEmail = 'legal@join-app.com';
  
  /** Allgemeine Kontakt-E-Mail */
  readonly contactEmail = 'contact@join-app.com';
  
  /** Verantwortliche Organisation */
  readonly responsibleOrganization = 'Join Development Team';
  
  /** Website URL */
  readonly websiteUrl = 'https://join-app.com';

  /**
   * Scrollt zum Seitenanfang
   * Verbessert die Benutzerfreundlichkeit bei langen Dokumenten
   */
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}