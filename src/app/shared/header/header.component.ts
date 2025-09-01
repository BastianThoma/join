
/**
 * HeaderComponent
 *
 * Stellt den Seitenkopf der Anwendung dar. Enthält das Logo und das Benutzerprofil.
 *
 * - Nutzt semantisches HTML und ARIA-Attribute für Barrierefreiheit (WCAG 2.1 AA).
 * - Initialen werden als Benutzerkürzel angezeigt.
 */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  /**
   * Initialen des angemeldeten Benutzers (wird im Header angezeigt).
   * Default: 'G'
   */
  @Input() initials: string = 'G';
}
