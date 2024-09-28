import { Component, Input, Output, EventEmitter, ChangeDetectorRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-terminos',
  templateUrl: './terminos.component.html',
  styleUrls: ['./terminos.component.css']
})
export class TerminosComponent implements AfterViewInit {
  @Input() isVisible: boolean = false;
  @Output() accepted = new EventEmitter<boolean>();

  isTermsAccepted: boolean = false;
  isCheckboxEnabled: boolean = false;
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngAfterViewInit() {
    this.cdr.detectChanges(); 
  }

  closeModal() {
    this.isVisible = false;
    this.accepted.emit(false);
  }

  acceptTerms() {
    if (this.isTermsAccepted) {
      this.isVisible = false;
      this.accepted.emit(true);
    }
  }

  toggleAcceptButton(event: Event) {
    this.isTermsAccepted = (event.target as HTMLInputElement).checked;
  }

  onScroll(event: Event) {
    const element = event.target as HTMLElement;
    const atBottom = (element.scrollHeight - element.scrollTop <= element.clientHeight + 5); 
    
    if (atBottom) {
      this.isCheckboxEnabled = true;
    }
  }
}
