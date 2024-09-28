import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customNumber'
})
export class CustomNumberPipe implements PipeTransform {

  transform(value: number): string {
    if (isNaN(value)) {
      return '';
    }

    // Convertir el número en una cadena utilizando el formato con puntos y comas.
    return value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

}
