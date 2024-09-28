import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-plazo',
  templateUrl: './plazo.component.html',
  styleUrls: ['./plazo.component.css'],
})
export class PlazoComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  plazoRecuperoInitial: number = 0;
  plazoRecupero: number = 0;
  yearlyEnergykWhInitial!: number;
  yearlyEnergykWh!: number;
  potenciaInstalacionInitialkW!: number;
  installationCostInitial!: number;
  factorPotencia: number = 1;
  isOutRecupero: boolean = false;
  plazoRecuperoTexto: string = '';
  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sharedService.factorPotencia$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((newFactorPotencia: number) => {
        console.log('Nuevo valor de factorPotencia recibido:', newFactorPotencia);
        this.factorPotencia = newFactorPotencia;
      });

    this.sharedService.plazoInversion$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((newPlazoRecupero) => {
        if (newPlazoRecupero < 1) {
          this.isOutRecupero = true;
          this.plazoRecuperoTexto = 'más de 20 años'; // Asignar mensaje correspondiente
          return;
        }
        this.plazoRecupero = newPlazoRecupero;
        this.plazoRecuperoTexto = this.plazoRecupero.toFixed(0); // Convertir a texto
        this.isOutRecupero = false;
      });
      
  }
  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {}

}
