import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { AlertService } from '../../services/alert.service';
import { EncuestasService } from '../../services/encuestas.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import AbmEncuestasComponent from './abmEncuestas/abmEncuestas.component';
import { TarjetaListaComponent } from '../../components/tarjeta-lista/tarjeta-lista.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { debounceTime, fromEvent, map } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-encuestas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AbmEncuestasComponent,
    TarjetaListaComponent,
    NgxPaginationModule,
    RouterModule
  ],
  templateUrl: './encuestas.component.html',
})
export default class EncuestasComponent implements AfterViewInit {

    // Permisos
    public permiso_escritura: string[] = ['ENCUESTAS_ALL'];

    // Paginacion
    public paginaActual: number = 1;
    public cantidadItems: number = 10;
  
    // Filtrado
    public filtro = {
      estado: '',
      parametro: ''
    }
  
    // Ordenar
    public ordenar = {
      direccion: 'desc',  // Asc (1) | Desc (-1)
      columna: 'id'
    }

    // Buscador - Encuestas
    public cargandoEncuestas: boolean = false;
    @ViewChild('buscadorEncuestas') buscadorEncuestas: ElementRef;
    

    constructor(
      public router: Router,
      public authService: AuthService,
      public encuestasService: EncuestasService,
      private alertService: AlertService,
    ) { }
  

    ngOnInit(): void {
      this.alertService.loading();
      this.listarEncuestas();
    }
  
    ngAfterViewInit(): void {
      fromEvent<any>(this.buscadorEncuestas.nativeElement, 'keyup')
        .pipe(
          map( (event: any) => event.target.value ),
          debounceTime(300),
        ).subscribe((textoBusqueda) =>{
          this.filtro.parametro = textoBusqueda;
          this.cambiarPagina(1);
        })
    }

    // Listar encuestas
    listarEncuestas(): void {
      this.cargandoEncuestas = true;
      const parametros: any = {
        direccion: this.ordenar.direccion,
        columna: this.ordenar.columna,
        pagina: this.paginaActual,
        itemsPorPagina: this.cantidadItems,
        estado: this.filtro.estado,
        parametro: this.filtro.parametro
      }
      this.encuestasService.listarEncuestas(parametros).subscribe({
        next: ({ encuestas, totalItems }) => {
          this.encuestasService.encuestas = encuestas;
          this.encuestasService.total = totalItems;
          this.cargandoEncuestas = false;
          this.alertService.close();
        }, error: ({ error }) => this.alertService.errorApi(error.message)
      })
    }
  
    // Nueva encuesta
    nuevaEncuesta(encuesta): void {
      this.encuestasService.encuestas = [encuesta, ...this.encuestasService.encuestas];
      this.ordenarEncuestas();
      this.alertService.close();
      this.router.navigate(['/dashboard/encuestas/detalles', encuesta.id]);
    }
  
    // Actualizar encuesta
    actualizarEncuesta(encuesta): void {
      const index = this.encuestasService.encuestas.findIndex((t: any) => t.id === encuesta.id);
      this.encuestasService.encuestas[index] = encuesta;
      this.encuestasService.encuestas = [...this.encuestasService.encuestas];
      this.ordenarEncuestas();
      this.alertService.close();
    }
  
    // Actualizar estado Activo/Inactivo
    actualizarEstado(encuesta: any): void {
  
      const { id, activo } = encuesta;
  
      this.alertService.question({ msg: encuesta.activo ? 'Baja de elemento' : 'Alta de elemento', buttonText: encuesta.activo ? 'Dar de baja' : 'Dar de alta' })
        .then(({ isConfirmed }) => {
          if (isConfirmed) {
            this.alertService.loading();
            this.encuestasService.actualizarEncuesta(id, { activo: !activo }).subscribe({
              next: () => {
                this.alertService.loading();
                this.listarEncuestas();
              }, error: ({ error }) => this.alertService.errorApi(error.message)
            })
          }
        });

    }
      
    // Filtrar por Parametro
    filtrarParametro(parametro: string): void {
      this.paginaActual = 1;
      this.filtro.parametro = parametro;
    }
  
    // Ordenar por columna
    ordenarPorColumna(columna: string) {
      this.ordenar.columna = columna;
      this.ordenar.direccion = this.ordenar.direccion == 'asc' ? 'desc' : 'asc';
      this.alertService.loading();
      this.listarEncuestas();
    }
  
    // Ordenar encuestas por titulo
    ordenarEncuestas(): void {
      this.encuestasService.encuestas.sort((a, b) => {
        const tituloA = a.titulo.toLowerCase();
        const tituloB = b.titulo.toLowerCase();
  
        if (this.ordenar.direccion === 'asc') {
          return tituloA < tituloB ? -1 : tituloA > tituloB ? 1 : 0;
        } else {
          return tituloA > tituloB ? -1 : tituloA < tituloB ? 1 : 0;
        }
      });
    }

    cambiarPagina( pagina: number ): void {
      this.paginaActual = pagina;
      this.listarEncuestas();
    }

}
