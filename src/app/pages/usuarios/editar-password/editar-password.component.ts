import { Component, OnInit } from '@angular/core';
import { Usuarios } from '../../../interfaces/Usuarios.interface';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UsuariosService } from '../../../services/usuarios.service';
import { AlertService } from '../../../services/alert.service';
import { DataService } from '../../../services/data.service';
import gsap from 'gsap';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-editar-password',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterModule
  ],
  templateUrl: './editar-password.component.html',
  styleUrls: []
})
export default class EditarPasswordComponent implements OnInit {

  get password() {
    return this.passwordForm.get('password');
  }

  get repetir() {
    return this.passwordForm.get('repetir');
  }

  public id: string;
  public loading = true;
  public usuario: any = {
    id: '',
    usuario: '',
    apellido: '',
    nombre: '',
    email: '',
    role: ''
  };
  public passwordForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(4)]],
    repetir: ['', [Validators.required, Validators.minLength(4)]]
  });

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private usuariosService: UsuariosService,
    private alertService: AlertService,
    private dataService: DataService
  ) { }

  ngOnInit(): void {
    gsap.from('.gsap-contenido', { y: 100, opacity: 0, duration: .2 });
    this.dataService.ubicacionActual = 'Dashboard - Actualizando password'
    this.alertService.loading();
    this.activatedRoute.params.subscribe({
      next: ({ id }) => {
        this.id = id;
        this.usuariosService.getUsuario(id).subscribe(usuario => {
          this.usuario = usuario;
          this.alertService.close();
        });
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })

  }

  // Actualizar constraseña
  actualizarPassword(): void | boolean {

    const { password } = this.passwordForm.value;

    // Verificacion - Las contraseñas deben coincidir
    if (password !== this.repetir.value) {
      this.alertService.errorApi('Las contraseñas deben coincidir');
      return;
    }

    if(this.passwordForm.valid){
      this.alertService.loading();
      this.usuario.password = password;
      this.usuario.activo = true ? 'true' : 'false';
      this.usuariosService.actualizarUsuario(this.id, this.usuario).subscribe({
        next: () => {
          this.alertService.close();
          this.router.navigateByUrl('/dashboard/usuarios');
        }, error: ({ error }) => this.alertService.errorApi(error.message)
      })
    }else{
      this.passwordForm.markAllAsTouched();
    }
  }
}
