import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [

  // Default
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },

  // Login
  {
    path: 'login',
    title: 'Login',
    loadComponent: () => import('./auth/login/login.component'),
  },

  // Public - Encuestas disponibles
  {
    path: 'public/encuestas-disponibles',
    title: 'Encuestas Disponibles',
    loadComponent: () => import('./pages/public/encuestas-disponibles/encuestas-disponibles.component'),
    canActivate: [ AuthGuard ],
  },

  // Public - Encuesta
  {
    path: 'public/encuesta/:id',
    title: 'Encuesta',
    loadComponent: () => import('./pages/public/encuesta/encuesta.component'),
    canActivate: [ AuthGuard ],
  },

  // Inicializacion
  {
    path: 'init',
    title: 'Inicializacion',
    loadComponent: () => import('./inicializacion/inicializacion.component'),
  },

  // Dashboard
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/pages.component'),
    canActivate: [ AuthGuard ],
    children: [

      // Home
      {
        path: 'home',
        title: 'Inicio',
        loadComponent: () => import('./pages/home/home.component'),
      },

      // Perfil
      {
        path: 'perfil',
        title: 'Perfil',
        loadComponent: () => import('./pages/perfil/perfil.component'),
      },

      // Usuarios

      {
        path: 'usuarios',
        title: 'Usuarios',
        loadComponent: () => import('./pages/usuarios/usuarios.component'),
      },

      {
        path: 'usuarios/nuevo',
        title: 'Nuevo usuario',
        loadComponent: () => import('./pages/usuarios/nuevo-usuario/nuevo-usuario.component'),
      },

      {
        path: 'usuarios/editar/:id',
        title: 'Editar usuario',
        loadComponent: () => import('./pages/usuarios/editar-usuario/editar-usuario.component'),
      },

      {
        path: 'usuarios/password/:id',
        title: 'Editar password',
        loadComponent: () => import('./pages/usuarios/editar-password/editar-password.component'),
      },

      // Encuestas
      {
        path: 'encuestas',
        title: 'Encuestas',
        loadComponent: () => import('./pages/encuestas/encuestas.component'),
      },

      {
        path: 'encuestas/detalles/:id',
        title: 'Detalles de encuesta',
        loadComponent: () => import('./pages/encuestas/detallesEncuestas/detallesEncuestas.component'),
      },

      // Reportes
      {
        path: 'reportes/encuesta/:id',
        title: 'Reportes',
        loadComponent: () => import('./pages/reportes/reportes.component'),
      },

      // Barrios

      {
        path: 'barrios',
        title: 'Barrios',
        loadComponent: () => import('./pages/barrios/barrios.component'),
      },

      {
        path: 'barrios/crear',
        title: 'Nuevo barrio',
        loadComponent: () => import('./pages/barrios/crearBarrio/crearBarrio.component'),
      },

      {
        path: 'barrios/detalles/:id',
        title: 'Detalles barrio',
        loadComponent: () => import('./pages/barrios/detallesBarrio/detallesBarrio.component'),
      },

      {
        path: 'barrios/geolocalizacion',
        title: 'Geolocalización',
        loadComponent: () => import('./pages/barrios/geolocalizacionBarrios/geolocalizacionBarrios.component'),
      },

    ]
  },

  // Error Page
  {
    path: '**',
    title: 'Error',
    loadComponent: () => import('./error-page/error-page.component'),
  },

];
