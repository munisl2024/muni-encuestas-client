import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import L from 'leaflet';
import { AlertService } from '../../../services/alert.service';
import { BarriosService } from '../../../services/barrios.service';
import { CommonModule } from '@angular/common';
import { TarjetaListaComponent } from '../../../components/tarjeta-lista/tarjeta-lista.component';
import { AuthService } from '../../../services/auth.service';

// Configurar iconos de Leaflet (fix para Angular/Webpack)
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-detalles-barrio',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TarjetaListaComponent,
  ],
  templateUrl: './detallesBarrio.component.html',
})
export default class DetallesBarrioComponent {

  public permiso_escritura: string[] = ['BARRIOS_ALL'];
  
  public barrio: any = null;
  public cargando: boolean = true;
  
  // Variables para el mapa
  public mapa: any = null;
  public mapaInicializado: boolean = false;
  public poligono: any = null;
  public modoEdicion: boolean = false;
  public coordenadasEditando: any[] = [];

  constructor(
    public  authService: AuthService,
    private barriosService: BarriosService,
    private alertService: AlertService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.alertService.loading();
    this.activatedRoute.params.subscribe(params => {
      if (params['id']) {
        this.cargarBarrio(params['id']);
      }
    });
  }

  ngAfterViewInit(): void {
    // El mapa se inicializa después de cargar los datos
  }

  ngOnDestroy(): void {
    if (this.mapa) {
      this.mapa.remove();
    }
  }

  /**
   * Carga los datos del barrio
   */
  async cargarBarrio(id: string): Promise<void> {
    try {
      const response = await this.barriosService.getBarrioConCoordenadas(id).toPromise();
      this.barrio = response.barrio;
      this.cargando = false;
      this.alertService.close();
      
      // Inicializar mapa después de cargar los datos
      setTimeout(() => {
        this.inicializarMapa();
      }, 100);
      
    } catch (error) {
      this.alertService.close();
      this.alertService.errorApi('Error al cargar el barrio');
      console.error('Error:', error);
    }
  }

  /**
   * Inicializa el mapa de Leaflet
   */
  private inicializarMapa(): void {
    try {
      // Verificar si Leaflet está disponible
      if (typeof L === 'undefined') {
        console.error('Leaflet no está cargado');
        return;
      }

      // Verificar si el elemento del mapa existe
      const mapaElement = document.getElementById('mapa-detalle-barrio');
      if (!mapaElement) {
        console.error('Elemento del mapa no encontrado');
        return;
      }

      // Si ya existe un mapa, destruirlo primero
      if (this.mapa) {
        this.mapa.remove();
        this.mapa = null;
        this.mapaInicializado = false;
      }

      // Limpiar el contenedor del mapa
      mapaElement.innerHTML = '';

      // Calcular el centro del mapa
      let centroLat = -33.3020084; // Plaza Pringles, San Luis, Argentina
      let centroLng = -66.3364262;

      // Si hay coordenadas, calcular el centro del polígono
      if (this.barrio.CoordenadasToBarrio && this.barrio.CoordenadasToBarrio.length > 0) {
        const coordenadas = this.barrio.CoordenadasToBarrio;
        let latSum = 0;
        let lngSum = 0;

        coordenadas.forEach((coord: any) => {
          latSum += coord.lat;
          lngSum += coord.lng;
        });

        centroLat = latSum / coordenadas.length;
        centroLng = lngSum / coordenadas.length;
      }

      // Crear el mapa centrado en el polígono
      this.mapa = L.map('mapa-detalle-barrio', {
        center: [centroLat, centroLng],
        zoom: 15,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
        touchZoom: true
      });

      // Agregar capa de OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(this.mapa);

      // Crear el polígono solo si hay coordenadas
      if (this.barrio.CoordenadasToBarrio && this.barrio.CoordenadasToBarrio.length > 0) {
        this.crearPoligono();
      }

      // Agregar eventos de clic para crear nuevo polígono
      this.mapa.on('click', (e: any) => {
        if (this.modoEdicion) {
          this.agregarPuntoNuevoPoligono(e.latlng);
        }
      });

      // Marcar que el mapa está inicializado
      this.mapaInicializado = true;

      // Forzar refrescos para asegurar visualización correcta
      setTimeout(() => {
        if (this.mapa) {
          this.mapa.invalidateSize();
        }
      }, 100);

      // Segundo refresh para asegurar renderizado completo
      setTimeout(() => {
        if (this.mapa) {
          this.mapa.invalidateSize();
          // Si hay polígono, ajustar vista nuevamente
          if (this.poligono) {
            this.mapa.fitBounds(this.poligono.getBounds(), {
              padding: [50, 50],
              maxZoom: 16
            });
          }
        }
      }, 300);

    } catch (error) {
      console.error('Error al inicializar el mapa:', error);
    }
  }

  /**
   * Crea y agrega el polígono al mapa
   */
  private crearPoligono(): void {
    try {
      if (!this.mapa || !this.barrio.CoordenadasToBarrio) {
        return;
      }

      // Preparar las coordenadas para Leaflet
      const coordenadas = this.barrio.CoordenadasToBarrio.map((coord: any) => [
        coord.lat,
        coord.lng
      ]);

      // Crear el polígono
      this.poligono = L.polygon(coordenadas, {
        color: '#2563EB', // Azul más oscuro para mejor contraste
        weight: 4,
        opacity: 0.9,
        fillColor: '#3B82F6',
        fillOpacity: 0.3,
        smoothFactor: 1.0
      }).addTo(this.mapa);

      // Agregar popup al polígono
      this.poligono.bindPopup(`
        <div class="popup-barrio" style="min-width: 200px;">
          <h3 class="font-bold text-lg mb-2 text-blue-700">${this.barrio.descripcion}</h3>
          <p class="text-sm text-gray-600"><strong>Tipo:</strong> Barrio</p>
          <p class="text-sm text-gray-600"><strong>Puntos:</strong> ${coordenadas.length}</p>
          <p class="text-sm text-gray-600"><strong>Estado:</strong> <span class="${this.barrio.activo ? 'text-green-600' : 'text-red-600'}">${this.barrio.activo ? 'Activo' : 'Inactivo'}</span></p>
        </div>
      `);

      // Ajustar la vista del mapa para mostrar todo el polígono con padding
      this.mapa.fitBounds(this.poligono.getBounds(), {
        padding: [50, 50],
        maxZoom: 16
      });

    } catch (error) {
      console.error('Error al crear el polígono:', error);
    }
  }

  /**
   * Volver a la lista de barrios
   */
  volver(): void {
    this.router.navigate(['/dashboard/barrios']);
  }

  /**
   * Cambiar estado del barrio
   */
  cambiarEstado(): void {
    const nuevoEstado = !this.barrio.activo;
    const mensaje = nuevoEstado ? 'activar' : 'desactivar';
    
    this.alertService.question({
      msg: `¿Está seguro de ${mensaje} el barrio?`,
      buttonText: 'Aceptar'
    }).then(({ isConfirmed }) => {
      if (isConfirmed) {
        this.alertService.loading();
        
        this.barriosService.actualizarBarrio(this.barrio.id.toString(), {
          activo: nuevoEstado
        }).subscribe({
          next: () => {
            this.alertService.close();
            this.barrio.activo = nuevoEstado;
            this.alertService.success(`Barrio ${mensaje}do correctamente`);
          },
          error: (error) => {
            this.alertService.close();
            this.alertService.errorApi('Error al cambiar el estado del barrio');
            console.error('Error:', error);
          }
        });
      }
    });
  }

  /**
   * Editar barrio
   */
  editarBarrio(): void {
    this.barriosService.abrirAbm('editar', this.barrio);
  }

  /**
   * Activar/desactivar modo edición del mapa
   */
  toggleModoEdicion(): void {
    this.modoEdicion = !this.modoEdicion;
    
    if (this.modoEdicion) {
      this.coordenadasEditando = [];
      // Limpiar polígono existente para crear uno nuevo
      if (this.poligono) {
        this.mapa.removeLayer(this.poligono);
        this.poligono = null;
      }
      this.alertService.info('Modo edición activado. Haz clic en el mapa para crear un nuevo polígono (mínimo 3 puntos).');
    } else {
      this.coordenadasEditando = [];
      this.limpiarMarcadoresTemporales();
      // Recrear el polígono original si existe
      if (this.barrio.CoordenadasToBarrio && this.barrio.CoordenadasToBarrio.length > 0) {
        this.crearPoligono();
      }
      this.alertService.info('Modo edición desactivado.');
    }
  }


  /**
   * Agregar punto para nuevo polígono
   */
  private agregarPuntoNuevoPoligono(latlng: any): void {
    this.coordenadasEditando.push({
      lat: latlng.lat,
      lng: latlng.lng
    });

    // Crear marcador temporal
    const numeroMarcador = this.coordenadasEditando.length;
    L.marker([latlng.lat, latlng.lng], {
      icon: L.divIcon({
        className: 'punto-poligono',
        html: `
          <div class="relative">
            <div class="w-6 h-6 bg-orange-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
              <span class="text-white text-xs font-bold">${numeroMarcador}</span>
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    }).addTo(this.mapa);

    // Si tenemos 3 o más puntos, crear polígono temporal
    if (this.coordenadasEditando.length >= 3) {
      this.crearPoligonoTemporal();
    }
  }

  /**
   * Crear polígono temporal mientras se edita
   */
  private crearPoligonoTemporal(): void {
    // Remover polígono temporal anterior
    if (this.poligono) {
      this.mapa.removeLayer(this.poligono);
    }

    const coordenadas = this.coordenadasEditando.map(coord => [coord.lat, coord.lng]);

    this.poligono = L.polygon(coordenadas, {
      color: '#F59E0B', // Naranja para diferenciar del polígono guardado
      weight: 4,
      opacity: 0.9,
      fillColor: '#FBBF24',
      fillOpacity: 0.25,
      dashArray: '8, 4', // Línea punteada para indicar que es temporal
      smoothFactor: 1.0
    }).addTo(this.mapa);
  }

  /**
   * Guardar coordenadas editadas
   */
  guardarCoordenadas(): void {
    // if (this.coordenadasEditando.length < 3) {
    //   this.alertService.error('El polígono debe tener al menos 3 puntos.');
    //   return;
    // }

    this.alertService.question({
      msg: '¿Está seguro de guardar las nuevas coordenadas del barrio?',
      buttonText: 'Guardar'
    }).then(({ isConfirmed }) => {
      if (isConfirmed) {
        this.alertService.loading();
        
        this.barriosService.actualizarCoordenadas(this.barrio.id.toString(), {
          coordenadas: this.coordenadasEditando
        }).subscribe({
          next: () => {
            this.alertService.close();
            this.barrio.CoordenadasToBarrio = this.coordenadasEditando;
            this.modoEdicion = false;
            this.coordenadasEditando = [];
            this.alertService.success('Coordenadas actualizadas correctamente');

            // Recrear el polígono con los nuevos datos
            this.limpiarMarcadoresTemporales();
            if (this.poligono) {
              this.mapa.removeLayer(this.poligono);
              this.crearPoligono();
            }
          },
          error: (error) => {
            this.alertService.close();
            this.alertService.errorApi('Error al actualizar las coordenadas');
            console.error('Error:', error);
          }
        });
      }
    });
  }

  /**
   * Cancelar edición
   */
  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.coordenadasEditando = [];
    this.limpiarMarcadoresTemporales();
    
    // Eliminar polígono temporal si existe
    if (this.poligono) {
      this.mapa.removeLayer(this.poligono);
      this.poligono = null;
    }
    
    // Recrear el polígono original solo si había coordenadas originales
    if (this.barrio.CoordenadasToBarrio && this.barrio.CoordenadasToBarrio.length > 0) {
      this.crearPoligono();
    }
    
    this.alertService.info('Edición cancelada');
  }

  /**
   * Limpiar marcadores temporales
   */
  private limpiarMarcadoresTemporales(): void {
    this.mapa.eachLayer((layer: any) => {
      if (layer.options && layer.options.icon && layer.options.icon.options.className === 'punto-poligono') {
        this.mapa.removeLayer(layer);
      }
    });
  }

}
