import { Injectable } from '@angular/core';
import { environments } from '../../environments/environments';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { UsuarioOnline } from '../models/UsuarioOnline.model';

const baseUrl = environments.base_url;

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Informacion de usuario logueado
  public usuario: any;
  public isAdmin: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  // Login de usuario
  login(data: any): Observable<any> {
    return this.http.post(`${baseUrl}/auth/login`, data)
      .pipe(
        tap(({ token }) => {
          const tokenSend = 'bearer ' + token;
          localStorage.setItem('token', tokenSend);
        })
      )
  }

  // Cerrar sesion
  logout(): void {
    localStorage.removeItem('token');
    this.router.navigateByUrl('login');
  }

  // Validar token
  validarToken(): Observable<any> {

    // Se obtiene el token desde el localstorage
    const token = localStorage.getItem('token');
    return this.http.get(`${baseUrl}/auth/profile`, {
      headers: { Authorization: token }
    }).pipe(
      map((resp: any) => {
        const { userId, usuario, apellido, nombre, role } = resp.usuario;
        this.usuario = new UsuarioOnline(userId, usuario, nombre, apellido, role);
        this.isAdmin = role === 'ADMIN_ROLE';
        // this.definicionPermisos();
        localStorage.setItem('token', resp.token);
        return true;
      }),
      catchError(error => of(false)) // el of permite devolver un observable<boolean>(false)
    );

  }

  // Devuelve "true" si es ADMIN o "false" si no lo es
  validarAdmin(): Observable<boolean> {
    const token = localStorage.getItem('token');
    return this.http.get(`${baseUrl}/auth/profile`, { headers: { 'Authorization': token } }).pipe(
      map((resp: any) => {
        if (resp.usuario.role === 'ADMIN_ROLE') {
          return true;
        } else {
          return false;
        }
      })
    );
  }

  // Proteccion de login
  proteccionLogin(): Observable<boolean> {
    const token = localStorage.getItem('token');
    return this.http.get(`${baseUrl}/auth`, {
      headers: { 'x-token': token }
    }).pipe(
      map(() => {
        return false;
      }),
      catchError(error => of(true))
    );
  }

}
