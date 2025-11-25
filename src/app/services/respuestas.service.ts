import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environments } from '../../environments/environments';

const urlApi = environments.base_url + '/respuestas';

@Injectable({
  providedIn: 'root'
})
export class RespuestasService {

  // Modal Crear/Editar - Respuesta
  public abmRespuesta = {
    show: false,
    estado: 'crear',
    form: {
      descripcion: ''
    },
    respuestaSeleccionada: null,
  }

  public respuestas: any[] = [];
  public total: number = 0;

  get getToken(): any {
    return { 'Authorization': localStorage.getItem('token') }
  }

  constructor(private http: HttpClient) { }

  abrirAbm(estado: 'crear' | 'editar', respuesta: any = null): void {
    this.abmRespuesta.estado = estado;
    this.abmRespuesta.respuestaSeleccionada = respuesta;
    this.abmRespuesta.show = true;
    if (estado === 'editar') {
      this.abmRespuesta.form = {
        descripcion: respuesta.contenido,
      }
    } else {
      this.abmRespuesta.form = {
        descripcion: '',
      }
    }
  }

  obtenerRespuesta(id: string): Observable<any> {
    return this.http.get(`${urlApi}/${id}`, {
      headers: this.getToken
    })
  }

  listarRespuestas({
    direccion = 'desc',
    columna = 'id',
    parametro = '',
    pagina = 1,
    itemsPorPagina = 1000000,
    estado = ''
  }): Observable<any> {
    return this.http.get(urlApi, {
      params: {
        direccion: String(direccion),
        columna,
        parametro,
        pagina,
        itemsPorPagina,
        estado
      },
      headers: this.getToken
    })
  }

  nuevaRespuesta(data: any): Observable<any> {
    return this.http.post(urlApi, data, {
      headers: this.getToken
    })
  }

  actualizarRespuesta(id: string, data: any): Observable<any> {
    return this.http.patch(`${urlApi}/${id}`, data, {
      headers: this.getToken
    })
  }

  eliminarRespuesta(id: string): Observable<any> {
    return this.http.delete(`${urlApi}/${id}`, {
      headers: this.getToken
    })
  }

}
