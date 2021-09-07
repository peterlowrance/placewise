import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HierarchyLocation } from 'src/app/models/Location';

@Component({
  selector: 'app-qrcode-category-dialog',
  templateUrl: './qrcode-category-dialog.component.html',
  styleUrls: ['./qrcode-category-dialog.component.css']
})
export class QRCodeCategoryDialogComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {workspaceID: string, category: HierarchyLocation},
    public dialogRef: MatDialogRef<QRCodeCategoryDialogComponent>,
  ) { }

  urlToString = '';

  ngOnInit(): void {
    this.setupCategoryQR();
  }

  setupCategoryQR(){
    this.urlToString = '/c/' + this.data.category.ID;
  }

  setupUniversalCategoryQR(){
    this.urlToString = 'https://placebin.online/w/' + this.data.workspaceID.replace(' ', '%20') + '/s/c/' + this.data.category.ID;
  }

  toggleUniversalQR(event){
    if(event.checked){ // If we are using universal QR
      this.setupUniversalCategoryQR();
    }
    else {
      this.setupCategoryQR();
    }
  }

  cancel(){
    this.dialogRef.close({wasValid: false});
  }

}
