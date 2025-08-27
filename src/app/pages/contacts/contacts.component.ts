import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  Firestore 
} from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

/**
 * Interface für Kontakt-Datenstruktur
 * Definiert die Eigenschaften eines Kontakts in der Anwendung
 */
export interface Contact {
  /** Eindeutige ID des Kontakts */
  id: string;
  /** Vollständiger Name des Kontakts */
  name: string;
  /** E-Mail-Adresse des Kontakts */
  email: string;
  /** Telefonnummer des Kontakts (optional) */
  phone?: string;
  /** Farbcode für Avatar-Darstellung */
  color: string;
}

/**
 * Interface für alphabetisch gruppierte Kontakte
 * Strukturiert Kontakte nach Anfangsbuchstaben für bessere Übersicht
 */
export interface ContactGroup {
  /** Anfangsbuchstabe der Gruppe */
  letter: string;
  /** Array der Kontakte für diesen Buchstaben */
  contacts: Contact[];
}

/**
 * ContactsComponent - Hauptkomponente für Kontaktverwaltung
 * 
 * Diese Komponente bietet vollständige CRUD-Funktionalität für Kontakte
 * mit Accessibility-Compliance nach WCAG 2.1 AA Standards.
 * 
 * Features:
 * - Alphabetisch sortierte Kontaktliste
 * - Detailansicht für einzelne Kontakte
 * - Hinzufügen/Bearbeiten/Löschen von Kontakten
 * - Vollständige Keyboard-Navigation
 * - Screen Reader Unterstützung
 * - Responsive Design (Mobile-First)
 * 
 * @author Join Development Team
 * @version 1.0.0
 * @since 2024
 */

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit, OnDestroy {
  /** Firestore-Instanz für Datenbankoperationen */
  private firestore = inject(Firestore);
  
  /** Subject für Component Lifecycle Management */
  private destroy$ = new Subject<void>();

  // === State Management ===
  
  /** Array aller verfügbaren Kontakte */
  contacts: Contact[] = [];
  
  /** Aktuell ausgewählter Kontakt für Detailansicht */
  selectedContact: Contact | null = null;
  
  /** Status-Nachrichten für Screen Reader Updates */
  contactsStatusMessage: string = '';

  // === Overlay Controls ===
  
  /** Kontrolliert Sichtbarkeit des Kontakt-Menüs */
  showContactMenu: boolean = false;
  
  /** Kontrolliert Sichtbarkeit des Add-Contact Overlays */
  showAddContactOverlay: boolean = false;
  
  /** Kontrolliert Sichtbarkeit des Edit-Contact Overlays */
  showEditContactOverlay: boolean = false;

  // === Add Contact Form Data ===
  
  /** Name für neuen Kontakt */
  addName: string = '';
  
  /** E-Mail für neuen Kontakt */
  addEmail: string = '';
  
  /** Telefon für neuen Kontakt */
  addPhone: string = '';
  
  /** Fehlermeldung für Add-Formular */
  addError: string = '';

  // === Edit Contact Form Data ===
  
  /** Name für Kontakt-Bearbeitung */
  editName: string = '';
  
  /** E-Mail für Kontakt-Bearbeitung */
  editEmail: string = '';
  
  /** Telefon für Kontakt-Bearbeitung */
  editPhone: string = '';
  
  /** Fehlermeldung für Edit-Formular */
  editError: string = '';

  // === Color Palette ===
  
  /** 
   * Vordefinierte Farbpalette für Kontakt-Avatare
   * Bietet ausreichend Kontrast für Accessibility
   */
  private readonly avatarColors: string[] = [
    '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', '#00BEE8',
    '#1FD7C1', '#FF745E', '#FFA35E', '#FC71FF', '#FFC701',
    '#0038FF', '#C3FF2B', '#FFE62B', '#FF4646', '#FFBB2B'
  ];

  /**
   * Component Initialization
   * Lädt alle Kontakte und initialisiert die Darstellung
   */
  async ngOnInit(): Promise<void> {
    try {
      await this.loadContacts();
      this.updateStatusMessage('Kontakte geladen');
    } catch (error) {
      console.error('Fehler beim Laden der Kontakte:', error);
      this.updateStatusMessage('Fehler beim Laden der Kontakte');
    }
  }

  /**
   * Component Cleanup
   * Beendet alle aktiven Subscriptions
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // === Data Loading & Management ===

  /**
   * Lädt alle Kontakte aus Firestore
   * 
   * @returns Promise<void>
   */
  private async loadContacts(): Promise<void> {
    try {
      const contactsCollection = collection(this.firestore, 'contacts');
      const snapshot = await getDocs(contactsCollection);
      
      this.contacts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Contact));
      
      this.updateStatusMessage(`${this.contacts.length} Kontakte geladen`);
    } catch (error) {
      console.error('Fehler beim Laden der Kontakte:', error);
      this.updateStatusMessage('Fehler beim Laden der Kontakte');
    }
  }

  /**
   * Gruppiert Kontakte alphabetisch nach Anfangsbuchstaben
   * Originale Getter-Methode für Kompatibilität
   */
  get groupedContacts(): ContactGroup[] {
    const groups: { [key: string]: Contact[] } = {};
    for (const contact of this.contacts) {
      const letter = contact.name?.charAt(0)?.toUpperCase() || '?';
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(contact);
    }
    return Object.keys(groups)
      .sort()
      .map((letter) => ({ letter, contacts: groups[letter] }));
  }

  // === Utility Functions ===

  /**
   * Generiert Initialen aus einem Namen
   * Behandelt auch Namen mit mehreren Wörtern korrekt
   * 
   * @param name - Vollständiger Name
   * @returns Initialen (max. 2 Zeichen)
   */
  getInitials(name: string): string {
    if (!name) return '';
    
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Generiert eine zufällige Farbe für neue Kontakte
   * Verwendet vordefinierte, barrierefreie Farbpalette
   * 
   * @returns Hex-Farbcode
   */
  private generateRandomColor(): string {
    const randomIndex = Math.floor(Math.random() * this.avatarColors.length);
    return this.avatarColors[randomIndex];
  }

  /**
   * Gibt die Gesamtanzahl aller Kontakte zurück
   * Wird für Screen Reader Ankündigungen verwendet
   * 
   * @returns Anzahl der Kontakte
   */
  getTotalContactsCount(): number {
    return this.contacts.length;
  }

  /**
   * Aktualisiert Status-Nachricht für Screen Reader
   * 
   * @param message - Neue Status-Nachricht
   */
  private updateStatusMessage(message: string): void {
    this.contactsStatusMessage = message;
    
    // Nach kurzer Zeit leeren für bessere UX
    setTimeout(() => {
      this.contactsStatusMessage = '';
    }, 3000);
  }

  // === TrackBy Functions für Performance ===

  /**
   * TrackBy-Funktion für Kontakt-Gruppen
   * Optimiert Angular's Change Detection
   * 
   * @param index - Index der Gruppe
   * @param group - Kontakt-Gruppe
   * @returns Eindeutiger Identifier
   */
  trackByGroup(index: number, group: ContactGroup): string {
    return group.letter;
  }

  /**
   * TrackBy-Funktion für einzelne Kontakte
   * Verhindert unnötige DOM-Updates
   * 
   * @param index - Index des Kontakts
   * @param contact - Kontakt-Objekt
   * @returns Eindeutige Kontakt-ID
   */
  trackByContact(index: number, contact: Contact): string {
    return contact.id;
  }

  // === Contact Detail Operations ===

  /**
   * Öffnet Detailansicht für ausgewählten Kontakt
   * Setzt Focus für Accessibility
   * 
   * @param contact - Anzuzeigender Kontakt
   */
  showContactDetail(contact: Contact): void {
    this.selectedContact = contact;
    this.closeContactMenu();
    this.updateStatusMessage(`Details für ${contact.name} angezeigt`);
    
    // Focus nach kurzer Verzögerung setzen für bessere UX
    setTimeout(() => {
      const closeButton = document.querySelector('.contact-detail__close') as HTMLElement;
      closeButton?.focus();
    }, 300);
  }

  /**
   * Schließt die Kontakt-Detailansicht
   * Gibt Focus an ursprüngliche Position zurück
   */
  closeContactDetail(): void {
    const contactId = this.selectedContact?.id;
    this.selectedContact = null;
    this.closeContactMenu();
    this.updateStatusMessage('Detailansicht geschlossen');
    
    // Focus zurück zum ursprünglichen Kontakt-Button
    if (contactId) {
      setTimeout(() => {
        const contactButton = document.querySelector(`[aria-labelledby="contact-name-${contactId}"]`) as HTMLElement;
        contactButton?.focus();
      }, 100);
    }
  }

  // === FAB & Menu Operations ===

  /**
   * Behandelt Klick auf FAB wenn kein Kontakt ausgewählt
   * Öffnet Add-Contact Dialog
   */
  onFabAddClick(): void {
    this.openAddContact();
  }

  /**
   * Behandelt Klick auf FAB wenn Kontakt ausgewählt
   * Öffnet/Schließt Kontakt-Menü
   */
  onFabMenuClick(): void {
    this.showContactMenu = !this.showContactMenu;
    this.updateStatusMessage(
      this.showContactMenu ? 'Kontakt-Menü geöffnet' : 'Kontakt-Menü geschlossen'
    );
  }

  /**
   * Schließt das Kontakt-Menü
   * Setzt Focus zurück auf FAB
   */
  closeContactMenu(): void {
    this.showContactMenu = false;
    this.updateStatusMessage('Kontakt-Menü geschlossen');
    
    setTimeout(() => {
      const fabButton = document.querySelector('.contacts__fab') as HTMLElement;
      fabButton?.focus();
    }, 100);
  }

  // === Add Contact Operations ===

  /**
   * Öffnet Add-Contact Dialog
   * Initialisiert Formular und setzt Focus
   */
  openAddContact(): void {
    this.resetAddForm();
    this.showAddContactOverlay = true;
    this.updateStatusMessage('Kontakt hinzufügen Dialog geöffnet');
    
    setTimeout(() => {
      const nameInput = document.getElementById('add-name') as HTMLElement;
      nameInput?.focus();
    }, 300);
  }

  /**
   * Schließt Add-Contact Dialog
   * Gibt Focus an FAB zurück
   */
  closeAddContactOverlay(): void {
    this.showAddContactOverlay = false;
    this.resetAddForm();
    this.updateStatusMessage('Dialog geschlossen');
    
    setTimeout(() => {
      const fabButton = document.querySelector('.contacts__fab') as HTMLElement;
      fabButton?.focus();
    }, 100);
  }

  /**
   * Setzt das Add-Contact Formular zurück
   */
  private resetAddForm(): void {
    this.addName = '';
    this.addEmail = '';
    this.addPhone = '';
    this.addError = '';
  }

  /**
   * Fügt neuen Kontakt hinzu
   * Validiert Daten und speichert in Firestore
   * 
   * @param event - Form Submit Event
   */
  async addContact(event: Event): Promise<void> {
    event.preventDefault();
    
    // Validation
    if (!this.addName.trim() || !this.addEmail.trim()) {
      this.addError = 'Name und E-Mail sind Pflichtfelder';
      this.updateStatusMessage('Fehler: ' + this.addError);
      return;
    }

    // E-Mail Format Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.addEmail.trim())) {
      this.addError = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
      this.updateStatusMessage('Fehler: ' + this.addError);
      return;
    }

    // Duplicate Check
    const isDuplicate = this.contacts.some(contact => 
      contact.email.toLowerCase() === this.addEmail.trim().toLowerCase()
    );
    
    if (isDuplicate) {
      this.addError = 'Ein Kontakt mit dieser E-Mail-Adresse existiert bereits';
      this.updateStatusMessage('Fehler: ' + this.addError);
      return;
    }

    try {
      const newContact: Omit<Contact, 'id'> = {
        name: this.addName.trim(),
        email: this.addEmail.trim(),
        phone: this.addPhone.trim() || '',
        color: this.generateRandomColor()
      };

      const contactsCollection = collection(this.firestore, 'contacts');
      const docRef = await addDoc(contactsCollection, newContact);
      
      // Lokale Liste aktualisieren
      const addedContact: Contact = {
        id: docRef.id,
        ...newContact
      };
      
      this.contacts.push(addedContact);
      
      this.closeAddContactOverlay();
      this.updateStatusMessage(`Kontakt ${newContact.name} erfolgreich hinzugefügt`);
      
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Kontakts:', error);
      this.addError = 'Fehler beim Speichern des Kontakts';
      this.updateStatusMessage('Fehler beim Speichern des Kontakts');
    }
  }

  // === Edit Contact Operations ===

  /**
   * Öffnet Edit-Contact Dialog für ausgewählten Kontakt
   * Lädt aktuelle Daten und setzt Focus
   */
  editContact(): void {
    if (!this.selectedContact) return;
    
    this.editName = this.selectedContact.name;
    this.editEmail = this.selectedContact.email;
    this.editPhone = this.selectedContact.phone || '';
    this.editError = '';
    
    this.showEditContactOverlay = true;
    this.closeContactMenu();
    this.updateStatusMessage(`Bearbeitung von ${this.selectedContact.name} gestartet`);
    
    setTimeout(() => {
      const nameInput = document.getElementById('edit-name') as HTMLElement;
      nameInput?.focus();
    }, 300);
  }

  /**
   * Schließt Edit-Contact Dialog
   * Gibt Focus an ursprüngliche Position zurück
   */
  closeEditContactOverlay(): void {
    this.showEditContactOverlay = false;
    this.resetEditForm();
    this.updateStatusMessage('Bearbeitung abgebrochen');
    
    setTimeout(() => {
      const fabButton = document.querySelector('.contacts__fab') as HTMLElement;
      fabButton?.focus();
    }, 100);
  }

  /**
   * Setzt das Edit-Contact Formular zurück
   */
  private resetEditForm(): void {
    this.editName = '';
    this.editEmail = '';
    this.editPhone = '';
    this.editError = '';
  }

  /**
   * Speichert Änderungen am Kontakt
   * Validiert Daten und aktualisiert Firestore
   * 
   * @param event - Form Submit Event
   */
  async saveEditContact(event: Event): Promise<void> {
    event.preventDefault();
    
    if (!this.selectedContact) return;

    // Validation
    if (!this.editName.trim() || !this.editEmail.trim()) {
      this.editError = 'Name und E-Mail sind Pflichtfelder';
      this.updateStatusMessage('Fehler: ' + this.editError);
      return;
    }

    // E-Mail Format Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.editEmail.trim())) {
      this.editError = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
      this.updateStatusMessage('Fehler: ' + this.editError);
      return;
    }

    // Duplicate Check (außer für aktuellen Kontakt)
    const isDuplicate = this.contacts.some(contact => 
      contact.id !== this.selectedContact!.id &&
      contact.email.toLowerCase() === this.editEmail.trim().toLowerCase()
    );
    
    if (isDuplicate) {
      this.editError = 'Ein anderer Kontakt mit dieser E-Mail-Adresse existiert bereits';
      this.updateStatusMessage('Fehler: ' + this.editError);
      return;
    }

    try {
      const updatedData = {
        name: this.editName.trim(),
        email: this.editEmail.trim(),
        phone: this.editPhone.trim() || ''
      };

      const contactDoc = doc(this.firestore, 'contacts', this.selectedContact.id);
      await updateDoc(contactDoc, updatedData);
      
      // Lokale Daten aktualisieren
      const contactIndex = this.contacts.findIndex(c => c.id === this.selectedContact!.id);
      if (contactIndex !== -1) {
        this.contacts[contactIndex] = {
          ...this.selectedContact,
          ...updatedData
        };
        this.selectedContact = this.contacts[contactIndex];
      }
      
      this.closeEditContactOverlay();
      this.updateStatusMessage(`Kontakt ${updatedData.name} erfolgreich aktualisiert`);
      
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Kontakts:', error);
      this.editError = 'Fehler beim Speichern der Änderungen';
      this.updateStatusMessage('Fehler beim Speichern der Änderungen');
    }
  }

  // === Delete Contact Operations ===

  /**
   * Löscht den ausgewählten Kontakt
   * Zeigt Bestätigungsdialog und führt Löschung durch
   */
  async deleteContact(): Promise<void> {
    if (!this.selectedContact) return;

    const contactName = this.selectedContact.name;
    const confirmed = confirm(`Möchten Sie ${contactName} wirklich löschen?`);
    
    if (!confirmed) {
      this.updateStatusMessage('Löschung abgebrochen');
      return;
    }

    try {
      const contactDoc = doc(this.firestore, 'contacts', this.selectedContact.id);
      await deleteDoc(contactDoc);
      
      // Lokale Liste aktualisieren
      this.contacts = this.contacts.filter(c => c.id !== this.selectedContact!.id);
      
      this.closeContactDetail();
      this.updateStatusMessage(`Kontakt ${contactName} erfolgreich gelöscht`);
      
    } catch (error) {
      console.error('Fehler beim Löschen des Kontakts:', error);
      this.updateStatusMessage('Fehler beim Löschen des Kontakts');
    }
  }
}
