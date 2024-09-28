import { AfterViewInit, Component, OnInit } from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-tarifa-intercambio',
  templateUrl: './tarifa-intercambio.component.html',
  styleUrls: ['./tarifa-intercambio.component.css'],
})
export class TarifaIntercambioComponent implements OnInit, AfterViewInit {
  tarifaIntercambioUsdkWh!: number;

  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.tarifaIntercambioUsdkWh = parseFloat(
        this.sharedService.getTarifaIntercambioUsdkWh().toFixed(3)
      );
    }, 300);
  }

  ngAfterViewInit(): void {}
}
