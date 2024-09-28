import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-refresh-handler',
  templateUrl: './refresh-handler.component.html',
  styleUrls: ['./refresh-handler.component.css']
})
export class RefreshHandlerComponent {
  constructor(private router: Router) {}

  ngOnInit() {
    
    this.router.navigate(['/'], { replaceUrl: true });
  }
}
