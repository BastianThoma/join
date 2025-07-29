import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  getDocs,
  addDoc,
  CollectionReference,
  DocumentData,
} from '@angular/fire/firestore';

interface Contact {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  color: string;
}

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss'],
})
export class ContactsComponent {
  showEditContactOverlay = false;
  editName = '';
  editEmail = '';
  editPhone = '';
  editError = '';
  showContactMenu = false;
  contacts: Contact[] = [];
  selectedContact: Contact | null = null;
  showAddContactOverlay = false;

  // Formularfelder für Add Contact
  addName = '';
  addEmail = '';
  addPhone = '';
  addError = '';

  private contactsCol: CollectionReference<DocumentData>;

  constructor(private firestore: Firestore) {
    this.contactsCol = collection(this.firestore, 'contacts');
    this.loadContacts();
  }

  async loadContacts() {
    const snapshot = await getDocs(this.contactsCol);
    this.contacts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Contact[];
  }

  get groupedContacts() {
    const groups: { [key: string]: Contact[] } = {};
    for (const c of this.contacts) {
      const letter = c.name?.charAt(0)?.toUpperCase() || '?';
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(c);
    }
    return Object.keys(groups)
      .sort()
      .map((letter) => ({ letter, contacts: groups[letter] }));
  }

  getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  showContactDetail(contact: Contact) {
    this.selectedContact = contact;
  }

  closeContactDetail() {
    this.selectedContact = null;
    this.closeContactMenu();
  }
  onFabAddClick() {
    this.showAddContactOverlay = true;
    this.addName = '';
    this.addEmail = '';
    this.addPhone = '';
    this.addError = '';
  }
  async addContact(event: Event) {
    event.preventDefault();
    this.addError = '';
    if (!this.addName.trim() || !this.addEmail.trim()) {
      this.addError = 'Name und Email sind Pflichtfelder.';
      return;
    }
    try {
      const color = this.getRandomColor();
      await addDoc(this.contactsCol, {
        name: this.addName.trim(),
        email: this.addEmail.trim(),
        phone: this.addPhone.trim(),
        color,
      });
      await this.loadContacts();
      this.showAddContactOverlay = false;
    } catch (e) {
      this.addError = 'Fehler beim Speichern.';
    }
  }

  getRandomColor() {
    // Feste Farbpalette wie bisher
    const colors = [
      '#ff7a00',
      '#9327ff',
      '#6e52ff',
      '#fc71ff',
      '#ffbb2b',
      '#1fd7c1',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  closeAddContactOverlay() {
    this.showAddContactOverlay = false;
  }

  onFabMenuClick() {
    this.showContactMenu = !this.showContactMenu;
  }

  closeContactMenu() {
    this.showContactMenu = false;
  }

  async deleteContact() {
    if (!this.selectedContact?.id) return;
    // Firestore delete
    const { doc, deleteDoc } = await import('@angular/fire/firestore');
    await deleteDoc(doc(this.contactsCol, this.selectedContact.id));
    this.closeContactMenu();
    this.closeContactDetail();
    await this.loadContacts();
  }

  editContact() {
    if (!this.selectedContact) return;
    this.editName = this.selectedContact.name;
    this.editEmail = this.selectedContact.email;
    this.editPhone = this.selectedContact.phone || '';
    this.editError = '';
    this.showEditContactOverlay = true;
    this.closeContactMenu();
  }

  closeEditContactOverlay() {
    this.showEditContactOverlay = false;
  }

  async saveEditContact(event: Event) {
    event.preventDefault();
    this.editError = '';
    if (!this.editName.trim() || !this.editEmail.trim()) {
      this.editError = 'Name und Email sind Pflichtfelder.';
      return;
    }
    if (!this.selectedContact?.id) return;
    const { doc, updateDoc } = await import('@angular/fire/firestore');
    try {
      await updateDoc(doc(this.contactsCol, this.selectedContact.id), {
        name: this.editName.trim(),
        email: this.editEmail.trim(),
        phone: this.editPhone.trim(),
      });
      await this.loadContacts();
      this.selectedContact =
        this.contacts.find((c) => c.id === this.selectedContact?.id) || null;
      this.showEditContactOverlay = false;
    } catch (e) {
      this.editError = 'Fehler beim Speichern.';
    }
  }
}
