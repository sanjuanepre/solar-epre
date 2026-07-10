import { AfterViewInit, Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-tarifa-intercambio',
  templateUrl: './tarifa-intercambio.component.html',
  styleUrls: ['./tarifa-intercambio.component.css'],
})
export class TarifaIntercambioComponent implements OnInit, AfterViewInit, OnDestroy {
  tarifaIntercambioUsdkWh: number = 0;
  private sub?: Subscription;

  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {
    this.sub = this.sharedService.tarifaIntercambioUsdkWh$.subscribe((val) => {
      if (val !== null && val !== undefined && !isNaN(val)) {
        this.tarifaIntercambioUsdkWh = parseFloat(val.toFixed(3));
      } else {
        this.tarifaIntercambioUsdkWh = 0;
      }
    });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
