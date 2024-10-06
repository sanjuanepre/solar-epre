import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConsumoService } from 'src/app/services/consumo.service';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-total',
  templateUrl: './total.component.html',
  styleUrls: ['./total.component.css'],
})
export class TotalComponent implements OnInit, OnDestroy {
  totalConsumo: number = 0;
  private destroy$ = new Subject<void>();

  constructor(private consumoService: ConsumoService) {}

  ngOnInit(): void {
    this.consumoService.totalConsumo$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((total) => {
        this.totalConsumo = total;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
