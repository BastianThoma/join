import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Contact {
  name: string;
  email: string;
  color: string;
}

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss'],
})
export class ContactsComponent {
  contacts: Contact[] = [
    { name: 'Anton Mayer', email: 'antom@gmail.com', color: '#ff7a00' },
    { name: 'Anja Schulz', email: 'schulz@hotmail.com', color: '#9327ff' },
    { name: 'Benedikt Ziegler', email: 'benedikt@gmail.com', color: '#6e52ff' },
    { name: 'David Eisenberg', email: 'davidberg@gmail.com', color: '#fc71ff' },
    { name: 'Eva Fischer', email: 'eva@gmail.com', color: '#ffbb2b' },
    { name: 'Emmanuel Mauer', email: 'emmanuelma@gmail.com', color: '#1fd7c1' },
  ];

  selectedContact: Contact | null = null;
  showAddContactOverlay = false;

  get groupedContacts() {
    const groups: { [key: string]: Contact[] } = {};
    for (const c of this.contacts) {
      const letter = c.name.charAt(0).toUpperCase();
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
  }
  onFabAddClick() {
    this.showAddContactOverlay = true;
  }

  closeAddContactOverlay() {
    this.showAddContactOverlay = false;
  }

  onFabMenuClick() {
    // Hier Logik für Menü in der Detailansicht (z.B. Optionen anzeigen)
    alert('Menu für Kontakt!');
  }
}
