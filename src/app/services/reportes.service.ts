import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../environments/environments';

const urlApi = environments.base_url + '/reportes';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  get getToken(): any {
    return { 'Authorization': localStorage.getItem('token') }
  }

  constructor(private http: HttpClient) { }

  /**
   * Obtiene estadísticas completas de una encuesta
   * @param id ID de la encuesta
   * @param fechaInicio Fecha inicio (YYYY-MM-DD) - opcional
   * @param fechaFin Fecha fin (YYYY-MM-DD) - opcional
   * @returns Observable con:
   *  - estadisticasGenerales: totales, tasas, promedios
   *  - distribucionPreguntas: votos y porcentajes por pregunta/respuesta
   *  - datosdemograficos: edad, género, barrios, SIGEM
   *  - tendenciaTemporal: respuestas por día y por hora
   */
  obtenerEstadisticasCompletas(
    id: string | number,
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<any> {
    let params: any = {};
    if (fechaInicio) params.fechaInicio = fechaInicio;
    if (fechaFin) params.fechaFin = fechaFin;

    return this.http.get(`${urlApi}/encuesta/${id}/completo`, {
      params,
      headers: this.getToken
    });
  }

  /**
   * Obtiene resumen ejecutivo de una encuesta
   * @param id ID de la encuesta
   * @returns Observable con métricas principales (sin filtros de fecha)
   *  - totalRespuestas
   *  - totalPreguntas
   *  - totalParticipantes
   */
  obtenerResumenEjecutivo(id: string | number): Observable<any> {
    return this.http.get(`${urlApi}/encuesta/${id}/resumen`, {
      headers: this.getToken
    });
  }
}
