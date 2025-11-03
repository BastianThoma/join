import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard für Routen-Schutz
 * 
 * Schützt Routen vor unbefugtem Zugriff und leitet nicht authentifizierte
 * Benutzer zur Login-Seite weiter. Erfordert sowohl Firebase Auth als auch
 * manuellen Login für zusätzliche Sicherheit.
 * 
 * @returns boolean - True wenn Zugriff erlaubt
 */
export const authGuard = (): boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Prüfen ob sowohl Firebase Auth als auch manueller Login vorhanden
  if (authService.canAccessProtectedRoute()) {
    return true;
  } else {
    // Unauthorized Access - zur Login-Seite weiterleiten
    console.warn('Access denied: User not properly authenticated');
    router.navigate(['/login']);
    return false;
  }
};

/**
 * Public Guard für öffentlich zugängliche Seiten
 * 
 * Erlaubt Zugriff auf Login, Register, Privacy Policy und Legal Notice
 * auch ohne Authentifizierung.
 * 
 * @returns boolean - Immer true für öffentliche Seiten
 */
export const publicGuard = () => {
  return true;
};