import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AdvancedAlphaNumSort } from 'src/app/utils/AdvancedAlphaNumSort';

@Component({
  selector: 'app-qrscanner-dialog',
  templateUrl: './qrscanner-dialog.component.html',
  styleUrls: ['./qrscanner-dialog.component.css']
})
export class QRScannerDialogComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {workspaceID: string},
    public dialogRef: MatDialogRef<QRScannerDialogComponent>,
    private router: Router,
  ) { }

  ngOnInit(): void {
  }

  device: MediaDeviceInfo;
  cameraNum = 0;
  devices: MediaDeviceInfo[];
  scannerEnabled: boolean = true; // This is because sometimes the camera feed sometimes didn't shut off after the dialog was closed, so we delete
  scannerBooted: boolean = false; // This is to prevent the camera from loading the wrong camera then having to switch - so we first grab the right camera then turn it on
  //manualPrint: string;  // For debugging

  loadCameras(event){
    this.devices = (event as MediaDeviceInfo[]).filter(device => device.label.toLowerCase().includes('back'))
    
    // An attempt to get the main camera instead of some weird one by getting camera 0.
    .sort((elementA, elementB) => 
      AdvancedAlphaNumSort.compare(elementA.label, elementB.label)
    );

    this.scannerBooted = true;
  }

  setDefaultCamera(){
    this.device = this.devices[0];
  }

  changeCamera(){
    if(this.cameraNum + 1 >= this.devices.length){
      this.cameraNum = 0;
    }
    else {
      this.cameraNum += 1;
    }

    this.device = this.devices[this.cameraNum];
  }

  scan(event){
    let text: string = event.text;

    // Full URL
    if(text.startsWith('https://placebin.online/')){
      this.router.navigateByUrl(text.substring(24));
      this.close();
    }

    // Mini link versions
    else if(text.startsWith('/i/')){
      this.router.navigate(['/w/' + this.data.workspaceID + '/item/' + text.substring(3)]);
      this.close();
    }
    else if(text.startsWith('/l/')){
      this.router.navigate(['/w/' + this.data.workspaceID + '/search/locations/' + text.substring(3)]);
      this.close();
    }
    else if(text.startsWith('/c/')){
      this.router.navigate(['/w/' + this.data.workspaceID + '/search/category/' + text.substring(3)]);
      this.close();
    }
    else if(text.startsWith('/b/')){
      this.router.navigate(['/w/' + this.data.workspaceID + '/search/category/root'], { queryParams: { bin: text.substring(3)}});
      this.close();
    }


  }

  close(){
    this.scannerEnabled = false;
    this.dialogRef.close({wasValid: true});
  }

  cancel(){
    this.scannerEnabled = false;
    this.dialogRef.close({wasValid: false});
  }

}
