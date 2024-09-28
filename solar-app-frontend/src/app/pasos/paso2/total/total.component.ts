import { Component, OnInit } from '@angular/core';
import { ConsumoService } from 'src/app/services/consumo.service';

@Component({
  selector: 'app-total',
  templateUrl: './total.component.html',
  styleUrls: ['./total.component.css']
})
export class TotalComponent implements OnInit {
  totalConsumo: number = 0;
  
  constructor(private consumoService: ConsumoService) {}

  ngOnInit(): void {
    this.consumoService.totalConsumo$.subscribe(total => {
      this.totalConsumo = total;
    });
  }
}
