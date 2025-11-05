import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * HelpComponent
 * 
 * Hilfe- und Dokumentationsseite für das Kanban Project Management Tool
 * Bietet Benutzerunterstützung und Anleitungen
 * 
 * @author Join Development Team
 * @version 1.0.0
 * @since 2025
 */
@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent {
  
  /**
   * Scrollt zum Seitenanfang
   */
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}