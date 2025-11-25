import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../services/alert.service';
import { EncuestasService } from '../../services/encuestas.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Registrar todos los componentes de Chart.js y el plugin de labels
Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reportes.component.html',
})
export default class ReportesComponent implements OnInit, AfterViewInit {

  // Referencias a canvas
  @ViewChild('chartGenero') chartGeneroRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartEdad') chartEdadRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartBarrios') chartBarriosRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartSigem') chartSigemRef!: ElementRef<HTMLCanvasElement>;

  // Instancias de gráficas
  private chartGenero?: Chart;
  private chartEdad?: Chart;
  private chartBarrios?: Chart;
  private chartSigem?: Chart;

  public idEncuesta: string;
  public encuesta: any = null;
  public estadisticas: any = null;
  public distribucion: any[] = [];
  public encuestadores: any[] = [];
  public encuestadoresFiltrados: any[] = [];
  public cargando: boolean = true;

  // Filtros
  public fechaInicio: string = '';
  public fechaFin: string = '';
  public encuestadorId: number | null = null;

  // Lista de encuestadores únicos para el selector
  public listaEncuestadores: any[] = [];

  // Exponer objetos globales para usar en el template
  public Object = Object;
  public Math = Math;

  constructor(
    private activatedRoute: ActivatedRoute,
    private encuestasService: EncuestasService,
    private alertService: AlertService,
  ) { }

  ngOnInit(): void {
    this.alertService.loading();
    this.activatedRoute.params.subscribe({
      next: ({ id }) => {
        this.idEncuesta = id;
        this.cargarDatos();
      },
      error: ({ error }) => {
        this.alertService.errorApi(error.message);
      }
    });
  }

  ngAfterViewInit(): void {
    // Las gráficas se crearán después de cargar los datos
  }

  cargarDatos(): void {
    this.cargando = true;

    // Cargar estadísticas con filtros
    this.encuestasService.obtenerEstadisticas(this.idEncuesta, this.fechaInicio, this.fechaFin, this.encuestadorId || undefined).subscribe({
      next: (response) => {
        this.encuesta = response.encuesta;
        this.estadisticas = response.estadisticas;

        // Cargar distribución de respuestas con filtros
        this.encuestasService.obtenerDistribucion(this.idEncuesta, this.fechaInicio, this.fechaFin, this.encuestadorId || undefined).subscribe({
          next: (respDistribucion) => {
            this.distribucion = respDistribucion.distribucion;

            // Cargar encuestadores con filtros
            this.cargarEncuestadores();
          },
          error: ({ error }) => {
            this.cargando = false;
            this.alertService.errorApi(error.message);
          }
        });
      },
      error: ({ error }) => {
        this.cargando = false;
        this.alertService.errorApi(error.message);
      }
    });
  }

  cargarEncuestadores(): void {
    this.encuestasService.obtenerReporteDetallado(this.idEncuesta, this.fechaInicio, this.fechaFin, this.encuestadorId || undefined).subscribe({
      next: (respReporte) => {
        this.encuestadores = respReporte.participantes;
        this.encuestadoresFiltrados = respReporte.participantes;

        // Construir lista de encuestadores únicos (sin filtro de encuestador para mostrar todos)
        if (!this.encuestadorId) {
          this.construirListaEncuestadores();
        }

        this.cargando = false;
        this.alertService.close();

        // Actualizar gráficas después de cargar datos
        setTimeout(() => this.actualizarGraficas(), 100);
      },
      error: ({ error }) => {
        this.cargando = false;
        this.alertService.errorApi(error.message);
      }
    });
  }

  construirListaEncuestadores(): void {
    // Obtener todos los encuestadores sin filtro para poblar el selector
    this.encuestasService.obtenerReporteDetallado(this.idEncuesta).subscribe({
      next: (respReporte) => {
        // Crear un mapa para obtener encuestadores únicos por ID
        const encuestadoresMap = new Map();
        respReporte.participantes.forEach((participante: any) => {
          const usuario = participante.usuario;
          if (!encuestadoresMap.has(usuario.id)) {
            encuestadoresMap.set(usuario.id, {
              id: usuario.id,
              nombre: usuario.nombre,
              apellido: usuario.apellido,
              nombreCompleto: `${usuario.apellido.toLowerCase()}, ${usuario.nombre.toLowerCase()}`
            });
          }
        });
        this.listaEncuestadores = Array.from(encuestadoresMap.values()).sort((a, b) =>
          a.nombreCompleto.localeCompare(b.nombreCompleto)
        );
      },
      error: (error) => {
        console.error('Error al cargar lista de encuestadores:', error);
      }
    });
  }

  // Obtener estadísticas demográficas
  get estadisticasDemograficas(): any {
    if (!this.encuestadores || this.encuestadores.length === 0) return null;

    const participantes = this.encuestadores.filter(p => p.datosPersonales);

    // Por género
    const porGenero = participantes.reduce((acc, p) => {
      const genero = p.datosPersonales?.genero || 'No especificado';
      acc[genero] = (acc[genero] || 0) + 1;
      return acc;
    }, {});

    // Por rango de edad
    const porRangoEdad = participantes.reduce((acc, p) => {
      const rango = p.datosPersonales?.rangoEdad || 'No especificado';
      acc[rango] = (acc[rango] || 0) + 1;
      return acc;
    }, {});

    // Por barrio
    const porBarrio = participantes.reduce((acc, p) => {
      const barrio = p.datosPersonales?.barrio?.descripcion || 'No especificado';
      acc[barrio] = (acc[barrio] || 0) + 1;
      return acc;
    }, {});

    // SIGEM
    const conSigem = participantes.filter(p => p.datosPersonales?.sigem).length;
    const sinSigem = participantes.length - conSigem;

    return {
      porGenero,
      porRangoEdad,
      porBarrio,
      sigem: { 'Con SIGEM': conSigem, 'Sin SIGEM': sinSigem },
      totalConDatos: participantes.length
    };
  }

  getBarWidth(porcentaje: number): string {
    return `${porcentaje}%`;
  }

  // Convertir objeto de estadísticas a array con porcentajes
  getEstadisticasArray(obj: any, total: number): any[] {
    if (!obj) return [];
    return Object.entries(obj).map(([label, count]: [string, any]) => ({
      label,
      count,
      porcentaje: total > 0 ? Math.round((count / total) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }

  buscarConFiltros(): void {
    // Recargar todos los datos con los filtros aplicados
    this.cargarDatos();
  }

  limpiarFiltros(): void {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.encuestadorId = null;
    this.cargarDatos();
  }

  get totalEncuestadoresFiltrados(): number {
    return this.encuestadoresFiltrados.length;
  }

  get totalRespuestasFiltradas(): number {
    return this.encuestadoresFiltrados.reduce((total, p) => total + p.respuestas.length, 0);
  }

  exportarDatos(): void {
    this.alertService.loading();
    this.encuestasService.obtenerResumen(this.idEncuesta).subscribe({
      next: (data) => {
        // Crear JSON con todos los datos
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        // Descargar archivo
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte-encuesta-${this.idEncuesta}-${new Date().getTime()}.json`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.alertService.close();
      },
      error: ({ error }) => {
        this.alertService.errorApi(error.message);
      }
    });
  }

  // Actualizar todas las gráficas
  actualizarGraficas(): void {
    if (!this.estadisticasDemograficas || this.estadisticasDemograficas.totalConDatos === 0) {
      return;
    }

    this.crearGraficaGenero();
    this.crearGraficaEdad();
    this.crearGraficaBarrios();
    this.crearGraficaSigem();
  }

  // Gráfica de Género (Pie)
  crearGraficaGenero(): void {
    if (!this.chartGeneroRef) return;

    // Destruir gráfica anterior si existe
    if (this.chartGenero) {
      this.chartGenero.destroy();
    }

    const datos = this.getEstadisticasArray(
      this.estadisticasDemograficas.porGenero,
      this.estadisticasDemograficas.totalConDatos
    );

    const total = this.estadisticasDemograficas.totalConDatos;

    const config: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: {
        labels: datos.map(d => d.label),
        datasets: [{
          data: datos.map(d => d.count),
          backgroundColor: [
            'rgba(236, 72, 153, 0.8)',   // Pink
            'rgba(147, 51, 234, 0.8)',    // Purple
            'rgba(59, 130, 246, 0.8)',    // Blue
            'rgba(34, 197, 94, 0.8)',     // Green
          ],
          borderColor: [
            'rgb(236, 72, 153)',
            'rgb(147, 51, 234)',
            'rgb(59, 130, 246)',
            'rgb(34, 197, 94)',
          ],
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: `Total de participantes: ${total}`,
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: {
              top: 0,
              bottom: 15
            }
          },
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12,
                weight: 'bold'
              },
              generateLabels: (chart) => {
                const data = chart.data;
                if (data.labels && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const value = data.datasets[0].data[i] as number;
                    const porcentaje = Math.round((value / total) * 100);
                    return {
                      text: `${label}: ${value} (${porcentaje}%)`,
                      fillStyle: data.datasets[0].backgroundColor?.[i] as string,
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            bodyFont: {
              size: 14
            },
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const porcentaje = Math.round((value / total) * 100);
                return `${label}: ${value} personas (${porcentaje}%)`;
              }
            }
          },
          datalabels: {
            color: '#fff',
            font: {
              weight: 'bold',
              size: 14
            },
            formatter: (value, context) => {
              const porcentaje = Math.round((value / total) * 100);
              return porcentaje > 5 ? `${porcentaje}%` : ''; // Solo mostrar si es mayor a 5%
            }
          }
        }
      }
    };

    this.chartGenero = new Chart(this.chartGeneroRef.nativeElement, config);
  }

  // Gráfica de Edad (Bar Horizontal)
  crearGraficaEdad(): void {
    if (!this.chartEdadRef) return;

    if (this.chartEdad) {
      this.chartEdad.destroy();
    }

    const datos = this.getEstadisticasArray(
      this.estadisticasDemograficas.porRangoEdad,
      this.estadisticasDemograficas.totalConDatos
    );

    const total = this.estadisticasDemograficas.totalConDatos;

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: datos.map(d => d.label),
        datasets: [{
          label: 'Cantidad de personas',
          data: datos.map(d => d.count),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: `Total de participantes: ${total}`,
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: {
              top: 0,
              bottom: 15
            }
          },
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            bodyFont: {
              size: 14
            },
            callbacks: {
              label: (context) => {
                const value = context.parsed.x || 0;
                const porcentaje = Math.round((value / total) * 100);
                return `Cantidad: ${value} personas (${porcentaje}%)`;
              }
            }
          },
          datalabels: {
            anchor: 'end',
            align: 'end',
            color: '#1f2937',
            font: {
              weight: 'bold',
              size: 12
            },
            formatter: (value, context) => {
              const porcentaje = Math.round((value / total) * 100);
              return `${value} (${porcentaje}%)`;
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: {
                size: 11
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            ticks: {
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            grid: {
              display: false
            }
          }
        }
      }
    };

    this.chartEdad = new Chart(this.chartEdadRef.nativeElement, config);
  }

  // Gráfica de Barrios (Bar Horizontal Top 10)
  crearGraficaBarrios(): void {
    if (!this.chartBarriosRef) return;

    if (this.chartBarrios) {
      this.chartBarrios.destroy();
    }

    const datos = this.getEstadisticasArray(
      this.estadisticasDemograficas.porBarrio,
      this.estadisticasDemograficas.totalConDatos
    ).slice(0, 10);

    const total = this.estadisticasDemograficas.totalConDatos;
    const totalBarrios = Object.keys(this.estadisticasDemograficas.porBarrio).length;

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: datos.map(d => d.label),
        datasets: [{
          label: 'Cantidad de personas',
          data: datos.map(d => d.count),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Top 10 de ${totalBarrios} barrios (${total} participantes)`,
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: {
              top: 0,
              bottom: 15
            }
          },
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            bodyFont: {
              size: 14
            },
            callbacks: {
              label: (context) => {
                const value = context.parsed.x || 0;
                const porcentaje = Math.round((value / total) * 100);
                return `Cantidad: ${value} personas (${porcentaje}%)`;
              }
            }
          },
          datalabels: {
            anchor: 'end',
            align: 'end',
            color: '#1f2937',
            font: {
              weight: 'bold',
              size: 11
            },
            formatter: (value, context) => {
              const porcentaje = Math.round((value / total) * 100);
              return `${value} (${porcentaje}%)`;
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: {
                size: 10
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            ticks: {
              font: {
                size: 11,
                weight: 'bold'
              }
            },
            grid: {
              display: false
            }
          }
        }
      }
    };

    this.chartBarrios = new Chart(this.chartBarriosRef.nativeElement, config);
  }

  // Gráfica de SIGEM (Doughnut)
  crearGraficaSigem(): void {
    if (!this.chartSigemRef) return;

    if (this.chartSigem) {
      this.chartSigem.destroy();
    }

    const datos = this.getEstadisticasArray(
      this.estadisticasDemograficas.sigem,
      this.estadisticasDemograficas.totalConDatos
    );

    const total = this.estadisticasDemograficas.totalConDatos;

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: datos.map(d => d.label),
        datasets: [{
          data: datos.map(d => d.count),
          backgroundColor: [
            'rgba(249, 115, 22, 0.8)',    // Orange
            'rgba(156, 163, 175, 0.8)',   // Gray
          ],
          borderColor: [
            'rgb(249, 115, 22)',
            'rgb(156, 163, 175)',
          ],
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: `Total de participantes: ${total}`,
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: {
              top: 0,
              bottom: 15
            }
          },
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12,
                weight: 'bold'
              },
              generateLabels: (chart) => {
                const data = chart.data;
                if (data.labels && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const value = data.datasets[0].data[i] as number;
                    const porcentaje = Math.round((value / total) * 100);
                    return {
                      text: `${label}: ${value} (${porcentaje}%)`,
                      fillStyle: data.datasets[0].backgroundColor?.[i] as string,
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            bodyFont: {
              size: 14
            },
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const porcentaje = Math.round((value / total) * 100);
                return `${label}: ${value} personas (${porcentaje}%)`;
              }
            }
          },
          datalabels: {
            color: '#fff',
            font: {
              weight: 'bold',
              size: 16
            },
            formatter: (value, context) => {
              const porcentaje = Math.round((value / total) * 100);
              return `${value}\n${porcentaje}%`;
            }
          }
        }
      }
    };

    this.chartSigem = new Chart(this.chartSigemRef.nativeElement, config);
  }

}
