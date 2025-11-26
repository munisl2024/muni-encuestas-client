import { Injectable } from '@angular/core';
import { environments } from '../../environments/environments';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const urlApi = environments.base_url + '/encuestas';

@Injectable({
  providedIn: 'root'
})
export class EncuestasService {

  // Modal Crear/Editar - Encuesta
  public abmEncuesta = {
    show: false,
    estado: 'crear',
    form: {
      titulo: '',
      descripcion: '',
    },
    encuestaSeleccionada: null,
  }

  public encuestas: any[] = [];
  public total: number = 0;

  get getToken(): any {
    return { 'Authorization': localStorage.getItem('token') }
  }

  constructor(private http: HttpClient) { }

  abrirAbm(estado: 'crear' | 'editar', encuesta: any = null): void {
    this.abmEncuesta.estado = estado;
    this.abmEncuesta.encuestaSeleccionada = encuesta;
    this.abmEncuesta.show = true;
    if(estado === 'editar'){
      this.abmEncuesta.form = {
        titulo: encuesta.titulo,
        descripcion: encuesta.descripcion,
      }
    }else{
      this.abmEncuesta.form = {
        titulo: '',
        descripcion: '',
      }
    }
  }

  obtenerEncuesta(id: string): Observable<any> {
    return this.http.get(`${urlApi}/${id}`, {
      headers: this.getToken
    })
  }

  listarEncuestas({
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

  nuevaEncuesta(data: any): Observable<any> {
    return this.http.post(urlApi, data, {
      headers: this.getToken
    })
  }

  actualizarEncuesta(id: string, data: any): Observable<any> {
    return this.http.patch(`${urlApi}/${id}`, data, {
      headers: this.getToken
    })
  }

  eliminarEncuesta(id: string): Observable<any> {
    return this.http.delete(`${urlApi}/${id}`, {
      headers: this.getToken
    })
  }

  // Obtener estadísticas de la encuesta
  obtenerEstadisticas(id: string, fechaInicio?: string, fechaFin?: string, encuestadorId?: number): Observable<any> {
    let params: any = {};
    if (fechaInicio) params.fechaInicio = fechaInicio;
    if (fechaFin) params.fechaFin = fechaFin;
    if (encuestadorId) params.encuestadorId = encuestadorId;

    return this.http.get(`${urlApi}/${id}/estadisticas`, {
      params,
      headers: this.getToken
    })
  }

  // Obtener distribución de respuestas
  obtenerDistribucion(id: string, fechaInicio?: string, fechaFin?: string, encuestadorId?: number): Observable<any> {
    let params: any = {};
    if (fechaInicio) params.fechaInicio = fechaInicio;
    if (fechaFin) params.fechaFin = fechaFin;
    if (encuestadorId) params.encuestadorId = encuestadorId;

    return this.http.get(`${urlApi}/${id}/distribucion`, {
      params,
      headers: this.getToken
    })
  }

  // Obtener reporte detallado
  obtenerReporteDetallado(id: string, fechaInicio?: string, fechaFin?: string, encuestadorId?: number): Observable<any> {
    let params: any = {};
    if (fechaInicio) params.fechaInicio = fechaInicio;
    if (fechaFin) params.fechaFin = fechaFin;
    if (encuestadorId) params.encuestadorId = encuestadorId;

    return this.http.get(`${urlApi}/${id}/reporte`, {
      params,
      headers: this.getToken
    })
  }

  // Obtener resumen completo
  obtenerResumen(id: string): Observable<any> {
    return this.http.get(`${urlApi}/${id}/resumen`, {
      headers: this.getToken
    })
  }

  // Asignar usuario a encuesta
  asignarUsuario(encuestaId: string, usuarioId: number): Observable<any> {
    return this.http.post(`${urlApi}/${encuestaId}/usuarios`, { usuarioId }, {
      headers: this.getToken
    })
  }

  // Remover usuario de encuesta
  removerUsuario(encuestaId: string, usuarioId: number): Observable<any> {
    return this.http.delete(`${urlApi}/${encuestaId}/usuarios/${usuarioId}`, {
      headers: this.getToken
    })
  }

  // Listar usuarios asignados a una encuesta
  obtenerUsuariosAsignados(encuestaId: string): Observable<any> {
    return this.http.get(`${urlApi}/${encuestaId}/usuarios`, {
      headers: this.getToken
    })
  }

  // Listar encuestas asignadas a un usuario
  obtenerEncuestasAsignadas(usuarioId: number): Observable<any> {
    return this.http.get(`${urlApi}/usuario/${usuarioId}`, {
      headers: this.getToken
    })
  }

  // Responder encuesta completa
  responderEncuesta(
    encuestaId: string,
    usuarioId: number,
    respuestas: any,
    datosPersonales?: { email: string; sigem: boolean; genero: string; telefono: string; rangoEdad: string }
  ): Observable<any> {
    return this.http.post(`${urlApi}/${encuestaId}/responder`, {
      usuarioId,
      respuestas,
      datosPersonales
    }, {
      headers: this.getToken
    })
  }

}
