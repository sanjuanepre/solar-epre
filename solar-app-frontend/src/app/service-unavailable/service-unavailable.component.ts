import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-service-unavailable',
  templateUrl: './service-unavailable.component.html',
  styleUrls: ['./service-unavailable.component.css']
})
export class ServiceUnavailableComponent {
  constructor(private router: Router) {}
  
  volverAlInicio() {
    this.router.navigate(['/'], { replaceUrl: true })
  }
}
