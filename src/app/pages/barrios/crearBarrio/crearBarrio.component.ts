import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AlertService } from '../../../services/alert.service';
import { AuthService } from '../../../services/auth.service';
import { BarriosService } from '../../../services/barrios.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TarjetaListaComponent } from '../../../components/tarjeta-lista/tarjeta-lista.component';

// Declaración para Leaflet
declare var L: any;

@Component({
  selector: 'app-crear-barrio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TarjetaListaComponent,
  ],
  templateUrl: './crearBarrio.component.html',
})
export default class CrearBarrioComponent implements OnInit, AfterViewInit, OnDestroy  {

    // Formulario
    public barrio = {
      descripcion: ''
    };
  
    // Variables para el mapa
    public mapa: any = null;
    public mapaInicializado: boolean = false;
    public mapaCargando: boolean = true;
    public mapaError: boolean = false;
    public poligono: any = null;
    public coordenadas: any[] = [];
    public guardando: boolean = false;
    public intentosInicializacion: number = 0;
    public maxIntentos: number = 5;
  
    constructor(
      private barriosService: BarriosService,
      private alertService: AlertService,
      private authService: AuthService,
      private router: Router
    ) { }
  
    ngOnInit(): void {
      // Componente inicializado
    }
  
    ngAfterViewInit(): void {
      // Esperar a que el DOM esté completamente renderizado
      this.mapaCargando = true;
      setTimeout(() => {
        this.inicializarMapa();
      }, 300);
    }
  
    ngOnDestroy(): void {
      if (this.mapa) {
        this.mapa.remove();
      }
    }
  
    /**
     * Inicializa el mapa de Leaflet
     */
    private inicializarMapa(): void {
      this.intentosInicializacion++;

      // Si excedimos los intentos máximos, mostrar error
      if (this.intentosInicializacion > this.maxIntentos) {
        console.error('Se excedió el número máximo de intentos de inicialización');
        this.mapaCargando = false;
        this.mapaError = true;
        return;
      }

      try {
        // Verificar si Leaflet está disponible
        if (typeof L === 'undefined') {
          console.warn(`Intento ${this.intentosInicializacion}: Leaflet no está cargado`);
          setTimeout(() => this.inicializarMapa(), 400);
          return;
        }

        // Verificar si el elemento del mapa existe
        const mapaElement = document.getElementById('mapa-crear-barrio');
        if (!mapaElement) {
          console.warn(`Intento ${this.intentosInicializacion}: Elemento del mapa no encontrado`);
          setTimeout(() => this.inicializarMapa(), 400);
          return;
        }

        // Verificar que el contenedor tenga dimensiones
        const rect = mapaElement.getBoundingClientRect();
        if (rect.height === 0 || rect.width === 0) {
          console.warn(`Intento ${this.intentosInicializacion}: El contenedor no tiene dimensiones`);
          setTimeout(() => this.inicializarMapa(), 400);
          return;
        }

        // Si el mapa ya existe, removerlo primero
        if (this.mapa) {
          try {
            this.mapa.off();
            this.mapa.remove();
          } catch (e) {
            console.warn('Error al remover mapa anterior:', e);
          }
          this.mapa = null;
        }

        // Crear el mapa centrado en Plaza Pringles, San Luis, Argentina
        this.mapa = L.map('mapa-crear-barrio', {
          center: [-33.3020084, -66.3364262], // Plaza Pringles, San Luis, Argentina
          zoom: 18,
          zoomControl: true,
          attributionControl: false,
          preferCanvas: true // Mejora el rendimiento
        });

        // Agregar capa de OpenStreetMap con manejo de eventos
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          subdomains: ['a', 'b', 'c']
        });

        tileLayer.on('load', () => {
          console.log('Tiles del mapa cargados correctamente');
          this.mapaCargando = false;
          this.mapaError = false;
        });

        tileLayer.on('tileerror', (error: any) => {
          console.error('Error al cargar tiles:', error);
        });

        tileLayer.addTo(this.mapa);

        // Agregar eventos de clic para crear polígono
        this.mapa.on('click', (e: any) => {
          this.agregarPunto(e.latlng);
        });

        // Marcar que el mapa está inicializado
        this.mapaInicializado = true;
        this.mapaCargando = false;
        this.mapaError = false;

        console.log('Mapa inicializado correctamente');

        // Forzar múltiples refrescos escalonados para asegurar visualización correcta
        setTimeout(() => {
          if (this.mapa) {
            this.mapa.invalidateSize();
          }
        }, 100);

        setTimeout(() => {
          if (this.mapa) {
            this.mapa.invalidateSize();
          }
        }, 400);

        setTimeout(() => {
          if (this.mapa) {
            this.mapa.invalidateSize();
          }
        }, 800);

      } catch (error) {
        console.error('Error al inicializar el mapa:', error);
        this.mapaError = true;
        this.mapaCargando = false;

        // Reintentar si no hemos alcanzado el máximo de intentos
        if (this.intentosInicializacion < this.maxIntentos && !this.mapaInicializado) {
          setTimeout(() => this.inicializarMapa(), 500);
        }
      }
    }

    /**
     * Reiniciar el mapa manualmente
     */
    recargarMapa(): void {
      console.log('Recargando mapa manualmente...');
      this.mapaInicializado = false;
      this.mapaCargando = true;
      this.mapaError = false;
      this.intentosInicializacion = 0;

      if (this.mapa) {
        try {
          this.mapa.off();
          this.mapa.remove();
        } catch (e) {
          console.warn('Error al remover mapa:', e);
        }
        this.mapa = null;
      }

      setTimeout(() => {
        this.inicializarMapa();
      }, 200);
    }
  
    /**
     * Agregar punto al polígono
     */
    private agregarPunto(latlng: any): void {
      this.coordenadas.push({
        lat: latlng.lat,
        lng: latlng.lng
      });
  
      // Crear marcador
      L.marker([latlng.lat, latlng.lng], {
        icon: L.divIcon({
          className: 'punto-poligono',
          html: `<div class="w-3 h-3 bg-purple-500 rounded-full border-2 border-white shadow-lg"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        })
      }).addTo(this.mapa);
  
      // Si tenemos 3 o más puntos, crear/actualizar polígono
      if (this.coordenadas.length >= 3) {
        this.crearPoligono();
      }
    }
  
    /**
     * Crear polígono en el mapa
     */
    private crearPoligono(): void {
      // Remover polígono anterior si existe
      if (this.poligono) {
        this.mapa.removeLayer(this.poligono);
      }
  
      const coordenadas = this.coordenadas.map(coord => [coord.lat, coord.lng]);
      
      this.poligono = L.polygon(coordenadas, {
        color: '#8B5CF6', // Púrpura
        weight: 3,
        opacity: 0.8,
        fillColor: '#8B5CF6',
        fillOpacity: 0.2,
        dashArray: '5, 5' // Línea punteada para indicar que está en creación
      }).addTo(this.mapa);
    }
  
    /**
     * Limpiar mapa y reiniciar
     */
    limpiarMapa(): void {
      this.coordenadas = [];
      
      // Limpiar marcadores
      this.mapa.eachLayer((layer: any) => {
        if (layer.options && layer.options.icon && layer.options.icon.options.className === 'punto-poligono') {
          this.mapa.removeLayer(layer);
        }
      });
  
      // Limpiar polígono
      if (this.poligono) {
        this.mapa.removeLayer(this.poligono);
        this.poligono = null;
      }
    }
  
    /**
     * Guardar barrio
     */
    guardarBarrio(): void {
      // Validaciones
      if (!this.barrio.descripcion.trim()) {
        this.alertService.errorApi('La descripción del barrio es obligatoria.');
        return;
      }
  
      if (this.coordenadas.length < 3) {
        this.alertService.errorApi('El polígono debe tener al menos 3 puntos.');
        return;
      }
  
      this.alertService.question({
        msg: '¿Está seguro de crear el nuevo barrio?',
        buttonText: 'Crear'
      }).then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.guardando = true;
          this.alertService.loading();
  
          const data = {
            descripcion: this.barrio.descripcion.trim(),
            coordenadas: this.coordenadas,
            creatorUserId: this.authService.usuario.userId
          };
  
          this.barriosService.nuevoBarrio(data).subscribe({
            next: () => {
              this.alertService.close();
              this.guardando = false;
              this.alertService.success('Barrio creado correctamente');
              this.router.navigate(['/dashboard/barrios']);
            },
            error: (error) => {
              this.alertService.close();
              this.guardando = false;
              this.alertService.errorApi('Error al crear el barrio');
              console.error('Error:', error);
            }
          });
        }
      });
    }
  
    /**
     * Cancelar creación y volver
     */
    cancelar(): void {
      if (this.coordenadas.length > 0 || this.barrio.descripcion.trim()) {
        this.alertService.question({
          msg: '¿Está seguro de cancelar? Se perderán los datos ingresados.',
          buttonText: 'Cancelar'
        }).then(({ isConfirmed }) => {
          if (isConfirmed) {
            this.router.navigate(['/dashboard/barrios']);
          }
        });
      } else {
        this.router.navigate(['/dashboard/barrios']);
      }
    }
  
    /**
     * Volver a barrios
     */
    volver(): void {
      this.cancelar();
    }

}
