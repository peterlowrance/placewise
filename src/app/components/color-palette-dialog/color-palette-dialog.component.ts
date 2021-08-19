import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-color-palette-dialog',
  templateUrl: './color-palette-dialog.component.html',
  styleUrls: ['./color-palette-dialog.component.css']
})
export class ColorPaletteDialogComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {colorOptions: string[]},
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<ColorPaletteDialogComponent>
  ) { }

  colorOptions: string[];

  ngOnInit(): void {
    if(this.data){
      this.colorOptions = this.data.colorOptions;
    }
    else {
      this.colorOptions = [
        "#ffffff", "#c8c8c8", "#ff7777",
        "#ffaa66", "#ffff66", "#88ff88", 
        "#66ffe0", "#c7e2ff", "#2255ff", 
        "#bb44ff", "#ffbbdd", "#b08e6a",
      ];
    }
  }

  pickColor(color: string){
    this.dialogRef.close({wasValid: true, data: color});
  }

  cancel(){
    this.dialogRef.close({wasValid: false});
  }

}
