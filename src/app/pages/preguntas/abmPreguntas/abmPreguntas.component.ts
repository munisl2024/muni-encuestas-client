import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { ModalComponent } from '../../../components/modal/modal.component';
import { PreguntasService } from '../../../services/preguntas.service';
import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/alert.service';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-abm-preguntas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent
  ],
  templateUrl: './abmPreguntas.component.html'
})
export default class AbmPreguntasComponent {

  @Output()
  public insertEvent = new EventEmitter<any>();

  @Output()
  public updateEvent = new EventEmitter<any>();

  constructor(
    private authService: AuthService,
    private alertService: AlertService,
    private toastr: ToastrService,
    public preguntasService: PreguntasService,
  ) { }

  ngOnInit(): void { }

  crearPregunta(): void {

    // Verificacion - Errores - Formulario
    const errorMsj = this.verificacionFormulario();
    if(errorMsj.trim() !== '' ){
      this.alertService.info(errorMsj);
      return;
    }

    this.alertService.question({ msg: 'Creando pregunta', buttonText: 'Aceptar' })
    .then( ({ isConfirmed }) => {
      if(isConfirmed){
        this.alertService.loading();
        const data = {
          descripcion: this.preguntasService.abmPregunta.form.descripcion,
          encuestaId: this.preguntasService.abmPregunta.encuestaSeleccionada.id,
          respuestas: this.preguntasService.abmPregunta.form.respuestas,
          creatorUserId: this.authService.usuario.userId,
        }
        this.preguntasService.nuevaPregunta(data).subscribe({
          next: ({ pregunta }) => {
            this.insertEvent.emit(pregunta);
            this.preguntasService.abmPregunta.show = false;
            this.toastr.success('Creada correctamente', 'Pregunta');
            this.alertService.close();
          }, error: ({ error }) => this.alertService.errorApi(error.message)
        });
      }
    });

  }

  actualizarPregunta(): void {

    // Verificacion - Errores - Formulario
    const errorMsj = this.verificacionFormulario();
    if(errorMsj.trim() !== '' ){
      this.alertService.info(errorMsj);
      return;
    }

    this.alertService.question({ msg: 'Actualizando pregunta', buttonText: 'Aceptar' })
    .then( ({ isConfirmed }) => {
      if(isConfirmed){
        this.alertService.loading();
        
        const data = {
          encuestaId: this.preguntasService.abmPregunta.encuestaSeleccionada.id,
          descripcion: this.preguntasService.abmPregunta.form.descripcion,
          respuestas: this.preguntasService.abmPregunta.form.respuestas,
          creatorUserId: this.authService.usuario.userId,
        }

        this.preguntasService.actualizarPregunta(this.preguntasService.abmPregunta.preguntaSeleccionada.id, data).subscribe({
          next: ({ pregunta }) => {
            this.updateEvent.emit(pregunta);
            this.preguntasService.abmPregunta.show = false;
            this.toastr.success('Actualizada correctamente', 'Pregunta');
            this.alertService.close();
          }, error: ({ error }) => this.alertService.errorApi(error.message)
        });

      }
    }); 

  } 

  verificacionFormulario(): string {

    const { descripcion } = this.preguntasService.abmPregunta.form;

    if(descripcion.trim() === ''){
      return 'La descripción es requerida';
    }

    // Verificar que se tiene al menos 2 respuestas con descripcion
    if(this.preguntasService.abmPregunta.form.respuestas.length < 2){
      return 'Debe tener al menos 2 respuestas';
    }

    // Verificar que se tiene al menos 2 respuestas con descripcion
    if(this.preguntasService.abmPregunta.form.respuestas.some(respuesta => respuesta.descripcion.trim() === '')){
      return 'No puede tener respuestas vacias';
    }

    return '';

  }

  agregarRespuestas(): void {
    this.preguntasService.abmPregunta.form.respuestas.push({
      descripcion: '',
    });
  }

  eliminarRespuesta(index: number): void {
    this.preguntasService.abmPregunta.form.respuestas.splice(index, 1);
  }

}
