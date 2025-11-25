import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import NavbarSeccionesComponent from './components/navbar-secciones/navbar-secciones.component';
import NavbarItemComponent from './components/navbar-item/navbar-item.component';
import { AlertService } from '../../services/alert.service';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  standalone: true,
  selector: 'app-navbar',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NavbarSeccionesComponent,
    NavbarItemComponent
  ],
  templateUrl: './navbar.component.html',
  styleUrls: []
})
export class NavbarComponent implements OnInit {

  public usuarioLogin: any = null;

  public filtroBuscador: string = '';

  public secciones = {
    configuraciones: false,
  }

  public arregloSecciones: any[] = [
    {
      nombre: 'Perfil',
      palabrasClave: ['mi perfil', 'perfil', 'mis datos', 'personales'],
      descripcion: 'Tus datos personales',
      soloAdmin: false,
      ruta: '/dashboard/perfil'
    },
    {
      nombre: 'Inicio',
      palabrasClave: ['inicio', 'home', 'principal', 'pagina', 'pagina principal'],
      descripcion: 'Pagina principal',
      soloAdmin: false,
      ruta: '/dashboard/home'
    },
    {
      nombre: 'Presupuestos',
      palabrasClave: ['presupuestos', 'listado', 'listado de presupuestos', 'listado presupuestos'],
      descripcion: 'Listado de presupuestos',
      soloAdmin: false,
      ruta: '/dashboard/presupuestos'
    },
    {
      nombre: 'Productos',
      palabrasClave: ['productos', 'listado', 'listado de productos', 'listado productos'],
      descripcion: 'Gestiona tus productos',
      soloAdmin: false,
      ruta: '/dashboard/productos'
    },
    {
      nombre: 'Clientes',
      palabrasClave: ['clientes', 'listado', 'listado de clientes', 'listado clientes'],
      descripcion: 'Gestiona tus clientes',
      soloAdmin: false,
      ruta: '/dashboard/clientes'
    },
    {
      nombre: 'Proveedores',
      palabrasClave: ['proveedores', 'listado', 'listado de proveedores', 'listado proveedores'],
      descripcion: 'Gestiona tus proveedores',
      soloAdmin: false,
      ruta: '/dashboard/proveedores'
    },
    {
      nombre: 'Empresa',
      palabrasClave: ['empresa', 'datos', 'datos empresa', 'datos de la empresa'],
      descripcion: 'Datos de tu empresa',
      soloAdmin: true,
      ruta: '/dashboard/empresa'
    },
    {
      nombre: 'Tipos de productos',
      palabrasClave: ['listado', 'tipos', 'productos', 'tipos de productos', 'tipos productos'],
      descripcion: 'Gestiona los tipos de productos',
      soloAdmin: true,
      ruta: '/dashboard/tipos-productos'
    },
    {
      nombre: 'Tipos de servicios',
      palabrasClave: ['listado', 'tipos', 'servicios', 'tipos de servicios', 'tipos servicios'],
      descripcion: 'Gestiona los tipos de servicios',
      soloAdmin: true,
      ruta: '/dashboard/tipos-servicios'
    },
    {
      nombre: 'Unidades de medida',
      palabrasClave: ['listado', 'unidades', 'medida', 'unidades de medida', 'unidades medida'],
      descripcion: 'Listado de unidades de medida',
      soloAdmin: true,
      ruta: '/dashboard/unidades-medida'
    },
    {
      nombre: 'Usuarios',
      palabrasClave: ['listado', 'usuarios', 'listado usuarios', 'listado de usuarios'],
      descripcion: 'Gestiona los usuarios del sistema',
      soloAdmin: true,
      ruta: '/dashboard/usuarios'
    }

  ]

  public arregloSeccionesAutorizadas: any[] = [];
  public arregloSeccionesFiltradas: any[] = [];


  constructor(
    public authService: AuthService,
    public dataService: DataService,
    public alertService: AlertService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.usuarioLogin = this.authService.usuario;
  }

  abrirCerrarSeccion(seccion: string): void {
    this.secciones[seccion] = !this.secciones[seccion];
  }

  // Metodo: Cerrar sesión
  logout(): void {
    this.alertService.question({ msg: 'Cerrando sesión', buttonText: 'Aceptar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.authService.logout();
          this.toastr.success('Hasta pronto', 'Sesión finalizada');
        }
      });
  }

  autorizarSecciones(): void {
    if (this.authService.usuario.role !== 'ADMIN_ROLE') { // No es ADMIN
      this.arregloSeccionesAutorizadas = this.arregloSecciones.filter((seccion: any) => !seccion.soloAdmin);
    } else { // Es ADMIN
      this.arregloSeccionesAutorizadas = this.arregloSecciones;
    }
  }

  filtrarSecciones(): void {
    this.arregloSeccionesFiltradas = this.arregloSeccionesAutorizadas.filter((seccion: any) => {
      return seccion.palabrasClave?.some((palabra: string) => palabra.toLowerCase().includes(this.filtroBuscador.toLowerCase()));
    });
  }

}
