import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ReportesService } from '../../../services/reportes.service';
import { AlertService } from '../../../services/alert.service';
import { saveAs } from 'file-saver-es';

@Component({
  selector: 'app-reportes-generales',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reportesGenerales.component.html',
})
export default class ReportesGeneralesComponent implements OnInit {

  public idEncuesta: string = '';
  public cargando: boolean = false;
  public mostrarFiltros: boolean = false;

  // Filtros de fecha
  public fechaInicio: string = '';
  public fechaFin: string = '';
  public filtrosActivos: boolean = false;

  // Datos de la encuesta
  public encuesta: any = null;

  // Estadísticas generales
  public estadisticasGenerales: any = null;

  // Distribución de preguntas (solo se carga si el usuario lo solicita)
  public distribucionPreguntas: any[] = [];
  public mostrarDistribucion: boolean = true;

  // Datos demográficos (solo se carga si el usuario lo solicita)
  public datosdemograficos: any = null;
  public mostrarDemografia: boolean = true;

  constructor(
    private activatedRoute: ActivatedRoute,
    private reportesService: ReportesService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe({
      next: ({ id }) => {
        this.idEncuesta = id;
        this.cargarEstadisticas();
      },
      error: ({ error }) => {
        this.alertService.errorApi(error.message);
      }
    });
  }

  /**
   * Carga las estadísticas generales (carga inicial rápida)
   */
  cargarEstadisticas(): void {
    this.cargando = true;
    const fechaInicio = this.fechaInicio || undefined;
    const fechaFin = this.fechaFin || undefined;

    this.reportesService.obtenerEstadisticasCompletas(this.idEncuesta, fechaInicio, fechaFin)
      .subscribe({
        next: (resp) => {
          this.encuesta = resp.data.encuesta;
          this.estadisticasGenerales = resp.data.estadisticasGenerales;
          this.distribucionPreguntas = resp.data.distribucionPreguntas;
          this.datosdemograficos = resp.data.datosdemograficos;
          this.cargando = false;
          this.filtrosActivos = !!(fechaInicio || fechaFin);
        },
        error: ({ error }) => {
          this.alertService.errorApi(error.message);
          this.cargando = false;
        }
      });
  }

  /**
   * Aplica los filtros de fecha
   */
  aplicarFiltros(): void {
    if (this.fechaInicio && this.fechaFin && this.fechaInicio > this.fechaFin) {
      this.alertService.errorApi('La fecha de inicio debe ser menor a la fecha de fin');
      return;
    }
    this.cargarEstadisticas();
  }

  /**
   * Limpia los filtros
   */
  limpiarFiltros(): void {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.filtrosActivos = false;
    this.cargarEstadisticas();
  }

  /**
   * Alterna la visibilidad de la distribución
   */
  toggleDistribucion(): void {
    this.mostrarDistribucion = !this.mostrarDistribucion;
  }

  /**
   * Alterna la visibilidad de la demografía
   */
  toggleDemografia(): void {
    this.mostrarDemografia = !this.mostrarDemografia;
  }

  /**
   * Descarga el reporte en formato PDF
   */
  descargarPDF(): void {
    this.alertService.loading();
    const fechaInicio = this.fechaInicio || undefined;
    const fechaFin = this.fechaFin || undefined;

    this.reportesService.descargarPDFReporte(this.idEncuesta, fechaInicio, fechaFin)
      .subscribe({
        next: (blob) => {
          const nombreArchivo = `Reporte_Encuesta_${this.idEncuesta}_${new Date().toISOString().split('T')[0]}.pdf`;
          saveAs(blob, nombreArchivo);
          this.alertService.close();
        },
        error: ({ error }) => {
          this.alertService.close();
          this.alertService.errorApi(error?.message || 'Error al generar el PDF');
        }
      });
  }
}
