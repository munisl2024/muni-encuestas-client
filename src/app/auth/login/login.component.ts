import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './login.component.html',
  styleUrls: []
})
export default class LoginComponent implements OnInit {

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }

  public loginForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(4)]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  })

  constructor(
    private router: Router,
    private authService: AuthService,
    private alertService: AlertService,
    private fb: FormBuilder,
  ) { }

  ngOnInit() {
    // Timeline de animaciones profesionales
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Animar logo con efecto bounce
    tl.from('.gsap-logo', {
      scale: 0.5,
      opacity: 0,
      duration: 0.4,
      ease: 'back.out(1.7)'
    });

    // Animar formulario desde abajo
    tl.from('.gsap-formulario', {
      y: 50,
      opacity: 0,
      duration: 0.3
    }, '-=0.2');

    // Animar campos del formulario uno por uno
    tl.from('.gsap-formulario form > div', {
      x: -30,
      opacity: 0,
      duration: 0.25,
      stagger: 0.05
    }, '-=0.15');

    // Animar botón
    tl.from('.gsap-formulario button[type="submit"]', {
      scale: 0.9,
      opacity: 0,
      duration: 0.3,
      ease: 'back.out(1.4)'
    }, '-=0.2');

    // Animar footer
    tl.from('.gsap-footer', {
      y: 20,
      opacity: 0,
      duration: 0.25
    }, '-=0.15');
  }

  login(): void {
    if(this.loginForm.valid){
      this.alertService.loading();
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.alertService.close();
          this.router.navigateByUrl('/dashboard/home');
        }, error: ({ error }) => {
          this.loginForm.reset();
          this.alertService.errorApi(error.message);
        }
      });
    }else{
      this.loginForm.markAllAsTouched();
    }
  }

}
