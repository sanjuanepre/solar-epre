import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MapService } from '../services/map.service';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css'],
})
export class MapaComponent implements OnInit, AfterViewInit {
  @ViewChild('mapElement') mapElement!: ElementRef;

  constructor(private mapService: MapService) {}

  ngOnInit(): void {}

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.mapService.initializeMap(this.mapElement.nativeElement);
    } catch (error) {
      console.error('Error initializing the map:', error);
    }
  }
}
