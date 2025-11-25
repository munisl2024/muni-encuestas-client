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
    pagina = 1,
    itemsPorPagina = 1000000
  }): Observable<any> {
    return this.http.get(`${urlApi}`, {
      params: {
        direccion: String(direccion),
        columna,
        preguntaId,
        encuestaId,
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

}
