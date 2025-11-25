import { Pipe, PipeTransform } from '@angular/core';
import { format } from 'date-fns';

@Pipe({
  standalone: true,
  name: 'fecha'
})
export class FechaPipe implements PipeTransform {
  transform(fecha: any): string {
    return format(new Date(fecha), 'dd/MM/yyyy') === '01/01/1970' ? 'SIN ESPECIFICAR' : format(new Date(fecha), 'dd/MM/yyyy')
  }
}
