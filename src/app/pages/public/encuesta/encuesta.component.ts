import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EncuestasService } from '../../../services/encuestas.service';
import { AlertService } from '../../../services/alert.service';
import { AuthService } from '../../../services/auth.service';
import { BarriosService } from '../../../services/barrios.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { Encuesta } from '../../../interfaces/Encuestas.interface';

@Component({
  selector: 'app-encuesta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './encuesta.component.html',
  styles: [`
    /* Scrollbar personalizado para dropdown de barrios */
    .barrios-dropdown::-webkit-scrollbar {
      width: 8px;
    }
    .barrios-dropdown::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 10px;
    }
    .barrios-dropdown::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 10px;
    }
    .barrios-dropdown::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `]
})
export default class EncuestaComponent {

  public encuesta: Encuesta;
  public respuestasSeleccionadas: Map<number, number> = new Map();
  public enviando: boolean = false;
  public encuestaCompletada: boolean = false;
  public cargandoEncuesta: boolean = true;

  // Datos personales del encuestado
  public datosPersonales = {
    email: '',
    sigem: false,
    genero: 'Masculino',
    telefono: '',
    rangoEdad: '18-25',
    barrioId: null as number | null
  };

  // Lista de barrios
  public barrios: any[] = [];
  public barriosFiltrados: any[] = [];
  public cargandoBarrios: boolean = false;
  public busquedaBarrio: string = '';
  public showDropdownBarrios: boolean = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private encuestasService: EncuestasService,
    public authService: AuthService,
    private location: Location,
    private alertService: AlertService,
    private router: Router,
    private barriosService: BarriosService
  ) {}

  ngOnInit(): void {
    this.alertService.loading();

    // Validar token y cargar usuario antes de cargar la encuesta
    this.authService.validarToken().subscribe({
      next: (isValid) => {
        if (isValid) {
          this.cargarEncuesta();
          this.cargarBarrios();
          // Inicializar el campo de búsqueda si hay un barrio seleccionado
          if (this.datosPersonales.barrioId) {
            this.busquedaBarrio = this.getNombreBarrioSeleccionado();
          }
        } else {
          this.router.navigate(['/login']);
        }
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  cargarEncuesta(): void {
    this.activatedRoute.params.subscribe({
      next: ({ id }) => {
        this.encuestasService.obtenerEncuesta(id).subscribe({
          next: ({ encuesta }) => {
            this.encuesta = encuesta;
            this.ordenarPreguntasYRespuestas();
            this.cargandoEncuesta = false;
            this.alertService.close();
          }, error: ({ error }) => {
            this.cargandoEncuesta = false;
            this.alertService.errorApi(error.message);
          }
        })
      }
    });
  }

  ordenarPreguntasYRespuestas(): void {
    if (this.encuesta && this.encuesta.Preguntas) {
      // Filtrar solo preguntas activas
      this.encuesta.Preguntas = this.encuesta.Preguntas.filter((p: any) => !!p.activo);

      // Ordenar preguntas por el campo orden
      this.encuesta.Preguntas.sort((a: any, b: any) => a.orden - b.orden);

      // Filtrar solo respuestas activas y ordenarlas
      this.encuesta.Preguntas.forEach((pregunta: any) => {
        if (pregunta.Respuestas) {
          // Filtrar solo respuestas activas
          pregunta.Respuestas = pregunta.Respuestas.filter((r: any) => !!r.activo);
          // Ordenar respuestas por el campo orden
          pregunta.Respuestas.sort((a: any, b: any) => a.orden - b.orden);
        }
      });
    }
  }

  seleccionarRespuesta(preguntaId: number, respuestaId: number): void {
    this.respuestasSeleccionadas.set(preguntaId, respuestaId);
  }

  verificarRespuestaSeleccionada(preguntaId: number, respuestaId: number): boolean {
    return this.respuestasSeleccionadas.get(preguntaId) === respuestaId;
  }

  todasLasPreguntasRespondidas(): boolean {
    if (!this.encuesta?.Preguntas) return false;
    // this.encuesta.Preguntas ya solo contiene preguntas activas
    // después de ordenarPreguntasYRespuestas()
    return this.encuesta.Preguntas.length === this.respuestasSeleccionadas.size;
  }

  datosPersonalesCompletos(): boolean {
    const tieneContacto = this.datosPersonales.email.trim() !== '' ||
                          this.datosPersonales.telefono.trim() !== '';
    const tieneBarrio = this.datosPersonales.barrioId !== null;
    return tieneContacto && tieneBarrio;
  }

  formularioCompleto(): boolean {
    return this.datosPersonalesCompletos() && this.todasLasPreguntasRespondidas();
  }

  enviarRespuestas(): void {
    if (!this.datosPersonalesCompletos()) {
      if (!this.datosPersonales.barrioId) {
        this.alertService.errorApi('Por favor selecciona un barrio');
      } else {
        this.alertService.errorApi('Por favor completa al menos un email o un teléfono');
      }
      return;
    }

    if (!this.todasLasPreguntasRespondidas()) {
      this.alertService.errorApi('Por favor responde todas las preguntas');
      return;
    }

    // Verificar que el usuario esté autenticado
    const userId = this.authService.usuario?.userId;
    if (!userId) {
      this.alertService.errorApi('Usuario no autenticado');
      this.router.navigate(['/login']);
      return;
    }

    this.enviando = true;
    this.alertService.loading();

    // Convertir el Map a un array de objetos {preguntaId, respuestaId}
    const respuestas = Array.from(this.respuestasSeleccionadas.entries()).map(([preguntaId, respuestaId]) => ({
      preguntaId,
      respuestaId
    }));

    // Enviar todas las respuestas en una sola petición incluyendo datos personales
    this.encuestasService.responderEncuesta(
      String(this.encuesta.id),
      userId,
      respuestas,
      this.datosPersonales
    ).subscribe({
      next: () => {
        this.enviando = false;
        this.encuestaCompletada = true;
        this.alertService.close();
        this.alertService.success('Encuesta respondida correctamente');
      },
      error: ({ error }) => {
        this.enviando = false;
        this.alertService.errorApi(error.message);
      }
    });
  }

  reiniciarEncuesta(): void {
    this.respuestasSeleccionadas.clear();
    this.encuestaCompletada = false;
    // Limpiar datos personales
    this.datosPersonales = {
      email: '',
      sigem: false,
      genero: 'Masculino',
      telefono: '',
      rangoEdad: '18-25',
      barrioId: null
    };
    // Limpiar búsqueda de barrio
    this.busquedaBarrio = '';
    this.barriosFiltrados = this.barrios;
    this.showDropdownBarrios = false;
    // Scroll hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Cargar lista de barrios activos
   */
  cargarBarrios(): void {
    this.cargandoBarrios = true;
    this.barriosService.listarBarrios({
      direccion: 'asc',
      columna: 'descripcion',
      parametro: '',
      pagina: 1,
      itemsPorPagina: 1000,
      activo: 'true'
    }).subscribe({
      next: ({ barrios }) => {
        this.barrios = barrios;
        this.barriosFiltrados = barrios;
        this.cargandoBarrios = false;
      },
      error: (error) => {
        console.error('Error al cargar barrios:', error);
        this.cargandoBarrios = false;
        this.alertService.errorApi('Error al cargar la lista de barrios');
      }
    });
  }

  /**
   * Filtrar barrios por búsqueda
   */
  filtrarBarrios(): void {
    const busqueda = this.busquedaBarrio.toLowerCase().trim();
    if (!busqueda) {
      this.barriosFiltrados = this.barrios;
    } else {
      this.barriosFiltrados = this.barrios.filter(barrio =>
        barrio.descripcion.toLowerCase().includes(busqueda)
      );
    }
  }

  /**
   * Seleccionar un barrio
   */
  seleccionarBarrio(barrio: any): void {
    this.datosPersonales.barrioId = barrio.id;
    this.busquedaBarrio = barrio.descripcion;
    this.showDropdownBarrios = false;
  }

  /**
   * Obtener el nombre del barrio seleccionado
   */
  getNombreBarrioSeleccionado(): string {
    if (!this.datosPersonales.barrioId) return '';
    const barrio = this.barrios.find(b => b.id === this.datosPersonales.barrioId);
    return barrio ? barrio.descripcion : '';
  }

  /**
   * Abrir dropdown de barrios
   */
  abrirDropdownBarrios(): void {
    this.showDropdownBarrios = true;
    this.busquedaBarrio = '';
    this.barriosFiltrados = this.barrios;
  }

  /**
   * Cerrar dropdown de barrios
   */
  cerrarDropdownBarrios(): void {
    setTimeout(() => {
      this.showDropdownBarrios = false;
      if (this.datosPersonales.barrioId) {
        this.busquedaBarrio = this.getNombreBarrioSeleccionado();
      } else {
        this.busquedaBarrio = '';
      }
    }, 200);
  }

  getCardClasses(preguntaId: number): string {
    const answered = this.respuestasSeleccionadas.has(preguntaId);
    const border = answered ? 'border-emerald-400/50 shadow-emerald-500/30' : 'border-gray-200';
    return `relative backdrop-blur-md rounded-2xl border-2 p-6 transition-all duration-500 shadow-xl bg-white/90 ${border}`;
  }

  getBadgeClasses(preguntaId: number): string {
    const answered = this.respuestasSeleccionadas.has(preguntaId);
    const bg = answered ? 'bg-gradient-to-br from-emerald-500 to-teal-600 scale-110' : 'bg-gray-300';
    return `w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shadow-lg transition-all duration-300 ${bg}`;
  }

  getAnswerClasses(preguntaId: number, respuestaId: number): string {
    const selected = this.verificarRespuestaSeleccionada(preguntaId, respuestaId);
    if (selected) {
      return 'flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/30';
    }
    return 'flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 border-gray-300 bg-gray-50 hover:bg-gray-100';
  }

  getAnswerTextClasses(preguntaId: number, respuestaId: number): string {
    const selected = this.verificarRespuestaSeleccionada(preguntaId, respuestaId);
    const textColor = selected ? 'text-slate-800 font-semibold' : 'text-slate-600';
    return `ml-3 flex-1 transition-colors duration-500 ${textColor}`;
  }

  getSubmitButtonClasses(): string {
    const canSubmit = this.formularioCompleto() && !this.enviando;
    if (canSubmit) {
      return 'w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3 border-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/50 hover:shadow-xl hover:scale-105 border-emerald-400';
    }
    return 'w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3 border-2 cursor-not-allowed bg-gray-200 text-gray-400 border-gray-300';
  }

  volver(): void {
    this.location.back();
  }
  
}
