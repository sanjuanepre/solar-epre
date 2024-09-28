import { Component } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-instrucciones',
  templateUrl: './instrucciones.component.html',
  styleUrls: ['./instrucciones.component.css']
})

export class InstruccionesComponent {
  @Input() isVisible: boolean = false;
  @Output() closed = new EventEmitter<void>();

  closeModal() {
    this.isVisible = false;
    this.closed.emit();
  }
}