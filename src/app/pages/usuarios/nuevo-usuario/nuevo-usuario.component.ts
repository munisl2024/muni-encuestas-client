import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsuariosService } from '../../../services/usuarios.service';
import { AlertService } from '../../../services/alert.service';
import { DataService } from '../../../services/data.service';
import gsap from 'gsap';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-nuevo-usuario',
  templateUrl: './nuevo-usuario.component.html',
  imports: [
    RouterModule,
    ReactiveFormsModule,
    CommonModule
  ],
  styleUrls: []
})
export default class NuevoUsuarioComponent implements OnInit {

  get usuario() {
    return this.usuarioForm.get('usuario');
  }

  get apellido() {
    return this.usuarioForm.get('apellido');
  }

  get nombre() {
    return this.usuarioForm.get('nombre');
  }

  get dni() {
    return this.usuarioForm.get('dni');
  }

  get email() {
    return this.usuarioForm.get('email');
  }

  get password() {
    return this.usuarioForm.get('password');
  }

  get repetir() {
    return this.usuarioForm.get('repetir');
  }

  get role() {
    return this.usuarioForm.get('role');
  }

  // Modelo reactivo
  public usuarioForm: FormGroup;

  constructor(private fb: FormBuilder,
    private router: Router,
    private usuariosService: UsuariosService,
    private alertService: AlertService,
    private dataService: DataService
  ) { }

  ngOnInit(): void {

    // Animaciones y Datos de ruta
    gsap.from('.gsap-contenido', { y: 100, opacity: 0, duration: .2 });
    this.dataService.ubicacionActual = 'Dashboard - Creando usuario';

    // Formulario reactivo
    this.usuarioForm = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(4)]],
      apellido: ['', Validators.required],
      nombre: ['', Validators.required],
      dni: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      repetir: ['', [Validators.required, Validators.minLength(4)]],
      role: ['ADMIN_ROLE', Validators.required],
    });

  }

  // Crear nuevo usuario
  nuevoUsuario(): void {

    const { role, password, repetir } = this.usuarioForm.value;

    // Se verifica si las contraseñas coinciden
    if (password !== repetir) {
      this.alertService.info('Las contraseñas deben coincidir');
      return;
    }

    if (this.usuarioForm.valid) {
      this.alertService.question({ msg: 'Creando nuevo usuario', buttonText: 'Aceptar' })
        .then(({ isConfirmed }) => {
          if (isConfirmed) {
            this.alertService.loading();  // Comienzo de loading
            const data = this.usuarioForm.value;
            delete data.repetir;
            this.usuariosService.nuevoUsuario(this.usuarioForm.value).subscribe({
              next: () => {
                if (role === 'ADMIN_ROLE') this.router.navigateByUrl('dashboard/usuarios');
                else this.router.navigateByUrl('dashboard/usuarios');
                this.alertService.close();  // Finaliza el loading
              }, error: ({ error }) => {
                this.alertService.errorApi(error.message);
              }
            })
          }
        });
    } else {
      this.usuarioForm.markAllAsTouched();
    }

  }

}
