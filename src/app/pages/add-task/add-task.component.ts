import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  CollectionReference,
  DocumentData,
} from '@angular/fire/firestore';

interface Contact {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  color?: string;
}

@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-task.component.html',
  styleUrls: ['./add-task.component.scss'],
})
/**
 * Komponente zum Erstellen eines neuen Tasks mit Kontaktzuweisung, Priorität, Kategorie und Subtasks.
 */
export class AddTaskComponent {
  /** Reference auf den Category Picker Wrapper für Outside-Click-Erkennung */
  @ViewChild('categoryPickerWrapper', { static: false }) categoryPickerWrapper!: ElementRef;
  /** Reference auf den Kontakt-Selector-Wrapper für Outside-Click-Erkennung */
  @ViewChild('contactsSelectorWrapper', { static: false })
  contactsSelectorWrapper!: ElementRef;

  // --- Formularfelder ---
  /** Titel des Tasks */
  title = '';
  /** Beschreibung des Tasks */
  description = '';
  /** Fälligkeitsdatum */
  dueDate = '';
  /** Priorität des Tasks */
  priority: 'urgent' | 'medium' | 'low' = 'medium';
  /** Aktuell über Hover markierte Priorität (UI) */
  hoverPriority: 'urgent' | 'medium' | 'low' | null = null;
  /** IDs der zugewiesenen Kontakte */
  assignedTo: string[] = [];
  /** Kategorie des Tasks */
  category = '';
  /** Subtasks als Strings */
  subtasks: string[] = [];

  // --- Kontakte & Dropdown ---
  /** Alle Kontakte */
  contacts: Contact[] = [];
  /** Gefilterte Kontakte für das Dropdown */
  filteredContacts: Contact[] = [];
  /** Suchbegriff für Kontakte */
  contactSearch = '';
  /** Zeigt das Dropdown an */
  showContactsDropdown = false;
  /**
   * Steuert die Sichtbarkeit des Category-Dropdowns
   */
  showCategoryDropdown = false;

  // --- Fehler & Erfolg ---
  /** Fehlermeldung */
  error = '';
  /** Erfolgsmeldung */
  success = '';

  private tasksCol: CollectionReference<DocumentData>;
  private contactsCol: CollectionReference<DocumentData>;

  /**
   * Initialisiert Firestore-Collections und lädt Kontakte.
   * @param firestore Firestore-Instanz
   * @param el ElementRef für die Komponente
   */
  constructor(private firestore: Firestore, private el: ElementRef) {
    this.tasksCol = collection(this.firestore, 'tasks');
    this.contactsCol = collection(this.firestore, 'contacts');
    this.loadContacts();
  }

  /**
   * Schließt das Dropdown, wenn außerhalb des Kontakt-Selectors geklickt wird.
   * @param event Klick-Event
   */
  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: Event) {
    // Kontakte Dropdown
    if (this.showContactsDropdown && this.contactsSelectorWrapper) {
      if (!this.contactsSelectorWrapper.nativeElement.contains(event.target)) {
        this.showContactsDropdown = false;
      }
    }
    // Category Dropdown
    if (this.showCategoryDropdown && this.categoryPickerWrapper) {
      if (!this.categoryPickerWrapper.nativeElement.contains(event.target)) {
        this.showCategoryDropdown = false;
      }
    }
  }

  /**
   * Schließt das Dropdown bei Escape-Taste.
   * @param event Keyboard-Event
   */
  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(event: KeyboardEvent) {
    this.showContactsDropdown = false;
  }

  /**
   * Schließt das Kontakt-Dropdown.
   */
  closeContacts() {
    this.showContactsDropdown = false;
  }

  /**
   * Schließt das Dropdown verzögert (z.B. für Blur-Events).
   */
  closeContactsDelayed() {
    setTimeout(() => (this.showContactsDropdown = false), 200);
  }

  /**
   * Setzt die Priorität.
   * @param p Neue Priorität
   */
  setPriority(p: 'urgent' | 'medium' | 'low') {
    this.priority = p;
  }

  /**
   * Setzt die Hover-Priorität (für UI-Hervorhebung).
   * @param p Priorität oder null
   */
  setHover(p: 'urgent' | 'medium' | 'low' | null) {
    this.hoverPriority = p;
  }

  /**
   * Lädt alle Kontakte aus Firestore.
   */
  async loadContacts() {
    try {
      const snap = await getDocs(this.contactsCol);
      this.contacts = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as Contact[];
      this.filteredContacts = this.contacts.slice();
    } catch (e) {}
  }

  /**
   * Gibt die Initialen eines Namens zurück.
   * @param name Name des Kontakts
   * @returns Initialen als String
   */
  getInitials(name?: string) {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  /**
   * Öffnet das Kontakt-Dropdown und filtert Kontakte.
   */
  openContacts() {
    this.showContactsDropdown = true;
    this.filterContacts();
  }

  /**
   * Öffnet oder schließt das Dropdown (z.B. beim Klick auf das Icon).
   * @param e Event (optional)
   */
  toggleContacts(e?: Event) {
    if (e) e.stopPropagation();
    if (this.showContactsDropdown) {
      this.closeContacts();
    } else {
      this.showContactsDropdown = true;
      this.filterContacts();
    }
  }

  /**
   * Filtert die Kontakte nach dem Suchbegriff.
   */
  filterContacts() {
    const q = this.contactSearch.trim().toLowerCase();
    if (q.length < 2) {
      this.filteredContacts = this.contacts.slice();
      return;
    }
    this.filteredContacts = this.contacts.filter((c) =>
      (c.name || '').toLowerCase().includes(q)
    );
  }

  /**
   * Fügt einen Kontakt zur Auswahl hinzu oder entfernt ihn.
   * @param contact Kontakt-Objekt
   */
  toggleContactSelection(contact: Contact) {
    if (!contact || !contact.id) return;
    const idx = this.assignedTo.indexOf(contact.id);
    if (idx === -1) this.assignedTo.push(contact.id);
    else this.assignedTo.splice(idx, 1);
  }

  /**
   * Prüft, ob ein Kontakt zugewiesen ist.
   * @param id Kontakt-ID
   * @returns true, wenn zugewiesen
   */
  isAssigned(id?: string) {
    return !!id && this.assignedTo.indexOf(id) !== -1;
  }

  /**
   * Entfernt einen Subtask.
   * @param idx Index des Subtasks
   */
  removeSubtask(idx: number) {
    this.subtasks.splice(idx, 1);
  }

  /**
   * Gibt einen Kontakt anhand der ID zurück.
   * @param id Kontakt-ID
   * @returns Kontakt-Objekt oder undefined
   */
  getContactById(id: string): Contact | undefined {
    return this.contacts.find((c) => c.id === id);
  }

  /**
   * Öffnet den nativen Datepicker für ein gegebenes Input-Element.
   * Versucht zuerst die moderne showPicker()-Methode, fällt sonst auf focus+click zurück.
   * @param input Input-Element
   */
  openDatepicker(input: HTMLInputElement) {
    if (!input) return;
    const anyInput = input as any;
    if (typeof anyInput.showPicker === 'function') {
      try {
        anyInput.showPicker();
        return;
      } catch (e) {}
    }
    try {
      input.focus();
      input.click();
    } catch (e) {}
  }

  /**
   * Setzt das gesamte Formular zurück (alle Felder leeren).
   */
  clearForm() {
    this.title = '';
    this.description = '';
    this.dueDate = '';
    this.priority = 'medium';
    this.assignedTo = [];
    this.category = '';
    this.subtasks = [];
    this.contactSearch = '';
    this.filteredContacts = this.contacts.slice();
    this.error = '';
    this.success = '';
  }

  /**
   * Setzt die Kategorie und schließt das Dropdown
   */
  selectCategory(cat: string) {
    this.category = cat;
    this.showCategoryDropdown = false;
  }

  /**
   * Validiert und speichert das Formular als neuen Task in Firestore.
   */
  async onSubmit() {
    this.error = '';
    this.success = '';
    if (!this.title.trim()) {
      this.error = 'Title is required.';
      return;
    }
    if (!this.dueDate.trim()) {
      this.error = 'Due date is required.';
      return;
    }
    if (!this.category.trim()) {
      this.error = 'Category is required.';
      return;
    }
    try {
      await addDoc(this.tasksCol, {
        title: this.title.trim(),
        description: this.description.trim(),
        dueDate: this.dueDate.trim(),
        priority: this.priority,
        assignedTo: this.assignedTo,
        category: this.category.trim(),
        subtasks: this.subtasks,
        createdAt: new Date().toISOString(),
      });
      this.success = 'Task created!';
      this.title = '';
      this.description = '';
      this.dueDate = '';
      this.priority = 'medium';
      this.assignedTo = [];
      this.category = '';
      this.subtasks = [];
    } catch (e) {
      this.error = 'Error saving task.';
    }
  }
}
