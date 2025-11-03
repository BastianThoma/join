import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  // Öffentlich zugängliche Seiten (ohne Authentifizierung)
  { 
    path: 'privacy-policy', 
    loadComponent: () => import('./pages/privacy-policy/privacy-policy.component').then(c => c.PrivacyPolicyComponent),
    canActivate: [publicGuard]
  },
  { 
    path: 'legal-notice', 
    loadComponent: () => import('./pages/legal-notice/legal-notice.component').then(c => c.LegalNoticeComponent),
    canActivate: [publicGuard]
  },
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login.component').then(c => c.LoginComponent),
    canActivate: [publicGuard]
  },
  { 
    path: 'register', 
    loadComponent: () => import('./pages/register/register.component').then(c => c.RegisterComponent),
    canActivate: [publicGuard]
  },
  
  // Geschützte Seiten (erfordern Authentifizierung)
  { 
    path: 'summary', 
    loadComponent: () => import('./pages/summary/summary.component').then(c => c.SummaryComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'add-task', 
    loadComponent: () => import('./pages/add-task/add-task.component').then(c => c.AddTaskComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'board', 
    loadComponent: () => import('./pages/board/board.component').then(c => c.BoardComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'contacts', 
    loadComponent: () => import('./pages/contacts/contacts.component').then(c => c.ContactsComponent),
    canActivate: [authGuard]
  },
  
  // Fallback-Routen
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
  
