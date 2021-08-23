import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Item } from 'src/app/models/Item';
import { HierarchyLocation } from 'src/app/models/Location';

@Component({
  selector: 'app-qrcode-dialog',
  templateUrl: './qrcode-dialog.component.html',
  styleUrls: ['./qrcode-dialog.component.css']
})
export class QRCodeDialogComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {workspaceID: string, item: Item, locations: HierarchyLocation[]},
    public dialogRef: MatDialogRef<QRCodeDialogComponent>,
  ) { }

  urlToString = '';
  step = 'version';
  version = '';

  ngOnInit(): void {
  }

  isReadyForNextStep(): boolean {
    if(this.step === 'version'){
      return this.version ?  true : false;
    }

    return true;
  }

  nextStep(){
    if(this.step === 'version'){
      if(this.version === 'bin'){
        if(this.data.locations.length > 1){
          this.step = 'where';
        }
        else {
          this.setupBinQR(this.data.item.locationMetadata[this.data.locations[0].ID].binID);
          this.step = 'QR';
        }
      }
      else {
        this.setupItemQR();
        this.step = 'QR';
      }
    }
  }

  setupBinQR(binID){
    this.urlToString = 'https://placebin.online/w/' + this.data.workspaceID.replace(' ', '%20') + '/s/l/' 
    + this.data.locations[0].ID + '?bin=' + binID;
  }

  setupItemQR(){
    this.urlToString = 'https://placebin.online/w/' + this.data.workspaceID.replace(' ', '%20') + '/i/' + this.data.item.ID;
  }

  cancel(){
    this.dialogRef.close({wasValid: false});
  }

}
