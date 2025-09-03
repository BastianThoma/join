import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * BoardComponent
 *
 * Stellt das Aufgaben-Board dar. Hier werden Aufgaben nach Status sortiert angezeigt.
 * (Initiale leere Komponente, bitte nach Bedarf erweitern.)
 */
@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent {}
