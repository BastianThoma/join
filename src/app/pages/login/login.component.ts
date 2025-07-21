
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login',
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  logoAnimActive = false;

  ngOnInit() {
    setTimeout(() => {
      this.logoAnimActive = true;
    }, 1000); // Startet die Animation nach 1 Sekunde
  }
}
