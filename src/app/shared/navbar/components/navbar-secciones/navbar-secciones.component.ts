import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

interface Seccion {
  descripcion: string,
  items: Item[]
}

interface Item {
  nombre: string,
  ruta: string
}

@Component({
  standalone: true,
  selector: 'app-navbar-secciones',
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './navbar-secciones.component.html',
  styleUrls: []
})
export default class NavbarSeccionesComponent implements OnInit {

  public baseUrl = '/dashboard/';
  public showSecciones: boolean = false;

  @Input() seccion: Seccion;

  constructor() { }

  ngOnInit() {}

  abrirCerrarSeccion(): void {
    this.showSecciones = !this.showSecciones;
  }

}
