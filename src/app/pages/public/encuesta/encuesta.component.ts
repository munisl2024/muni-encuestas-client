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
  public respuestasSeleccionadas: Map<number, Set<number>> = new Map();
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
          // Filtrar solo respuestas activas Y que tengan ID válido
          pregunta.Respuestas = pregunta.Respuestas.filter((r: any) => {
            const tieneId = r.id !== undefined && r.id !== null && !isNaN(r.id);
            if (!tieneId) {
              console.error('Respuesta sin ID válido detectada:', r, 'en pregunta:', pregunta.id);
            }
            return !!r.activo && tieneId;
          });
          // Ordenar respuestas por el campo orden
          pregunta.Respuestas.sort((a: any, b: any) => a.orden - b.orden);
        }
      });
    }
  }

  seleccionarRespuesta(preguntaId: number, respuestaId: number, multiplesRespuestas: boolean): void {
    // Validar que preguntaId y respuestaId sean válidos
    if (!preguntaId || !respuestaId || isNaN(preguntaId) || isNaN(respuestaId)) {
      console.error('IDs inválidos:', { preguntaId, respuestaId });
      return;
    }

    if (multiplesRespuestas) {
      // Para preguntas con múltiples respuestas, usar checkbox
      if (!this.respuestasSeleccionadas.has(preguntaId)) {
        this.respuestasSeleccionadas.set(preguntaId, new Set());
      }
      const respuestas = this.respuestasSeleccionadas.get(preguntaId)!;

      if (respuestas.has(respuestaId)) {
        respuestas.delete(respuestaId);
        // Si el Set queda vacío, eliminar la entrada del Map
        if (respuestas.size === 0) {
          this.respuestasSeleccionadas.delete(preguntaId);
        }
      } else {
        respuestas.add(respuestaId);
      }
    } else {
      // Para preguntas de respuesta única, usar radio
      this.respuestasSeleccionadas.set(preguntaId, new Set([respuestaId]));
    }
  }

  verificarRespuestaSeleccionada(preguntaId: number, respuestaId: number): boolean {
    const respuestas = this.respuestasSeleccionadas.get(preguntaId);
    return respuestas ? respuestas.has(respuestaId) : false;
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

    // Convertir el Map<number, Set<number>> a un array de objetos {preguntaId, respuestaIds[]}
    // Filtrar valores undefined, null o inválidos
    const respuestas = Array.from(this.respuestasSeleccionadas.entries()).map(([preguntaId, respuestaIds]) => ({
      preguntaId,
      respuestaIds: Array.from(respuestaIds).filter(id => id !== undefined && id !== null && !isNaN(id))
    }));

    // Validación adicional: verificar que todas las preguntas tienen al menos una respuesta
    const respuestasInvalidas = respuestas.filter(r => r.respuestaIds.length === 0);
    if (respuestasInvalidas.length > 0) {
      this.enviando = false;
      this.alertService.close();
      this.alertService.errorApi('Error al procesar las respuestas. Por favor intenta nuevamente.');
      console.error('Respuestas sin IDs válidos:', respuestasInvalidas);
      return;
    }

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
    const pregunta: any = this.encuesta?.Preguntas?.find(p => p.id === preguntaId);
    const isMultiple = pregunta?.multiplesRespuestas;

    let border = 'border-gray-200';
    if (answered) {
      border = isMultiple ? 'border-purple-400/50 shadow-purple-500/30' : 'border-emerald-400/50 shadow-emerald-500/30';
    }

    return `relative backdrop-blur-md rounded-xl sm:rounded-2xl border-2 p-4 sm:p-5 md:p-6 transition-all duration-500 shadow-xl bg-white/90 ${border}`;
  }

  getBadgeClasses(preguntaId: number): string {
    const answered = this.respuestasSeleccionadas.has(preguntaId);
    const pregunta: any = this.encuesta?.Preguntas?.find(p => p.id === preguntaId);
    const isMultiple = pregunta?.multiplesRespuestas;

    let bg = 'bg-gray-300';
    if (answered) {
      bg = isMultiple ? 'bg-gradient-to-br from-purple-500 to-purple-700 scale-110' : 'bg-gradient-to-br from-emerald-500 to-teal-600 scale-110';
    }

    return `w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold shadow-lg transition-all duration-300 ${bg}`;
  }

  getAnswerClasses(preguntaId: number, respuestaId: number): string {
    const selected = this.verificarRespuestaSeleccionada(preguntaId, respuestaId);
    // Verificar si la pregunta permite múltiples respuestas
    const pregunta: any = this.encuesta?.Preguntas?.find(p => p.id === preguntaId);
    const isMultiple = pregunta?.multiplesRespuestas;

    if (selected) {
      if (isMultiple) {
        // Estilo púrpura para múltiples respuestas
        return 'flex items-center p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 active:scale-95 sm:hover:scale-105 border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/30';
      } else {
        // Estilo verde para respuesta única
        return 'flex items-center p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 active:scale-95 sm:hover:scale-105 border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/30';
      }
    }
    return 'flex items-center p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 active:scale-95 sm:hover:scale-105 border-gray-300 bg-gray-50 hover:bg-gray-100';
  }

  getAnswerTextClasses(preguntaId: number, respuestaId: number): string {
    const selected = this.verificarRespuestaSeleccionada(preguntaId, respuestaId);
    const textColor = selected ? 'text-slate-800 font-semibold' : 'text-slate-600';
    return `ml-2 sm:ml-3 flex-1 transition-colors duration-500 text-sm sm:text-base ${textColor}`;
  }

  getSubmitButtonClasses(): string {
    const canSubmit = this.formularioCompleto() && !this.enviando;
    if (canSubmit) {
      return 'w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 border-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/50 active:scale-95 sm:hover:shadow-xl sm:hover:scale-105 border-emerald-400';
    }
    return 'w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 border-2 cursor-not-allowed bg-gray-200 text-gray-400 border-gray-300';
  }

  volver(): void {
    this.location.back();
  }
  
}
