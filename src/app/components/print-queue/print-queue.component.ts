import { Component, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import jsPDF, { jsPDFAPI } from 'jspdf';
import QRCode from 'qrcode';

export interface QueueItem {
  itemName: string;
  printName: boolean;
  printBin: boolean;
  printUniversal: boolean;
}

const FILLER_DATA: QueueItem[] = [
  {itemName: "HHCS, 1/4\"-20 xs 5/8\"LG", printName: true, printBin: false, printUniversal: false},
  {itemName: "Burp", printName: true, printBin: false, printUniversal: false},
  {itemName: "HHCS, 1/4\"-20 x 5/8\"LG", printName: false, printBin: false, printUniversal: false},
  {itemName: "Bonk", printName: false, printBin: false, printUniversal: false},
  {itemName: "HHCS, 1/4\"-20 x 5/8\"LG", printName: false, printBin: false, printUniversal: false},
  {itemName: "HHCS, 1/4\"-20 x 5/8\"LG", printName: true, printBin: false, printUniversal: false},
];

@Component({
  selector: 'app-print-queue',
  templateUrl: './print-queue.component.html',
  styleUrls: ['./print-queue.component.css'],
})
export class PrintQueueComponent implements OnInit {

  itemsInQueue = FILLER_DATA;
  displayedColumns: string[] = ['itemName', 'printName', 'printBin'];
  printColumns: number;
  orientation: string;

  constructor() { }

  ngOnInit(): void {
  }


  calculateSpacing(index: number){
    if(index % 3 === 2){
      return '6px';
    }
    else {
      return '2px';
    }
  }

  checkReady(){
    if(this.orientation && this.printColumns){
      return true;
    }
    return false;
  }

  printPDF(){
    var qrcode = new QRCode("qr_code", {
      text: "RETRN TO MONKE",
      width: 128,
      height: 128,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.Q
    });

    // This different app looks better from being able to update it with a line of code,
    // but it does not want to import properly
    // We may be able to rely on the previous one when i updates to load the next image.

    let doc = new jsPDF();
    
    doc.output('dataurlnewwindow');
  }

}
