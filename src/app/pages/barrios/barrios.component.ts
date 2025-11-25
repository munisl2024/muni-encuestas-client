import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { PastillaEstadoComponent } from '../../components/pastilla-estado/pastilla-estado.component';
import { TarjetaListaComponent } from '../../components/tarjeta-lista/tarjeta-lista.component';
import AbmBarriosComponent from './abmBarrios/abmBarrios.component';
import { fromEvent, map, debounceTime } from 'rxjs';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { BarriosService } from '../../services/barrios.service';
import { DataService } from '../../services/data.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-barrios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxPaginationModule,
    RouterModule,
    PastillaEstadoComponent,
    TarjetaListaComponent,
    AbmBarriosComponent
  ],
  templateUrl: './barrios.component.html',
  styleUrl: './barrios.component.css',
})
export default class BarriosComponent {

  @ViewChild('buscadorBarrios') buscadorBarrios: ElementRef;
  @ViewChild('fileInput') fileInput: ElementRef;

  public permiso_escritura: string[] = ['BARRIOS_ALL'];

  // Paginacion
  public totalItems: number;
  public paginaActual: number = 1;
  public cantidadItems: number = 10;

  public filtro = {
    activo: 'true',
    parametro: ''
  }

  public ordenar = {
    direccion: 'asc',
    columna: 'descripcion'
  }

  public buscandoBarrios: boolean = true;
  public importandoKml: boolean = false;
  public dropdownAccionesAbierto: boolean = false;

  constructor(
    public authService: AuthService,
    public barriosService: BarriosService,
    private alertService: AlertService,
    private toastr: ToastrService,
    private dataService: DataService
  ) { }

  ngOnInit(): void {
    this.dataService.ubicacionActual = 'Equinoccio - Barrios';
    this.alertService.loading();
    this.listarBarrios();
  }

  ngAfterViewInit(): void {
    fromEvent<any>(this.buscadorBarrios?.nativeElement, 'keyup')
    .pipe(
      map(event => event.target.value),
      debounceTime(300),
    ).subscribe(text => {
      this.filtro.parametro = text;
      this.cambiarPagina(1);
    })
  }

  abrirAbm(estado: 'crear' | 'editar', barrio: any = null): void {
    this.barriosService.abrirAbm(estado, barrio);
  }

  listarBarrios(): void {
    const parametros: any = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      activo: this.filtro.activo,
      parametro: this.filtro.parametro,
      pagina: this.paginaActual,
      itemsPorPagina: this.cantidadItems,
    }
    this.barriosService.listarBarrios(parametros).subscribe({
      next: ({ barrios, totalItems }) => {
        this.barriosService.barrios = barrios;
        this.totalItems = totalItems;
        this.buscandoBarrios = false;
        this.alertService.close();
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  cambiarPagina(nroPagina: any): void {
    this.buscandoBarrios = true;
    this.paginaActual = nroPagina;
    this.listarBarrios();
  }

  ordenarPorColumna(columna: string): void {
    if (this.ordenar.columna === columna) {
      this.ordenar.direccion = this.ordenar.direccion === 'asc' ? 'desc' : 'asc';
    } else {
      this.ordenar.columna = columna;
      this.ordenar.direccion = 'asc';
    }
    this.cambiarPagina(1);
  }

  nuevoBarrio(barrio: any): void {
    this.barriosService.nuevoBarrio(barrio).subscribe({
      next: ({ success, message, barrio }) => {
        this.toastr.success(message);
        this.barriosService.cerrarAbm();
        this.listarBarrios();
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  actualizarBarrio(barrio: any): void {
    this.barriosService.actualizarBarrio(this.barriosService.barrioSeleccionado.id, barrio).subscribe({
      next: ({ success, message, barrio }) => {
        this.toastr.success(message, 'Barrios');
        this.barriosService.cerrarAbm();
        this.listarBarrios();
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  cambiarEstado(barrio: any): void {
    const { id, activo } = barrio;

    this.alertService.question({ 
      msg: activo ? 'Baja de elemento' : 'Alta de elemento', 
      buttonText: activo ? 'Dar de baja' : 'Dar de alta' 
    }).then(({ isConfirmed }) => {
      if (isConfirmed) {
        this.alertService.loading();
        this.barriosService.actualizarEstado(id, !activo).subscribe({
          next: ({ success, message }) => {
            this.listarBarrios();
            this.toastr.success(activo ? 'Baja correcta' : 'Alta correcta', 'Barrios');
          }, error: ({ error }) => this.alertService.errorApi(error.message)
        })
      }
    });
  }

  eliminarBarrio(barrio: any): void {
    this.alertService.question({ 
      msg: `¿Estás seguro de que quieres eliminar el barrio "${barrio.descripcion}"?`, 
      buttonText: 'Eliminar' 
    }).then(({ isConfirmed }) => {
      if (isConfirmed) {
        this.alertService.loading();
        this.barriosService.delete(barrio.id).subscribe({
          next: ({ success, message }) => {
            this.toastr.success(message);
            this.listarBarrios();
          }, error: ({ error }) => this.alertService.errorApi(error.message)
        })
      }
    })
  }

  reactivarBarrio(barrio: any): void {
    this.alertService.loading();
    this.barriosService.reactivar(barrio.id).subscribe({
      next: ({ success, message }) => {
        this.listarBarrios();
        this.toastr.success(message);
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.kml')) {
      this.importarKml(file);
    } else {
      this.toastr.error('Por favor selecciona un archivo KML válido', 'Error');
    }
  }

  importarKml(file: File): void {
    this.importandoKml = true;
    this.alertService.loading('Importando KML...');

    this.barriosService.importarKml(file).subscribe({
      next: (response) => {
        this.importandoKml = false;
        this.alertService.close();
        
        const { total, creados, errores } = response;
        if (errores && errores.length > 0) {
          this.toastr.warning(
            `Importación completada con ${errores.length} errores. ${creados} barrios creados exitosamente.`, 
            'Importación con Advertencias'
          );
        } else {
          this.toastr.success(
            `KML importado exitosamente. ${creados} barrios procesados.`, 
            'Importación Exitosa'
          );
        }
        
        // Limpiar input de archivo
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }
        
        // Recargar lista de barrios
        this.listarBarrios();
      },
      error: (error) => {
        this.importandoKml = false;
        this.alertService.close();
        this.toastr.error(error.error?.message || 'Error al importar KML', 'Error');
        
        // Limpiar input de archivo
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }
      }
    });
  }

  filtrarActivos(event: any): void {
    this.paginaActual = 1;
    this.filtro.activo = event.target.value;
    this.listarBarrios();
  }

  filtrarParametro(event: any): void {
    this.paginaActual = 1;
    this.cantidadItems = Number(event.target.value);
    this.listarBarrios();
  }

  toggleDropdownAcciones(): void {
    this.dropdownAccionesAbierto = !this.dropdownAccionesAbierto;
  }

  cerrarDropdownAcciones(): void {
    this.dropdownAccionesAbierto = false;
  }


}
