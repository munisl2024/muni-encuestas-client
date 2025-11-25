import { Component, OnInit } from '@angular/core';
import { Usuarios } from '../../../interfaces/Usuarios.interface';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UsuariosService } from '../../../services/usuarios.service';
import { AlertService } from '../../../services/alert.service';
import { DataService } from '../../../services/data.service';
import gsap from 'gsap';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-editar-usuario',
  imports: [
    RouterModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './editar-usuario.component.html',
  styleUrls: []
})
export default class EditarUsuarioComponent implements OnInit {

  get nombre_usuario() {
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

  public id: string;
  public usuario: Usuarios;
  public usuarioForm: FormGroup;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private usuariosService: UsuariosService,
    private alertService: AlertService,
    private dataService: DataService
  ) { }

  ngOnInit(): void {

    // Animaciones y Datos de ruta
    gsap.from('.gsap-contenido', { y: 100, opacity: 0, duration: .2 });
    this.dataService.ubicacionActual = 'Dashboard - Editando usuario';

    // Formulario reactivo
    this.usuarioForm = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(4)]],
      apellido: ['', Validators.required],
      nombre: ['', Validators.required],
      dni: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['USER_ROLE', [Validators.required, Validators.minLength(4)]],
      activo: ['true', Validators.required],
    });

    this.getUsuario(); // Datos iniciales de usuarios

  }

  // Datos iniciales de usuarios
  getUsuario(): void {

    // Se buscan los datos iniciales del usuario a editar
    this.alertService.loading();
    this.activatedRoute.params.subscribe(({ id }) => { this.id = id; });
    this.usuariosService.getUsuario(this.id).subscribe({
      next: (usuarioRes) => {

        this.usuario = usuarioRes;
        const { usuario, apellido, nombre, dni, email, role, activo } = this.usuario;

        this.usuarioForm.patchValue({
          usuario,
          apellido,
          nombre,
          dni,
          email,
          role,
          activo: String(activo)
        });

        this.alertService.close();

      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })

  }

  // Editar usuario
  editarUsuario(): void | boolean {
    if (this.usuarioForm.valid) {
      let data: any = this.usuarioForm.value;
      this.alertService.question({ msg: 'Actualizando usuario', buttonText: 'Aceptar' })
        .then(({ isConfirmed }) => {
          if (isConfirmed) {
            this.alertService.loading();
            this.usuariosService.actualizarUsuario(this.id, data).subscribe({
              next: () => {
                this.alertService.close();
                this.router.navigateByUrl('dashboard/usuarios');
              }, error: ({ error }) => this.alertService.errorApi(error.message)
            });
          }
        });
    } else {
      this.usuarioForm.markAllAsTouched();
    }
  }

  // Funcion del boton regresar
  regresar(): void {
    this.router.navigateByUrl('/dashboard/usuarios');
  }

}
