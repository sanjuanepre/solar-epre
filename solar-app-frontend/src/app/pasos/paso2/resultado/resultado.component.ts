import { Component, OnInit } from '@angular/core';
import { ConsumoService } from 'src/app/services/consumo.service';

@Component({
  selector: 'app-resultado',
  templateUrl: './resultado.component.html',
  styleUrls: ['./resultado.component.css']
})
export class ResultadoComponent implements OnInit {
  totalConsumo: number = 0;
  
  constructor(private consumoService: ConsumoService) {}

  ngOnInit(): void {
    this.consumoService.totalConsumo$.subscribe(total => {
      this.totalConsumo = total;
    });
  }
}
