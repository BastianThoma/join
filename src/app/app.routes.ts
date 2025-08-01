import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { SummaryComponent } from './pages/summary/summary.component';
import { ContactsComponent } from './pages/contacts/contacts.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'summary', component: SummaryComponent },
  { path: 'contacts', component: ContactsComponent },
];
  
