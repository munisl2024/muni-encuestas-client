import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import L from 'leaflet';
import { AlertService } from '../../../services/alert.service';
import { BarriosService } from '../../../services/barrios.service';

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
  selector: 'app-geolocalizacion-barrios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './geolocalizacionBarrios.component.html',
})
export default class GeolocalizacionBarriosComponent {
  
  private map: L.Map;
  private barriosLayer: L.LayerGroup;
  public barrios: any[] = [];
  public barriosFiltrados: any[] = [];
  public cargando: boolean = true;

  public filtroDescripcion: string = '';
  public descripcionesUnicas: string[] = [];

  constructor(
    private barriosService: BarriosService,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    this.cargarBarrios();
  }

  ngAfterViewInit(): void {
    this.inicializarMapa();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private inicializarMapa(): void {
    // Inicializar el mapa con coordenadas de San Luis, Argentina
    this.map = L.map('mapaBarrios', {
      center: [-33.3020084, -66.3364262], // Plaza Pringles, San Luis
      zoom: 13,
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
    }).addTo(this.map);

    // Crear capa para los barrios
    this.barriosLayer = L.layerGroup().addTo(this.map);

    // Forzar refrescos para asegurar visualización correcta
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 100);
  }

  private cargarBarrios(): void {
    this.alertService.loading('Cargando barrios...');
    this.barriosService.getAllConCoordenadas().subscribe({
      next: (response) => {
        this.barrios = response.barrios;
        this.barriosFiltrados = [...this.barrios];
        this.obtenerDescripcionesUnicas();
        this.cargando = false;
        this.alertService.close();
        this.dibujarBarrios();
        this.ajustarVistaMapa(); // Ajustar vista solo al cargar inicialmente
      },
      error: (error) => {
        this.cargando = false;
        this.alertService.errorApi(error.error?.message || 'Error al cargar los barrios');
      }
    });
  }

  private obtenerDescripcionesUnicas(): void {
    this.descripcionesUnicas = [...new Set(this.barrios.map(b => b.descripcion))].sort();
  }

  public filtrarPorDescripcion(): void {
    if (this.filtroDescripcion === '') {
      this.barriosFiltrados = [...this.barrios];
    } else {
      this.barriosFiltrados = this.barrios.filter(b => b.descripcion === this.filtroDescripcion);
    }
    this.dibujarBarrios();
    this.ajustarVistaMapa(); // Ajustar vista solo al filtrar
  }

  private dibujarBarrios(): void {
    this.barriosLayer.clearLayers();

    this.barriosFiltrados.forEach(barrio => {
      if (barrio.CoordenadasToBarrio && barrio.CoordenadasToBarrio.length > 0) {
        const coordenadas = barrio.CoordenadasToBarrio.map((coord: any) => [coord.lat, coord.lng]);
        
        const polygon = L.polygon(coordenadas, {
          color: '#2563EB', // Azul más oscuro para mejor contraste
          weight: 3,
          opacity: 0.9,
          fillColor: '#3B82F6',
          fillOpacity: 0.3,
          smoothFactor: 1.0
        });

        // Agregar popup con información del barrio
        const popupContent = `
          <div class="popup-barrio-geo" style="min-width: 200px;">
            <h3 class="font-bold text-lg mb-2 text-blue-700">${barrio.descripcion}</h3>
            <div class="space-y-1">
              <p class="text-sm text-gray-600">
                <strong>Estado:</strong>
                <span class="${barrio.activo ? 'text-green-600' : 'text-red-600'} font-semibold">
                  ${barrio.activo ? 'Activo' : 'Inactivo'}
                </span>
              </p>
              <p class="text-sm text-gray-600">
                <strong>Puntos:</strong> ${barrio.CoordenadasToBarrio.length}
              </p>
              ${barrio.createdAt ? `<p class="text-sm text-gray-500 mt-2"><strong>Creado:</strong> ${new Date(barrio.createdAt).toLocaleDateString()}</p>` : ''}
            </div>
          </div>
        `;

        polygon.bindPopup(popupContent, {
          maxWidth: 300,
          className: 'custom-popup-barrios',
          closeButton: true,
          autoClose: false,
          closeOnClick: false
        });

        // Evento de clic para mostrar popup
        polygon.on('click', () => {
          polygon.openPopup();
        });

        // Evento de hover para resaltar el polígono
        polygon.on('mouseover', () => {
          polygon.setStyle({
            weight: 5,
            opacity: 1,
            fillOpacity: 0.5,
            color: '#1E40AF'
          });
        });

        polygon.on('mouseout', () => {
          polygon.setStyle({
            weight: 3,
            opacity: 0.9,
            fillOpacity: 0.3,
            color: '#2563EB'
          });
        });

        polygon.addTo(this.barriosLayer);
      }
    });
  }

  private ajustarVistaMapa(): void {
    // Solo ajustar la vista si hay barrios filtrados
    if (this.barriosFiltrados.length > 0) {
      const bounds = this.calcularBounds();
      if (bounds.isValid()) {
        this.map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 16
        });
      }
    }
  }



  private calcularBounds(): L.LatLngBounds {
    const bounds = L.latLngBounds([]);
    
    this.barriosFiltrados.forEach(barrio => {
      if (barrio.CoordenadasToBarrio && barrio.CoordenadasToBarrio.length > 0) {
        barrio.CoordenadasToBarrio.forEach((coord: any) => {
          bounds.extend([coord.lat, coord.lng]);
        });
      }
    });

    return bounds;
  }

  public obtenerEstadisticas(): any {
    const total = this.barrios.length;
    const filtrados = this.barriosFiltrados.length;
    const conCoordenadas = this.barriosFiltrados.filter(b => b.CoordenadasToBarrio && b.CoordenadasToBarrio.length > 0).length;
    return { total, filtrados, conCoordenadas };
  }

  public mostrarTodosLosBarrios(): void {
    this.filtroDescripcion = '';
    this.barriosFiltrados = [...this.barrios];
    this.dibujarBarrios();
    this.ajustarVistaMapa(); // Ajustar vista al mostrar todos
  }

  public limpiarSeleccion(): void {
    this.filtroDescripcion = '';
    this.barriosFiltrados = [...this.barrios];
    this.dibujarBarrios();
    this.ajustarVistaMapa(); // Ajustar vista al limpiar selección
  }

}
