import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  private configUrl = 'assets/env.json';
  private googleMapsApiKey: string = '';

  constructor(private http: HttpClient) {}

  loadGoogleMapsApiKey(): Observable<void> {
    return this.http.get<{ googleMapsApiKey: string }>(this.configUrl).pipe(
      map(config => {
        this.googleMapsApiKey = config.googleMapsApiKey;
      })
    );
  }

  getGoogleMapsApiKey(): string {
    return this.googleMapsApiKey;
  }
}
