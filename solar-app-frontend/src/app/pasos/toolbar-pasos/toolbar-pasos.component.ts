import { Component, Input } from '@angular/core';
import { ActivatedRoute, Route } from '@angular/router';

@Component({
  selector: 'app-toolbar-pasos',
  templateUrl: './toolbar-pasos.component.html',
  styleUrls: ['./toolbar-pasos.component.css']
})
export class ToolbarPasosComponent {

  @Input() currentStep!: number;
  
  
}



