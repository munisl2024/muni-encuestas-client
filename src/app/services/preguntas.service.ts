import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environments } from '../../environments/environments';

const urlApi = environments.base_url + '/preguntas';

@Injectable({
  providedIn: 'root'
})
export class PreguntasService {

  // Modal Crear/Editar - Pregunta
  public abmPregunta = {
    show: false,
    estado: 'crear',
    form: {
      descripcion: '',
      multiplesRespuestas: false,
      respuestas: [
        {
          descripcion: '',
        },
        {
          descripcion: '',
        }
      ]
    },
    preguntaSeleccionada: null,
    encuestaSeleccionada: null,
  }

  public preguntas: any[] = [];
  public total: number = 0;

  get getToken(): any {
    return { 'Authorization': localStorage.getItem('token') }
  }

  constructor(private http: HttpClient) { }

  abrirAbm(estado: 'crear' | 'editar', pregunta: any = null, encuestaId: any = null): void {
    this.abmPregunta.estado = estado;
    this.abmPregunta.preguntaSeleccionada = pregunta;
    this.abmPregunta.encuestaSeleccionada = encuestaId;
    this.abmPregunta.show = true;
    if(estado === 'editar'){
      this.abmPregunta.form = {
        descripcion: pregunta.descripcion,
        multiplesRespuestas: pregunta.multiplesRespuestas || false,
        respuestas: []
      }

      // Se agregan las respuestas de la pregunta seleccionada
      this.abmPregunta.form.respuestas = pregunta.Respuestas.map((respuesta: any) => ({
        descripcion: respuesta.descripcion,
        id: respuesta.id
      }));

    }else{
      this.abmPregunta.form = {
        descripcion: '',
        multiplesRespuestas: false,
        respuestas: [
          {
            descripcion: '',
          },
          {
            descripcion: '',
          }
        ]
      }
    }
  }

  obtenerPregunta(id: string): Observable<any> {
    return this.http.get(`${urlApi}/${id}`, {
      headers: this.getToken
    })
  }

  listarPreguntas({
    direccion = 'desc',
    columna = 'id',
    parametro = '',
    pagina = 1,
    itemsPorPagina = 1000000,
    activo = 'true'
  }): Observable<any> {
    return this.http.get(urlApi, {
      params: {
        direccion: String(direccion),
        columna,
        parametro,
        pagina,
        itemsPorPagina,
        activo
      },
      headers: this.getToken
    })
  }

  nuevaPregunta(data: any): Observable<any> {
    return this.http.post(urlApi, data, {
      headers: this.getToken
    })
  }

  actualizarPregunta(id: string, data: any): Observable<any> {
    return this.http.patch(`${urlApi}/${id}`, data, {
      headers: this.getToken
    })
  }

  eliminarPregunta(id: string): Observable<any> {
    return this.http.delete(`${urlApi}/${id}`, {
      headers: this.getToken
    })
  }

  activarPregunta(id: string): Observable<any> {
    return this.http.patch(`${urlApi}/${id}/activar`, {}, {
      headers: this.getToken
    })
  }

  activarRespuesta(id: number): Observable<any> {
    return this.http.patch(`${urlApi}/respuesta/${id}/activar`, {}, {
      headers: this.getToken
    })
  }

  desactivarRespuesta(id: number): Observable<any> {
    return this.http.patch(`${urlApi}/respuesta/${id}/desactivar`, {}, {
      headers: this.getToken
    })
  }

  reordenarPregunta(id: number, direccion: 'arriba' | 'abajo'): Observable<any> {
    return this.http.patch(`${urlApi}/${id}/reordenar`, { direccion }, {
      headers: this.getToken
    })
  }

  reordenarRespuesta(id: number, direccion: 'arriba' | 'abajo'): Observable<any> {
    return this.http.patch(`${urlApi}/respuesta/${id}/reordenar`, { direccion }, {
      headers: this.getToken
    })
  }

}
