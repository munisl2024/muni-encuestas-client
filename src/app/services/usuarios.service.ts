import { Injectable } from '@angular/core';
import { environments } from '../../environments/environments';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

const urlApi = environments.base_url + '/usuarios';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  constructor(private http: HttpClient) { }

  // Usuario por ID
  getUsuario(id: string): Observable<any> {
    return this.http.get(`${urlApi}/${id}`, {
      headers: {
        'Authorization': localStorage.getItem('token')
      }
    }).pipe(
      map((resp: any) => resp.usuario)
    )
  }

  // Listar usuarios
  listarUsuarios(direccion: number = 1, columna: string = 'apellido'): Observable<any> {
    return this.http.get(urlApi, {
      params: {
        direccion: String(direccion),
        columna
      },
      headers: {
        'Authorization': localStorage.getItem('token')
      }
    })
  }

  // Nuevo usuario
  nuevoUsuario(data: any): Observable<any> {
    return this.http.post(urlApi, data, {
      headers: {
        'Authorization': localStorage.getItem('token')
      }
    })
  }

  // Actualizar usuario
  actualizarUsuario(id: string, data: any): Observable<any> {
    return this.http.patch(`${urlApi}/${id}`, data, {
      headers: {
        'Authorization': localStorage.getItem('token')
      }
    })
  }

  // Actualizar password - Perfil
  actualizarPasswordPefil(id: string, data: any): Observable<any> {
    return this.http.patch(`${urlApi}/password/${id}`, data, {
      headers: {
        'Authorization': localStorage.getItem('token')
      }
    })
  }

  exportarUsuarios({
    direccion = 'asc',
    columna = 'apellido',
    activo = '',
    parametro = ''
  }): Observable<any> {
    return this.http.get(`${urlApi}/excel/exportar`, {
      headers: {
        'Authorization': localStorage.getItem('token')
      },
      params: {
        direccion,
        columna,
        parametro,
        activo
      },
      responseType: 'blob',
      observe: 'response',
    });
  }

}
