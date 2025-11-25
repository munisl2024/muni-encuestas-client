import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { HttpClientModule } from '@angular/common/http';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { provideToastr } from 'ngx-toastr';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-bottom-right',
      // closeButton: true,
      toastClass: 'toast-enter',
      // preventDuplicates: true,
    }),
    importProvidersFrom(
      FormsModule,
      HttpClientModule,
      FormBuilder,
      ReactiveFormsModule,
      CommonModule,
      NgxPaginationModule
    )
  ]
};
