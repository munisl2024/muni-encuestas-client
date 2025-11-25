import { Component, EventEmitter, Output } from '@angular/core';
import { AlertService } from '../../../services/alert.service';
import { EncuestasService } from '../../../services/encuestas.service';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../components/modal/modal.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-abm-encuestas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent
  ],
  templateUrl: './abmEncuestas.component.html',
})
export default class AbmEncuestasComponent {

  @Output()
  public insertEvent = new EventEmitter<any>();

  @Output()
  public updateEvent = new EventEmitter<any>();

  constructor(
    private authService: AuthService,
    private alertService: AlertService,
    public encuestasService: EncuestasService,
    public toastr: ToastrService
  ){}

  ngOnInit(): void {}

  nuevaEncuesta(): void {

    // Verificacion - Errores - Formulario
    const errorMsj = this.verificacionFormulario();
    if(errorMsj.trim() !== '' ){
      this.alertService.info(errorMsj);
      return;
    }

    this.alertService.question({ msg: 'Creando nueva encuesta', buttonText: 'Aceptar' })
        .then( ({ isConfirmed }) => {
          if(isConfirmed){

            this.alertService.loading();

            const dataCreacion = {
              ...this.encuestasService.abmEncuesta.form,
              creatorUserId: this.authService.usuario.userId,
            }

            this.encuestasService.nuevaEncuesta(dataCreacion).subscribe({
              next: ({ encuesta }) => {
                this.insertEvent.emit(encuesta);
                this.reinicioFormulario();
                this.encuestasService.abmEncuesta.show = false;
                this.toastr.success('Creada correctamente', 'Encuesta');
                this.alertService.close();
              }, error: ({ error }) => this.alertService.errorApi(error.message)
            })

          }
        })

  }

  actualizarEncuesta(): void {

    // Verificacion - Errores - Formulario
    const errorMsj = this.verificacionFormulario();
    if(errorMsj.trim() !== ''){
      this.alertService.info(errorMsj);
      return;
    }

    this.alertService.question({ msg: 'Actualizando encuesta', buttonText: 'Aceptar' })
        .then( ({ isConfirmed }) => {
          if(isConfirmed){
            this.alertService.loading();
            const dataActualizacion = this.encuestasService.abmEncuesta.form;
            this.encuestasService.actualizarEncuesta(this.encuestasService.abmEncuesta.encuestaSeleccionada.id, dataActualizacion).subscribe({
              next: ({ encuesta }) => {
                this.updateEvent.emit(encuesta);
                this.reinicioFormulario();
                this.encuestasService.abmEncuesta.show = false;
                this.toastr.success('Actualizada correctamente', 'Encuesta');
                this.alertService.close();
              }, error: ({ error }) => this.alertService.errorApi(error.message)
            })

          }
        })

  }

  verificacionFormulario(): string {

    const { titulo } = this.encuestasService.abmEncuesta.form;

    // Verificacion
    if(titulo.trim() === '') return 'El titulo es requerido';

    return ''; // No hay errores en la validacion

  }

  submit(): void {
    if(this.encuestasService.abmEncuesta.estado == 'crear'){
      this.nuevaEncuesta();
    } else {
      this.actualizarEncuesta();
    }
  }

  reinicioFormulario(): void {
    this.encuestasService.abmEncuesta.form = {
      titulo: '',
      descripcion: '',
    }
  }


}
