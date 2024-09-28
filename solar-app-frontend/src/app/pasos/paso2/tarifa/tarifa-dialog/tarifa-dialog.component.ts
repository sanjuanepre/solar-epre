import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-tarifa-dialog',
  templateUrl: './tarifa-dialog.component.html',
  styleUrls: ['./tarifa-dialog.component.css']
})
export class TarifaDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<TarifaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      potenciaInstalada: number,
      potenciaMaxAsignada: number,
      tarifaContratada: string
    }
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
