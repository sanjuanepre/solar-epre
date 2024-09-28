import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { MesesConsumo } from 'src/app/interfaces/mesesConsumo';
import { ResultadoCalculo } from 'src/app/interfaces/resultado-calculo';
import { ConsumoService } from 'src/app/services/consumo.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-consumo',
  templateUrl: './consumo.component.html',
  styleUrls: ['./consumo.component.css'],
})
export class ConsumoComponent implements OnInit {
  private destroy$ = new Subject<void>();
  @Output() allFieldsCompleted = new EventEmitter<boolean>();
  allCompleted: boolean = false;
  @Input() isDisabled: boolean = true;
  @Input() isEditable: boolean = false;
  @ViewChild('consumoContainer') consumoContainer!: ElementRef;

  meses: MesesConsumo[] = [
    { numero: 1, consumo: null, completado: false },
    { numero: 2, consumo: null, completado: false },
    { numero: 3, consumo: null, completado: false },
    { numero: 4, consumo: null, completado: false },
    { numero: 5, consumo: null, completado: false },
    { numero: 6, consumo: null, completado: false },
    { numero: 7, consumo: null, completado: false },
    { numero: 8, consumo: null, completado: false },
    { numero: 9, consumo: null, completado: false },
    { numero: 10, consumo: null, completado: false },
    { numero: 11, consumo: null, completado: false },
    { numero: 12, consumo: null, completado: false },
  ];
  resultado: ResultadoCalculo | null = null;
  totalConsumo: number = 0;
  subscription: Subscription;
  driverObj: any;
  tutorialShown: any;

  constructor(
    private consumoService: ConsumoService,
    private sharedService: SharedService
  ) {
    this.subscription = this.sharedService.consumosMensuales$
      .pipe(takeUntil(this.destroy$))
      .subscribe((consumos: number[]) => {
        this.updateConsumosMensuales(consumos);
      });
  }

  ngOnInit(): void {
    this.resetMesesConsumo();
  }

  ngAfterViewInit(): void {}
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  focusFirstInput(): void {
    setTimeout(() => {
      const firstInput = document.getElementById(`input-0`) as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 0);
  }

  focusNextInput(event: any, index: number): void {
    event.preventDefault();

    if (index < this.meses.length) {
      const nextInput = document.getElementById(
        `input-${index}`
      ) as HTMLInputElement;
      if (nextInput) {
        nextInput.disabled = false;
        nextInput.focus();
      }
    }
  }

  esMesCompletado(mes: MesesConsumo): boolean {
    return mes.consumo !== null;
  }

  calcularTotalConsumo(): void {
    const totalConsumo = this.meses.reduce(
      (sum, mes) => sum + (mes.consumo || 0),
      0
    );
    this.consumoService.setTotalConsumo(totalConsumo);
    this.checkAllFieldsCompleted();
    if (this.allCompleted) {
      this.consumoService.setTotalConsumo(totalConsumo);
    }
  }

  checkAllFieldsCompleted(): void {
    this.allCompleted = this.meses.every((mes) => mes.consumo !== null);
    this.allFieldsCompleted.emit(this.allCompleted);
  }

  onConsumoChange(): void {
    this.meses.forEach((mes) => {
      if (mes.consumo && mes.consumo < 0) {
        mes.consumo = null;
      }
    });
    this.calcularTotalConsumo();
  }

  preventInvalidInput(event: KeyboardEvent): void {
    if (
      !/[0-9]/.test(event.key) &&
      event.key !== 'Backspace' &&
      event.key !== 'Tab'
    ) {
      event.preventDefault();
    }
  }

  updateConsumosMensuales(consumos: number[]): void {
    this.meses.forEach((mes, index) => {
      mes.consumo = consumos[index] || null;
      mes.completado = consumos[index] !== null;
    });
    this.calcularTotalConsumo();
  }

  resetMesesConsumo(): void {
    this.meses.forEach((mes) => {
      mes.consumo = null;
      mes.completado = false;
    });
    this.allCompleted = false;
    this.allFieldsCompleted.emit(this.allCompleted);
    this.calcularTotalConsumo();
  }

  clearPresetValues(): void {
    this.meses.forEach((mes) => {
      mes.consumo = null;
      mes.completado = false;
    });
    this.allCompleted = false;
    this.allFieldsCompleted.emit(this.allCompleted);
  }

  startTutorial() {
    setTimeout(() => {
      this.driverObj.drive();
    }, 50);
  }
}
