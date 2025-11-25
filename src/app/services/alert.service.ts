import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  public colorButton: string = 'secondaryColor';

  constructor() { }

  // Alerta - Pregunta
  question({ msg, buttonText }): any {
    return Swal.fire({
      title: '¿Estas seguro?',
      text: msg,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: buttonText,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: this.colorButton
    });
  }

  // Alerta - Completado
  success(msg: string = 'Acción completada!'): void {
    Swal.fire({
      icon: 'success',
      title: 'Completado',
      text: msg,
      timer: 1000,
      showConfirmButton: false
    });
  }

  // Alerta - Información
  info(msg: string): void {
    Swal.fire({
      icon: 'info',
      title: 'Información',
      text: msg,
      confirmButtonText: 'Entendido',
      confirmButtonColor: this.colorButton
    });
  }

  // Alerta - Formulario inválido
  formularioInvalido(): void {
    Swal.fire({
      icon: 'info',
      title: 'Información',
      text: 'Formulario Inválido',
      confirmButtonText: 'Entendido',
      confirmButtonColor: this.colorButton
    });
  }

  // Alerta - Error desde servidor
  errorApi(msg: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: msg,
      confirmButtonText: 'Entendido',
      confirmButtonColor: this.colorButton
    });
  }

  // Alerta - Cargando...
  loading(msg: string = 'Espere un momento'): void {
    Swal.fire({
      title: 'Cargando',
      text: msg,
      timerProgressBar: true,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      }
    });
  }

  // Alerta - Cierra cualquier alerta
  close(): void { Swal.close(); }

}
