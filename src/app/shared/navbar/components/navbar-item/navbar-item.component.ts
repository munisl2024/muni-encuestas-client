import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

interface Item {
  nombre: string,
  ruta: string
}

@Component({
  standalone: true,
  selector: 'app-navbar-item',
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './navbar-item.component.html',
  styleUrls: []
})
export default class NavbarItemComponent implements OnInit {

  @Input() item: Item;

  constructor(private authService: AuthService) { }

  ngOnInit() {
  }

  // Metodo: Cerrar sesion
  logout(): void { this.authService.logout(); }

}
