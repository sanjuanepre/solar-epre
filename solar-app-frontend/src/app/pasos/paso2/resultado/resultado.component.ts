import { Component, OnInit, OnDestroy } from '@angular/core';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { ConsumoService } from 'src/app/services/consumo.service';

@Component({
  selector: 'app-resultado',
  templateUrl: './resultado.component.html',
  styleUrls: ['./resultado.component.css'],
})
export class ResultadoComponent implements OnInit, OnDestroy {
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
