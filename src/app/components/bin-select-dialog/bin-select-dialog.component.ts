import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-bin-select-dialog',
  templateUrl: './bin-select-dialog.component.html',
  styleUrls: ['./bin-select-dialog.component.css']
})
export class BinSelectDialogComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { binData: {binID: string, locationName: string}[] },
    public dialogRef: MatDialogRef<BinSelectDialogComponent>
  ) { }

  ngOnInit(): void {
  }

  selectBin(result: string){
    this.dialogRef.close(result);
  }

}
