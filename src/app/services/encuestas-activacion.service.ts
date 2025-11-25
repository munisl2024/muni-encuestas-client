import { Injectable } from '@angular/core';
import { environments } from '../../environments/environments';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const urlApi = environments.base_url + '/encuestas-activacion';

@Injectable({
  providedIn: 'root'
})
export class EncuestasActivacionService {

  get getToken(): any {
    return { 'Authorization': localStorage.getItem('token') }
  }

  constructor(private http: HttpClient) { }

  // Obtener programaciones de una encuesta
  obtenerPorEncuesta(encuestaId: string): Observable<any> {
    return this.http.get(`${urlApi}/encuesta/${encuestaId}`, {
      headers: this.getToken
    })
  }

  // Obtener programación por ID
  obtenerProgramacion(id: string): Observable<any> {
    return this.http.get(`${urlApi}/${id}`, {
      headers: this.getToken
    })
  }

  // Crear programación
  nuevaProgramacion(data: any): Observable<any> {
    return this.http.post(urlApi, data, {
      headers: this.getToken
    })
  }

  // Actualizar programación
  actualizarProgramacion(id: string, data: any): Observable<any> {
    return this.http.patch(`${urlApi}/${id}`, data, {
      headers: this.getToken
    })
  }

  // Eliminar programación
  eliminarProgramacion(id: string): Observable<any> {
    return this.http.delete(`${urlApi}/${id}`, {
      headers: this.getToken
    })
  }

  // Verificar estados manualmente
  verificarAhora(): Observable<any> {
    return this.http.post(`${urlApi}/verificar`, {}, {
      headers: this.getToken
    })
  }

}
