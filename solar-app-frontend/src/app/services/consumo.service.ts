import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConsumoService {
  private totalConsumoSubject = new BehaviorSubject<number>(0);
  totalConsumo$ = this.totalConsumoSubject.asObservable();
  
  constructor() { }

  setTotalConsumo(total: number): void {
    this.totalConsumoSubject.next(total);
  }

  getTotalConsumo(): number {
    return this.totalConsumoSubject.getValue();
  }
}
