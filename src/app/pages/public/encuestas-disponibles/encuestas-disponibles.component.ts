import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { EncuestasService } from '../../../services/encuestas.service';
import { AlertService } from '../../../services/alert.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-encuestas-disponibles',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './encuestas-disponibles.component.html',
})
export default class EncuestasDisponiblesComponent implements OnInit {

  public encuestas: any[] = [];
  public cargando: boolean = true;

  constructor(
    private encuestasService: EncuestasService,
    private alertService: AlertService,
    public authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Validar token y cargar usuario antes de cargar encuestas
    this.authService.validarToken().subscribe({
      next: (isValid) => {
        if (isValid) {
          this.cargarEncuestasAsignadas();
        } else {
          this.router.navigate(['/login']);
        }
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  cargarEncuestasAsignadas(): void {
    this.alertService.loading();

    // Obtener el ID del usuario autenticado
    const userId = this.authService.usuario?.userId;

    if (!userId) {
      this.cargando = false;
      this.alertService.close();
      this.router.navigate(['/login']);
      return;
    }

    // Obtener solo las encuestas asignadas al usuario
    this.encuestasService.obtenerEncuestasAsignadas(userId).subscribe({
      next: ({ encuestas }) => {
        // Filtrar solo las encuestas activas
        this.encuestas = encuestas
          .filter((asignacion: any) => asignacion.encuesta.estado === 'Activa')
          .map((asignacion: any) => asignacion.encuesta);
        this.cargando = false;
        this.alertService.close();
      }, error: ({ error }) => {
        this.cargando = false;
        this.alertService.errorApi(error.message);
      }
    });
  }

  cerrarSesion(): void {
    this.authService.logout();
  }

}
