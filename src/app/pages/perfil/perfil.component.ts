import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '../../services/usuarios.service';
import { AlertService } from '../../services/alert.service';
import gsap from 'gsap';
import { CommonModule } from '@angular/common';
import { FechaPipe } from '../../pipes/fecha.pipe';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    FechaPipe
  ],
  templateUrl: './perfil.component.html',
  styleUrls: []
})
export default class PerfilComponent implements OnInit {

  get password_actual() {
    return this.passwordForm.get('password_actual');
  }

  get password_nuevo() {
    return this.passwordForm.get('password_nuevo');
  }

  get password_nuevo_repetir() {
    return this.passwordForm.get('password_nuevo_repetir');
  }

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private alertService: AlertService
  ) { }

  public usuarioLogin: any;
  public passwordForm: FormGroup;

  ngOnInit(): void {
    gsap.from('.gsap-contenido', { y: 100, opacity: 0, duration: .2 });
    this.dataService.ubicacionActual = "Equinoccio - Perfil";
    this.getUsuario();

    // Formulario reactivo para password
    this.passwordForm = this.fb.group({
      password_actual: ['', [Validators.required, Validators.minLength(4)]],
      password_nuevo: ['', [Validators.required, Validators.minLength(4)]],
      password_nuevo_repetir: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  // Obtener datos de usuario
  getUsuario(): void {
    this.alertService.loading();
    this.usuariosService.getUsuario(this.authService.usuario.userId).subscribe({
      next: (usuario: any) => {
        this.alertService.close();
        this.usuarioLogin = usuario;
      },
      error: ({ error }) => {
        this.alertService.errorApi(error.msg);
      }
    });
  }

  // Actualizar password
  actualizarPassword(): void {

    if(this.passwordForm.valid){
      this.alertService.loading();
      this.usuariosService.actualizarPasswordPefil(this.authService.usuario.userId, this.passwordForm.value).subscribe({
        next: () => {
          this.passwordForm.reset();
          this.alertService.success('Contraseña actualizada');
        }, error: ({ error }) => {
          this.passwordForm.reset();
          this.alertService.errorApi(error.message);
        }
      })
    }else{
      this.passwordForm.markAllAsTouched();
    }

  }

}
