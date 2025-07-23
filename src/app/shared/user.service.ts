import { Injectable, computed, signal } from '@angular/core';
import { Auth, User, onAuthStateChanged } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class UserService {
  private _user = signal<User | null>(null);

  constructor(private auth: Auth) {
    onAuthStateChanged(this.auth, (user) => {
      this._user.set(user);
    });
  }

  user = computed(() => this._user());

  getInitials(): string {
    const user = this._user();
    if (!user) return '';
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return '';
  }
}
