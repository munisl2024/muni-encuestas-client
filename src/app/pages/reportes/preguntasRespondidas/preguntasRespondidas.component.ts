import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { PreguntasRespondidasService } from '../../../services/preguntasRespondidas.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-preguntas-respondidas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: 'preguntasRespondidas.component.html'
})
export default class PreguntasRespondidasComponent implements OnInit {

  public idEncuesta: string = '';
  public cargando: boolean = false;
  public respuestasAgrupadas: any[] = [];

  // Paginación
  public paginaActual: number = 1;
  public itemsPorPagina: number = 10;
  public total: number = 0;
  public totalPaginas: number = 0;

  // Filtros
  public encuestadores: any[] = [];
  public encuestadorSeleccionado: number | null = null;
  public generoSeleccionado: string | null = null;
  public sigemSeleccionado: boolean | null = null;
  public fechaInicio: string = '';
  public fechaFin: string = '';

  // Expansión de respuestas
  public respuestasExpandidas: Set<number> = new Set();

  constructor(
    private preguntasRespondidasService: PreguntasRespondidasService,
    private alertService: AlertService,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe({
      next: ({ id }) => {
        this.idEncuesta = id;
        this.cargarEncuestadores();
        this.cargarRespuestas();
      },
      error: ({ error }) => {
        this.alertService.errorApi(error.message);
      }
    });
  }

  /**
   * Carga lista de encuestadores
   */
  cargarEncuestadores(): void {
    this.preguntasRespondidasService.obtenerEncuestadores(this.idEncuesta)
      .subscribe({
        next: (resp) => {
          this.encuestadores = resp.encuestadores;
        },
        error: ({ error }) => {
          console.error('Error al cargar encuestadores:', error);
        }
      });
  }

  /**
   * Carga respuestas agrupadas con paginación
   */
  cargarRespuestas(): void {
    this.cargando = true;
    this.preguntasRespondidasService.obtenerRespuestasAgrupadas(
      this.idEncuesta,
      this.paginaActual,
      this.itemsPorPagina,
      this.encuestadorSeleccionado || undefined,
      this.generoSeleccionado || undefined,
      this.sigemSeleccionado !== null ? this.sigemSeleccionado : undefined,
      this.fechaInicio || undefined,
      this.fechaFin || undefined
    ).subscribe({
      next: (resp) => {
        this.respuestasAgrupadas = resp.respuestasAgrupadas;
        this.total = resp.total;
        this.totalPaginas = resp.totalPaginas;
        this.cargando = false;
      },
      error: ({ error }) => {
        this.alertService.errorApi(error.message);
        this.cargando = false;
      }
    });
  }

  /**
   * Aplica todos los filtros
   */
  aplicarFiltros(): void {
    this.paginaActual = 1; // Resetear a primera página
    this.cargarRespuestas();
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    this.encuestadorSeleccionado = null;
    this.generoSeleccionado = null;
    this.sigemSeleccionado = null;
    this.fechaInicio = '';
    this.fechaFin = '';
    this.paginaActual = 1;
    this.cargarRespuestas();
  }

  /**
   * Verifica si hay algún filtro activo
   */
  get hayFiltrosActivos(): boolean {
    return this.encuestadorSeleccionado !== null ||
           this.generoSeleccionado !== null ||
           this.sigemSeleccionado !== null ||
           this.fechaInicio !== '' ||
           this.fechaFin !== '';
  }

  /**
   * Cambia la cantidad de items por página
   */
  cambiarItemsPorPagina(): void {
    this.paginaActual = 1; // Resetear a primera página
    this.cargarRespuestas();
  }

  /**
   * Navega a una página específica
   */
  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas || pagina === this.paginaActual) {
      return;
    }
    this.paginaActual = pagina;
    this.cargarRespuestas();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Obtiene array de páginas para mostrar en paginación
   */
  get paginasVisibles(): number[] {
    const maxPaginas = 5;
    const paginas: number[] = [];

    let inicio = Math.max(1, this.paginaActual - Math.floor(maxPaginas / 2));
    let fin = Math.min(this.totalPaginas, inicio + maxPaginas - 1);

    if (fin - inicio < maxPaginas - 1) {
      inicio = Math.max(1, fin - maxPaginas + 1);
    }

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    return paginas;
  }

  /**
   * Alterna la expansión de una respuesta
   */
  toggleExpansion(id: number): void {
    if (this.respuestasExpandidas.has(id)) {
      this.respuestasExpandidas.delete(id);
    } else {
      this.respuestasExpandidas.add(id);
    }
  }

  /**
   * Verifica si una respuesta está expandida
   */
  estaExpandida(id: number): boolean {
    return this.respuestasExpandidas.has(id);
  }
}
