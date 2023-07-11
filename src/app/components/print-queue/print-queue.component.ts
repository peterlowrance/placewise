import { style } from '@angular/animations';
import { Component, ElementRef, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface QueueItem {
  itemName: string;
  printName: boolean;
  binID: string;
  printUniversal: boolean;
}

var FILLER_DATA: QueueItem[] = [
  {itemName: "HHCS, 1/4\"-20 xs 5/8\"LG", printName: true, binID: "001-015", printUniversal: false},
  {itemName: "22-18 AWG, Power Phase, #6 Stud Red Polyolefin Sealed Crimp Locking Fork Terminal", printName: false,  binID: "001-016", printUniversal: false},
  {itemName: "Burp", printName: true,  binID: "001-017", printUniversal: false},
  {itemName: "Bonk", printName: false,  binID: "001-018", printUniversal: false},
  {itemName: "HHCS, 1/4\"-20 x 5/8\"LG", printName: false,  binID: "001-019", printUniversal: false},
  {itemName: "HHCS, 1/4\"-20 x 5/8\"LG", printName: true,  binID: "001-020", printUniversal: false},
  {itemName: "HHCS, 1/4\"-20 x 5/8\"LG", printName: true,  binID: "001-021", printUniversal: false},
  {itemName: "HHCS, 1/4\"-20 x 5/8\"LG", printName: true,  binID: "001-022", printUniversal: false},
];

@Component({
  selector: 'app-print-queue',
  templateUrl: './print-queue.component.html',
  styleUrls: ['./print-queue.component.css'],
})
export class PrintQueueComponent implements OnInit {

  itemsInQueue = FILLER_DATA;
  displayedColumns: string[] = ['itemName', 'printName', 'printBin'];
  xSpacing: number = 2.4; ySpacing: number = 3.2;
  qrFullImageSize: number;
  displayedQRSize: number;
  fontSize: number = 16;
  pageWidth: number = 8.5;
  pageHeight: number = 11;
  margins: number = 0.3;
  inputColumns: number = 4;
  calculatedColumns: number = 4;
  calculatedRows: number;
  textToPrint: string = "QR-N";
  format: string = 'vert-large';
  linkQRTo: string = 'I';

  constructor() { }

  ngOnInit(): void {
    this.calculateGrid();
  }


  calculateGrid(){

    if(this.format === 'vert-large'){
      this.xSpacing = 2.7;
      this.ySpacing = 3.6;
    }
    else if(this.format === 'vert-medium'){
      this.xSpacing = 2.2;
      this.ySpacing = 2.4;
    }
    else if(this.format === 'vert-small'){
      this.xSpacing = 1.2;
      this.ySpacing = 1.32;
    }
    else if(this.format === 'horiz-long'){
      this.xSpacing = 8;
      this.ySpacing = 1.1;
    }
    else if(this.format === 'horiz-short'){
      this.xSpacing = 5;
      this.ySpacing = 1.1;
    }

    this.calculatedColumns = Math.floor(this.inputColumns);
    if(this.calculatedColumns < 1){
      this.calculatedColumns = 1;
    }
    if(this.calculatedColumns > 1000){
      this.calculatedColumns = 1000;
    }

    this.qrFullImageSize = (this.pageWidth - (2 * this.margins))/(this.xSpacing*this.calculatedColumns);
    this.calculatedRows = Math.floor((this.pageHeight - (2 * this.margins))/(this.ySpacing*this.qrFullImageSize));
    this.displayedQRSize = Math.floor((this.qrFullImageSize*0.84)*100)/100;
    
    if(this.calculatedRows < 1){
      this.calculatedRows = 1;
    }
  }

  calculateSpacing(index: number){
    if(index % this.calculatedColumns === (this.calculatedColumns - 1)){
      return '6px';
    }
    else {
      return '2px';
    }
  }

  checkReady(){
    if(this.qrFullImageSize && this.fontSize){
      return true;
    }
    return false;
  }


  swapDimensions(){
    let widthHolder = this.pageWidth;
    this.pageWidth = this.pageHeight;
    this.pageHeight = widthHolder;

    this.calculateGrid();
  }


  printPDF(){

    let doc = new jsPDF({orientation: this.pageWidth > this.pageHeight ? 'l' : 'p', unit: 'in', format: [this.pageWidth, this.pageHeight]});
    doc.setFontSize(this.fontSize);
    
    if(this.format.startsWith('vert')){

      let calcInitialQRSpaceX = (this.pageWidth - (2*this.margins) - ((this.calculatedColumns-1) * this.xSpacing * this.qrFullImageSize) - this.qrFullImageSize)/2;
      let calcInitialQRSpaceY = (this.pageHeight - (2*this.margins) - (this.calculatedRows * this.ySpacing * this.qrFullImageSize))/2;
      if(calcInitialQRSpaceY < 0) { calcInitialQRSpaceY = 0 }
      let totalQRsPerPage = this.calculatedColumns * this.calculatedRows;

      let itemIndex = 0;
      let xIndex = 0;
      let yIndex = 0;
      for(let item of this.itemsInQueue){
        doc.addImage(this.getBase64QR(document.getElementById('qrCode' + itemIndex)), 'PNG', 
          this.margins + calcInitialQRSpaceX + (xIndex * this.xSpacing * this.qrFullImageSize),
          this.margins + calcInitialQRSpaceY + (yIndex * this.ySpacing * this.qrFullImageSize),  
          this.qrFullImageSize, this.qrFullImageSize);

        let extraTextLine = 0;
        if(this.textToPrint.includes('-B-N')){
          extraTextLine = this.fontSize * 0.02;
        }

        if(this.textToPrint.includes('-N')){
          doc.setFont("Helvetica", "");
          doc.text(item.itemName,
            this.margins + calcInitialQRSpaceX + (0.5*this.qrFullImageSize) + (xIndex * this.xSpacing * this.qrFullImageSize),
            this.margins + extraTextLine + calcInitialQRSpaceY + this.qrFullImageSize + (this.fontSize*0.015) + (yIndex * this.ySpacing * this.qrFullImageSize), 
            {
              align: 'center',
              maxWidth: Math.min(this.xSpacing*this.qrFullImageSize*0.88, 0.15*this.fontSize)
            })
        }

        if(this.textToPrint.includes('-B')){
          doc.setFont("Courier", "Bold");
          doc.text(item.binID,
            this.margins + calcInitialQRSpaceX + (0.5*this.qrFullImageSize) + (xIndex * this.xSpacing * this.qrFullImageSize),
            this.margins + calcInitialQRSpaceY + (this.qrFullImageSize*0.94) + (this.fontSize*0.015) + (yIndex * this.ySpacing * this.qrFullImageSize),
            {
              align: 'center'
            })
        }

        itemIndex++;
        if(itemIndex % totalQRsPerPage === 0 && itemIndex !== this.itemsInQueue.length){
          doc.addPage();
          xIndex = 0;
          yIndex = 0;
        }
        else {
          xIndex++;
          if(xIndex % this.calculatedColumns === 0){
            xIndex = 0;
            yIndex++;
          }

        }
      }
        
    }

    else if (this.format === 'cutting-horizontal'){

    }
    
    doc.output('dataurlnewwindow');
  }
  

  getBase64QR(qrGenerator){
    let loadAsImage = qrGenerator.querySelector("img");

    // If this has data, it's an image
    if(loadAsImage){
      return loadAsImage.src;
    }

    // If it did not have data, it's on a canvas
    else {
      return qrGenerator.querySelector("canvas").toDataURL("image/png");
    }
  }

  addTestItem(){
    this.itemsInQueue.push({itemName: "MOMMA", printName: false,  binID: "001-0XX", printUniversal: false})
  }

}
