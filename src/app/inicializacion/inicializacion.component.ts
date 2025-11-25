import { Component, OnInit } from '@angular/core';
import { InicializacionService } from '../services/inicializacion.service';
import { AlertService } from '../services/alert.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-inicializacion',
  templateUrl: './inicializacion.component.html',
  styleUrls: []
})
export default class InicializacionComponent implements OnInit {

  constructor(
    private inicializacionService: InicializacionService,
    private alertService: AlertService,
    private router: Router
  ) { }

  ngOnInit() {}

  inicializarSistema(): void {
    this.alertService.loading();
    this.inicializacionService.inicializarSistema().subscribe({
      next: () => {
        this.router.navigateByUrl('/login');
        this.alertService.success('Sistema inicializado correctamente');
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

}
