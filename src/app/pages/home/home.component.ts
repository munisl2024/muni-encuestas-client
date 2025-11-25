import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import gsap from 'gsap';
import { ModalComponent } from '../../components/modal/modal.component';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [
    CommonModule,
    ModalComponent,
    RouterModule
  ],
  templateUrl: './home.component.html',
  styleUrls: []
})
export default class HomeComponent implements OnInit {

  constructor(
    private dataService: DataService,
    public authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    // Verificar si el usuario es encuestador y redirigir
    if (this.authService.usuario?.role === 'ENCUESTADOR_ROLE') {
      this.router.navigateByUrl('/public/encuestas-disponibles');
      return;
    }

    // Animaciones GSAP mejoradas
    // Fade in del contenedor principal
    gsap.from('.gsap-contenido', {
      y: 30,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out'
    });

    // Logo con efecto de escala
    gsap.from('.gsap-contenido > div:first-child .group', {
      scale: 0.85,
      opacity: 0,
      duration: 0.9,
      delay: 0.2,
    });

    // Título con fade
    gsap.from('.gsap-contenido > div:first-child > div:last-child', {
      y: 20,
      opacity: 0,
      duration: 0.7,
      delay: 0.4,
      ease: 'power3.out'
    });



    // Footer
    gsap.from('.gsap-contenido > div:last-child', {
      y: 20,
      opacity: 0,
      duration: 0.5,
      delay: 1.1,
      ease: 'power2.out'
    });
  }

}
