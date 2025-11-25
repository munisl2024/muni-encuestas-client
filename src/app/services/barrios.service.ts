import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environments } from '../../environments/environments';
import { HttpClient } from '@angular/common/http';

const urlApi = environments.base_url + '/barrios';

@Injectable({
  providedIn: 'root'
})
export class BarriosService {

  public estadoAbm: 'crear' | 'editar' = 'crear';
  public showModalAbm = false;
  public barrios: any[] = [];
  public barrioSeleccionado: any = null;
  public abmForm = { descripcion: '' };

  get getToken(): any {
    return { 'Authorization': localStorage.getItem('token') }
  }

  constructor(private http: HttpClient) { }

  getBarrio(id: string): Observable<any> {
    return this.http.get(`${urlApi}/${id}`, {
      headers: this.getToken
    })
  }

  getBarrioConCoordenadas(id: string): Observable<any> {
    return this.http.get(`${urlApi}/${id}/coordenadas`, {
      headers: this.getToken
    })
  }

  getAllConCoordenadas(): Observable<any> {
    return this.http.get(`${urlApi}/mapa/coordenadas/general`, {
      headers: this.getToken
    })
  }

  listarBarrios({
    direccion = 'desc',
    columna = 'descripcion',
    activo = '',  
    parametro = '',
    pagina = 1,
    itemsPorPagina = 10000
  }): Observable<any> {
    return this.http.get(urlApi, {
      params: {
        direccion: String(direccion),
        columna,
        activo,
        parametro,
        pagina,
        itemsPorPagina
      },
      headers: this.getToken
    })
  }

  nuevoBarrio(data: any): Observable<any> {
    return this.http.post(urlApi, data, {
      headers: this.getToken
    })
  }

  actualizarBarrio(id: string, data: any): Observable<any> {
    return this.http.patch(`${urlApi}/${id}`, data, {
      headers: this.getToken
    })
  }
  
  importarKml(kmlFile: File): Observable<any> {
    return new Observable(observer => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const kmlData = e.target?.result as string;
        
        this.http.post(`${urlApi}/importar-kml`, {
          kmlData: kmlData
        }, {
          headers: this.getToken
        }).subscribe({
          next: (response) => observer.next(response),
          error: (error) => observer.error(error)
        });
      };
      
      reader.readAsText(kmlFile);
    });
  }

  abrirAbm(estado: 'crear' | 'editar', barrio: any = null): void {
    this.estadoAbm = estado;
    this.barrioSeleccionado = barrio;
    this.showModalAbm = true;
    
    if (estado === 'editar' && barrio) {
      this.abmForm = { descripcion: barrio.descripcion };
    } else {
      this.abmForm = { descripcion: '' };
    }
  }

  cerrarAbm(): void {
    this.showModalAbm = false;
    this.barrioSeleccionado = null;
    this.abmForm = { descripcion: '' };
  }

  actualizarEstado(id: string, activo: boolean): Observable<any> {
    return this.http.patch(`${urlApi}/${id}/estado`, { activo }, {
      headers: this.getToken
    })
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${urlApi}/${id}`, {
      headers: this.getToken
    })
  }

  reactivar(id: string): Observable<any> {
    return this.http.patch(`${urlApi}/${id}/reactivar`, {}, {
      headers: this.getToken
    })
  }

  actualizarCoordenadas(id: string, data: any): Observable<any> {
    return this.http.patch(`${urlApi}/coordenadas/${id}`, data, {
      headers: this.getToken
    })
  }

}
