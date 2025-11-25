import { Component } from '@angular/core';
import { EncuestasService } from '../../../services/encuestas.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../services/alert.service';
import AbmEncuestasComponent from '../abmEncuestas/abmEncuestas.component';
import { ToastrService } from 'ngx-toastr';
import { PreguntasService } from '../../../services/preguntas.service';
import AbmPreguntasComponent from '../../preguntas/abmPreguntas/abmPreguntas.component';
import { EncuestasActivacionService } from '../../../services/encuestas-activacion.service';
import { EncuestaActivacion } from '../../../interfaces/EncuestasActivacion.interface';
import { UsuariosService } from '../../../services/usuarios.service';
import { AuthService } from '../../../services/auth.service';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-detalles-encuestas',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    AbmEncuestasComponent,
    AbmPreguntasComponent,
    DragDropModule,
  ],
  templateUrl: './detallesEncuestas.component.html',
  styleUrls: ['./detallesEncuestas.component.css']
})
export default class DetallesEncuestasComponent {

  public idEncuesta: string;
  public encuesta: any;

  // Filtro de preguntas
  public filtroActivo: string = 'all'; // 'true', 'false', 'all'

  // Programaciones
  public programaciones: EncuestaActivacion[] = [];
  public mostrarFormProgramacion: boolean = false;
  public programacionForm = {
    fechaInicio: '',
    fechaFin: ''
  };
  public editandoProgramacion: EncuestaActivacion | null = null;

  // Usuarios asignados
  public usuariosAsignados: any[] = [];
  public usuariosDisponibles: any[] = [];
  public mostrarFormAsignacion: boolean = false;
  public usuarioSeleccionado: number | null = null;

  constructor(
    public authService: AuthService,
    private activatedRoute: ActivatedRoute,
    public encuestasService: EncuestasService,
    public preguntasService: PreguntasService,
    private encuestasActivacionService: EncuestasActivacionService,
    private usuariosService: UsuariosService,
    private alertService: AlertService,
    private toastr: ToastrService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.alertService.loading();
    this.activatedRoute.params.subscribe({
      next: ({ id }) => {
        this.idEncuesta = id;
        this.obtenerEncuesta();
      },
      error: ({ error }) => {
        this.alertService.errorApi(error.message);
      }
    });
  }

  get preguntasFiltradas(): any[] {
    if (!this.encuesta?.Preguntas) return [];

    if (this.filtroActivo === 'all') {
      return this.encuesta.Preguntas;
    } else if (this.filtroActivo === 'true') {
      return this.encuesta.Preguntas.filter((p: any) => !!p.activo);
    } else {
      return this.encuesta.Preguntas.filter((p: any) => !p.activo);
    }
  }

  get cantidadPreguntasActivas(): number {
    if (!this.encuesta?.Preguntas) return 0;
    return this.encuesta.Preguntas.filter((p: any) => !!p.activo).length;
  }

  get cantidadPreguntasInactivas(): number {
    if (!this.encuesta?.Preguntas) return 0;
    return this.encuesta.Preguntas.filter((p: any) => !p.activo).length;
  }

  obtenerEncuesta(): void {
    this.encuestasService.obtenerEncuesta(this.idEncuesta).subscribe({
      next: ({ encuesta }) => {
        this.encuesta = encuesta;
        this.ordenarPreguntas();
        console.log(this.encuesta);
        this.cargarProgramaciones();
        this.cargarUsuariosAsignados();
        this.alertService.close();
      }, error: ({ error }) => {
        this.alertService.errorApi(error.message);
      }
    });
  }

  ordenarPreguntas(): void {
    if (this.encuesta && this.encuesta.Preguntas) {
      this.encuesta.Preguntas.sort((a: any, b: any) => a.orden - b.orden);
      // También ordenar las respuestas de cada pregunta
      this.encuesta.Preguntas.forEach((pregunta: any) => {
        if (pregunta.Respuestas) {
          pregunta.Respuestas.sort((a: any, b: any) => a.orden - b.orden);
        }
      });
    }
  }

  // PROGRAMACIONES

  cargarProgramaciones(): void {
    this.encuestasActivacionService.obtenerPorEncuesta(this.idEncuesta).subscribe({
      next: ({ programaciones }) => {
        this.programaciones = programaciones;
      }, error: ({ error }) => {
        this.alertService.errorApi(error.message);
      }
    });
  }

  abrirFormProgramacion(): void {
    this.mostrarFormProgramacion = true;
    this.programacionForm = { fechaInicio: '', fechaFin: '' };
    this.editandoProgramacion = null;
  }

  cerrarFormProgramacion(): void {
    this.mostrarFormProgramacion = false;
    this.programacionForm = { fechaInicio: '', fechaFin: '' };
    this.editandoProgramacion = null;
  }

  guardarProgramacion(): void {
    if (!this.programacionForm.fechaInicio || !this.programacionForm.fechaFin) {
      this.toastr.error('Completa todos los campos', 'Error');
      return;
    }

    const data = {
      encuestaId: Number(this.idEncuesta),
      fechaInicio: new Date(this.programacionForm.fechaInicio).toISOString(),
      fechaFin: new Date(this.programacionForm.fechaFin).toISOString(),
      creatorUserId: this.encuesta.creatorUserId
    };

    if (this.editandoProgramacion) {
      // Actualizar
      this.encuestasActivacionService.actualizarProgramacion(this.editandoProgramacion.id.toString(), data).subscribe({
        next: () => {
          this.toastr.success('Programación actualizada', 'Éxito');
          this.cargarProgramaciones();
          this.cerrarFormProgramacion();
        }, error: ({ error }) => {
          this.alertService.errorApi(error.message);
        }
      });
    } else {
      // Crear
      this.encuestasActivacionService.nuevaProgramacion(data).subscribe({
        next: () => {
          this.toastr.success('Programación creada', 'Éxito');
          this.cargarProgramaciones();
          this.cerrarFormProgramacion();
        }, error: ({ error }) => {
          this.alertService.errorApi(error.message);
        }
      });
    }
  }

  editarProgramacion(programacion: EncuestaActivacion): void {
    this.editandoProgramacion = programacion;
    this.programacionForm = {
      fechaInicio: new Date(programacion.fechaInicio).toISOString().slice(0, 16),
      fechaFin: new Date(programacion.fechaFin).toISOString().slice(0, 16)
    };
    this.mostrarFormProgramacion = true;
  }

  eliminarProgramacion(programacion: EncuestaActivacion): void {
    this.alertService.question({ msg: 'Eliminando programación', buttonText: 'Aceptar' }).then(({ isConfirmed }) => {
      if (isConfirmed) {
        this.alertService.loading();
        this.encuestasActivacionService.eliminarProgramacion(programacion.id.toString()).subscribe({
          next: () => {
            this.toastr.success('Programación eliminada', 'Éxito');
            this.cargarProgramaciones();
            this.alertService.close();
          }, error: ({ error }) => {
            this.alertService.errorApi(error.message);
          }
        });
      }
    });
  }

  activarDesactivarEncuesta(): void {
    this.alertService.question({ msg: `${this.encuesta.estado === 'Activa' ? 'Desactivando' : 'Activando'} la encuesta`, buttonText: 'Aceptar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          let nuevoEstado = this.encuesta.estado === 'Activa' ? 'Inactiva' : 'Activa';
          this.encuestasService.actualizarEncuesta(this.idEncuesta, { estado: nuevoEstado }).subscribe({
            next: () => {
              this.alertService.close();
              this.encuesta.estado = nuevoEstado;
              this.toastr.success('Actualizada correctamente', 'Encuesta');
            }, error: ({ error }) => this.alertService.errorApi(error.message)
          });
        }
      });
  }

  actualizarEncuesta(encuesta: any): void {
    this.encuesta = encuesta;
    this.ordenarPreguntas();
  }

  // PREGUNTAS

  agregarPregunta(pregunta: any): void {
    this.encuesta.Preguntas.push(pregunta);
    this.ordenarPreguntas();
  }

  actualizarPregunta(pregunta: any): void {
    this.encuesta.Preguntas = this.encuesta.Preguntas.map(p => p.id === pregunta.id ? pregunta : p);
    this.ordenarPreguntas();
    console.log(this.encuesta);
  }

  eliminarPregunta(pregunta: any): void {
    const accion = pregunta.activo ? 'Dando de baja pregunta' : 'Pregunta ya está inactiva';
    this.alertService.question({ msg: accion, buttonText: 'Aceptar' }).then(({ isConfirmed }) => {
      if (isConfirmed && pregunta.activo) {
        this.alertService.loading();
        this.preguntasService.eliminarPregunta(pregunta.id).subscribe({
          next: () => {
            this.toastr.success('Dada de baja correctamente', 'Pregunta');
            this.obtenerEncuesta();
          }, error: ({ error }) => this.alertService.errorApi(error.message)
        });
      }
    });
  }

  activarPregunta(pregunta: any): void {
    this.alertService.question({ msg: 'Activando pregunta', buttonText: 'Aceptar' }).then(({ isConfirmed }) => {
      if (isConfirmed) {
        this.alertService.loading();
        this.preguntasService.activarPregunta(pregunta.id).subscribe({
          next: () => {
            this.toastr.success('Activada correctamente', 'Pregunta');
            this.obtenerEncuesta();
          }, error: ({ error }) => this.alertService.errorApi(error.message)
        });
      }
    });
  }

  cambiarEstadoRespuesta(respuesta: any, activo: boolean): void {
    const accion = activo ? 'Activando' : 'Desactivando';
    this.alertService.question({ msg: `${accion} respuesta`, buttonText: 'Aceptar' }).then(({ isConfirmed }) => {
      if (isConfirmed) {
        this.alertService.loading();
        const observable = activo
          ? this.preguntasService.activarRespuesta(respuesta.id)
          : this.preguntasService.desactivarRespuesta(respuesta.id);

        observable.subscribe({
          next: () => {
            this.toastr.success(`${accion} correctamente`, 'Respuesta');
            this.obtenerEncuesta();
          }, error: ({ error }) => this.alertService.errorApi(error.message)
        });
      }
    });
  }

  eliminarEncuesta(): void {
    this.alertService.question({ msg: 'Eliminando encuesta', buttonText: 'Aceptar' }).then(({ isConfirmed }) => {
      if (isConfirmed) {
        this.alertService.loading();
        this.encuestasService.eliminarEncuesta(this.idEncuesta).subscribe({
          next: () => {
            this.toastr.success('Eliminada correctamente', 'Encuesta');
            this.alertService.close();
            this.router.navigate(['/dashboard/encuestas']);
          }, error: ({ error }) => this.alertService.errorApi(error.message)
        });
      }
    });
  }

  reordenarPregunta(pregunta: any, direccion: 'arriba' | 'abajo'): void {
    this.alertService.loading();
    this.preguntasService.reordenarPregunta(pregunta.id, direccion).subscribe({
      next: () => {
        this.obtenerEncuesta();
        this.toastr.success('Orden actualizado', 'Pregunta');
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    });
  }

  reordenarRespuesta(respuesta: any, direccion: 'arriba' | 'abajo'): void {
    this.alertService.loading();
    this.preguntasService.reordenarRespuesta(respuesta.id, direccion).subscribe({
      next: () => {
        this.obtenerEncuesta();
        this.toastr.success('Orden actualizado', 'Respuesta');
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    });
  }

  // USUARIOS ASIGNADOS

  cargarUsuariosAsignados(): void {
    this.encuestasService.obtenerUsuariosAsignados(this.idEncuesta).subscribe({
      next: ({ usuarios }) => {
        this.usuariosAsignados = usuarios;
      }, error: ({ error }) => {
        this.alertService.errorApi(error.message);
      }
    });
  }

  cargarUsuariosDisponibles(): void {
    this.usuariosService.listarUsuarios(1, 'apellido').subscribe({
      next: ({ usuarios }) => {
        // Filtrar usuarios que ya están asignados
        const idsAsignados = this.usuariosAsignados.map(u => u.usuario.id);
        this.usuariosDisponibles = usuarios.filter((u: any) => !idsAsignados.includes(u.id) && u.activo);
      }, error: ({ error }) => {
        this.alertService.errorApi(error.message);
      }
    });
  }

  abrirFormAsignacion(): void {
    this.cargarUsuariosDisponibles();
    this.mostrarFormAsignacion = true;
    this.usuarioSeleccionado = null;
  }

  cerrarFormAsignacion(): void {
    this.mostrarFormAsignacion = false;
    this.usuarioSeleccionado = null;
  }

  asignarUsuario(): void {
    if (!this.usuarioSeleccionado) {
      this.toastr.error('Selecciona un usuario', 'Error');
      return;
    }

    this.alertService.loading();
    this.encuestasService.asignarUsuario(this.idEncuesta, this.usuarioSeleccionado).subscribe({
      next: () => {
        this.toastr.success('Usuario asignado correctamente', 'Éxito');
        this.cargarUsuariosAsignados();
        this.cerrarFormAsignacion();
        this.alertService.close();
      }, error: ({ error }) => {
        this.alertService.errorApi(error.message);
      }
    });
  }

  removerUsuario(usuario: any): void {
    this.alertService.question({
      msg: `¿Remover a ${usuario.usuario.apellido}, ${usuario.usuario.nombre} de esta encuesta?`,
      buttonText: 'Aceptar'
    }).then(({ isConfirmed }) => {
      if (isConfirmed) {
        this.alertService.loading();
        this.encuestasService.removerUsuario(this.idEncuesta, usuario.usuario.id).subscribe({
          next: () => {
            this.toastr.success('Usuario removido correctamente', 'Éxito');
            this.cargarUsuariosAsignados();
            this.alertService.close();
          }, error: ({ error }) => {
            this.alertService.errorApi(error.message);
          }
        });
      }
    });
  }

  // DRAG & DROP

  dropPregunta(event: CdkDragDrop<any[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const preguntaMovida = this.preguntasFiltradas[event.previousIndex];
    const preguntaDestino = this.preguntasFiltradas[event.currentIndex];

    const ordenOrigen = preguntaMovida.orden;
    const ordenDestino = preguntaDestino.orden;
    const direccion = ordenDestino < ordenOrigen ? 'arriba' : 'abajo';
    const steps = Math.abs(ordenDestino - ordenOrigen);

    console.log('Moviendo pregunta:', {
      pregunta: preguntaMovida.descripcion,
      ordenOrigen,
      ordenDestino,
      direccion,
      steps,
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex
    });

    this.alertService.loading();
    this.ejecutarReordenamientoPreguntas(preguntaMovida.id, direccion, steps, 0);
  }

  private ejecutarReordenamientoPreguntas(preguntaId: number, direccion: 'arriba' | 'abajo', stepsTotal: number, stepActual: number): void {
    if (stepActual >= stepsTotal) {
      // Terminamos, recargar encuesta
      this.obtenerEncuesta();
      this.toastr.success('Orden actualizado', 'Pregunta');
      return;
    }

    this.preguntasService.reordenarPregunta(preguntaId, direccion).subscribe({
      next: () => {
        // Continuar con el siguiente paso
        this.ejecutarReordenamientoPreguntas(preguntaId, direccion, stepsTotal, stepActual + 1);
      },
      error: ({ error }) => {
        this.alertService.errorApi(error.message);
      }
    });
  }

  dropRespuesta(event: CdkDragDrop<any[]>, pregunta: any): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const respuestaMovida = pregunta.Respuestas[event.previousIndex];
    const respuestaDestino = pregunta.Respuestas[event.currentIndex];

    const ordenOrigen = respuestaMovida.orden;
    const ordenDestino = respuestaDestino.orden;
    const direccion = ordenDestino < ordenOrigen ? 'arriba' : 'abajo';
    const steps = Math.abs(ordenDestino - ordenOrigen);

    console.log('Moviendo respuesta:', {
      respuesta: respuestaMovida.descripcion,
      ordenOrigen,
      ordenDestino,
      direccion,
      steps,
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex
    });

    this.alertService.loading();
    this.ejecutarReordenamientoRespuestas(respuestaMovida.id, direccion, steps, 0);
  }

  private ejecutarReordenamientoRespuestas(respuestaId: number, direccion: 'arriba' | 'abajo', stepsTotal: number, stepActual: number): void {
    if (stepActual >= stepsTotal) {
      // Terminamos, recargar encuesta
      this.obtenerEncuesta();
      this.toastr.success('Orden actualizado', 'Respuesta');
      return;
    }

    this.preguntasService.reordenarRespuesta(respuestaId, direccion).subscribe({
      next: () => {
        // Continuar con el siguiente paso
        this.ejecutarReordenamientoRespuestas(respuestaId, direccion, stepsTotal, stepActual + 1);
      },
      error: ({ error }) => {
        this.alertService.errorApi(error.message);
      }
    });
  }

}
