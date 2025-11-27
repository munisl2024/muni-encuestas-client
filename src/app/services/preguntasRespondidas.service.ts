import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environments } from '../../environments/environments';

const urlApi = environments.base_url + '/preguntas-respondidas';

@Injectable({
  providedIn: 'root'
})
export class PreguntasRespondidasService {

  get getToken(): any {
    return { 'Authorization': localStorage.getItem('token') }
  }

  constructor(private http: HttpClient) { }

  obtenerPreguntaRespondida(id: string): Observable<any> {
    return this.http.get(`${urlApi}/${id}`, {
      headers: this.getToken
    })
  }

  listarPreguntasRespondidas({
    direccion = 'desc',
    columna = 'id',
    preguntaId = '',
    encuestaId = '',
    encuestadorId = '',
    creatorUserId = '',
    pagina = 1,
    itemsPorPagina = 1000000
  }): Observable<any> {
    return this.http.get(`${urlApi}`, {
      params: {
        direccion: String(direccion),
        columna,
        preguntaId,
        encuestaId,
        encuestadorId,
        creatorUserId,
        pagina,
        itemsPorPagina
      },
      headers: this.getToken
    })
  }

  nuevaPreguntaRespondida(data: any): Observable<any> {
    return this.http.post(`${urlApi}`, data, {
      headers: this.getToken
    })
  }

  actualizarPreguntaRespondida(id: string, data: any): Observable<any> {
    return this.http.patch(`${urlApi}/${id}`, data, {
      headers: this.getToken
    })
  }

  eliminarPreguntaRespondida(id: string): Observable<any> {
    return this.http.delete(`${urlApi}/${id}`, {
      headers: this.getToken
    })
  }

  /**
   * Obtiene respuestas agrupadas por sesión de encuesta
   * Optimizado con paginación
   */
  obtenerRespuestasAgrupadas(
    encuestaId: string | number,
    pagina: number = 1,
    itemsPorPagina: number = 10,
    creatorUserId?: number,
    genero?: string,
    sigem?: boolean,
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<any> {
    let params: any = {
      pagina: pagina.toString(),
      itemsPorPagina: itemsPorPagina.toString()
    };

    if (creatorUserId) {
      params.creatorUserId = creatorUserId.toString();
    }

    if (genero) {
      params.genero = genero;
    }

    if (sigem !== undefined) {
      params.sigem = sigem.toString();
    }

    if (fechaInicio) {
      params.fechaInicio = fechaInicio;
    }

    if (fechaFin) {
      params.fechaFin = fechaFin;
    }

    return this.http.get(`${urlApi}/agrupadas/${encuestaId}`, {
      params,
      headers: this.getToken
    })
  }

  /**
   * Obtiene lista de encuestadores que han respondido una encuesta
   */
  obtenerEncuestadores(encuestaId: string | number): Observable<any> {
    return this.http.get(`${urlApi}/encuestadores/${encuestaId}`, {
      headers: this.getToken
    })
  }

}
