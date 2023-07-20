import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import jsPDF from 'jspdf';
import { PrintItem } from 'src/app/models/PrintItem';
import { SimpleFieldDialogComponent } from '../simple-field-dialog/simple-field-dialog.component';
import { PrintService } from 'src/app/services/print.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { QRCodeEncoder, QRCodeWriter } from '@zxing/library';
import ErrorCorrectionLevel from '@zxing/library/esm/core/qrcode/decoder/ErrorCorrectionLevel';
import { BrowserQRCodeSvgWriter } from '@zxing/browser';

@Component({
  selector: 'app-print-queue',
  templateUrl: './print-queue.component.html',
  styleUrls: ['./print-queue.component.css'],
})
export class PrintQueueComponent implements OnInit {

  itemsInQueue: PrintItem[] = [];
  displayedColumns: string[] = ['itemName', 'printName', 'printBin'];
  xSpacing: number = 2.4; ySpacing: number = 3.2;
  qrSize: number = 0.68;
  qrFullImageSize: number;
  overrideFontSize: number;
  calculatedFontSize: number = 14;
  fontMultiplier: number;
  pageWidth: number = 8.5;
  pageHeight: number = 11;
  margins: number = 0.25;
  calculatedColumns: number;
  calculatedRows: number;
  textToPrint: string = "QR-N";
  format: string = 'vert-large';
  linkQRTo: string = 'I';
  workspaceID: string;

  constructor(
    public dialog: MatDialog, 
    private printService: PrintService, 
    private authService: AuthService,
    private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.workspaceID = this.route.snapshot.paramMap.get('workspaceID');

    this.calculateGrid();
    this.updateFontSize();
    this.loadQueue();
  }


  loadQueue(){
    this.authService.getUser().subscribe(user => {
      if(user){
        this.printService.loadItemsInQueue(this.workspaceID, user.id).then(items => {
          this.itemsInQueue = items;
          this.setupTextForQRs();
        })
      }
    })
  }


  setupTextForQRs(){
    for(let printItem of this.itemsInQueue){
      printItem.QRtext = '/' + printItem.type + '/' + printItem.ID;
    }
  }


  calculateGrid(){
    this.qrFullImageSize = this.qrSize * 1.2;

    if(this.format === 'vert-large'){
      this.xSpacing = 2.4;
      this.ySpacing = 3.2;
      this.fontMultiplier = 200;
    }
    else if(this.format === 'vert-medium'){
      this.xSpacing = 2;
      this.ySpacing = 2.4;
      this.fontMultiplier = 160;
    }
    else if(this.format === 'vert-small'){
      this.xSpacing = 1.2;
      this.ySpacing = 1.32;
      this.fontMultiplier = 160;
    }
    else if(this.format === 'horiz-long'){
      this.xSpacing = 9.6;
      this.ySpacing = 1.1;
      this.fontMultiplier = 220;
    }
    else if(this.format === 'horiz-medium'){
      this.xSpacing = 6.4;
      this.ySpacing = 1.1;
      this.fontMultiplier = 200;
    }
    else if(this.format === 'horiz-short'){
      this.xSpacing = 4.8;
      this.ySpacing = 1.1;
      this.fontMultiplier = 200;
    }

    this.calculatedColumns = Math.floor((this.pageWidth - (2 * this.margins))/(this.xSpacing*this.qrFullImageSize));
    this.calculatedRows = Math.floor((this.pageHeight - (2 * this.margins))/(this.ySpacing*this.qrFullImageSize));

    if(this.calculatedColumns < 1){
      this.calculatedColumns = 1;
    }
    if(this.calculatedRows < 1){
      this.calculatedRows = 1;
    }

    this.updateFontSize();
  }


  updateFontSize(){
    if(this.overrideFontSize){
      this.calculatedFontSize = this.overrideFontSize;
    }
    else {
      this.calculatedFontSize = Math.floor(this.fontMultiplier * this.qrSize)/10;
    }
  }


  calculateSpacing(index: number){
    let totalPerPage = this.calculatedColumns * this.calculatedRows;
    if(index % totalPerPage === (totalPerPage - 1)){
      return '18px';
    }
    else if(index % this.calculatedColumns === (this.calculatedColumns - 1)){
      return '6px';
    }
    else {
      return '2px';
    }
  }

  checkReady(){
    if(this.qrSize && this.calculatedFontSize){
      return true;
    }
    return false;
  }

  editDisplayName(index: number){
    this.dialog.open(SimpleFieldDialogComponent, {
      width: '300px',
      data: {fieldName: 'Name:', value: this.itemsInQueue[index].displayName, description: 'Change the text to override the normal name.'}
    }).beforeClosed().subscribe(result => {
      if(result && result.wasValid){
        console.log(result.value);
        this.itemsInQueue[index].displayName = result.value;
      }
    });
  }

  removeItem(index: number){
    this.itemsInQueue.splice(index, 1);
  }
  

  drop(event: CdkDragDrop<string[]>){
    moveItemInArray(this.itemsInQueue, event.previousIndex, event.currentIndex);
  }


  swapDimensions(){
    let widthHolder = this.pageWidth;
    this.pageWidth = this.pageHeight;
    this.pageHeight = widthHolder;

    this.calculateGrid();
  }


  printPDF(){

    let codeWriter = new BrowserQRCodeSvgWriter();
    let serializer = new XMLSerializer();
    let doc = new jsPDF({orientation: this.pageWidth > this.pageHeight ? 'l' : 'p', unit: 'in', format: [this.pageWidth, this.pageHeight]});
    doc.setFontSize(this.calculatedFontSize);
    let totalQRsPerPage = this.calculatedColumns * this.calculatedRows;
    
    if(this.format.startsWith('vert')){
      let calcInitialQRSpaceX = (this.pageWidth - (2*this.margins) - ((this.calculatedColumns-1) * this.xSpacing * this.qrFullImageSize) - this.qrFullImageSize)/2;
      let calcInitialQRSpaceY = (this.pageHeight - (2*this.margins) - (this.calculatedRows * this.ySpacing * this.qrFullImageSize))/2;
      if(calcInitialQRSpaceY < 0) { calcInitialQRSpaceY = 0 }

      let itemIndex = 0;
      let xIndex = 0;
      let yIndex = 0;
      for(let item of this.itemsInQueue){
        console.log(codeWriter.write(item.QRtext, 300, 300));
        //doc.addImage(codeWriter.write(item.QRtext, 300, 300),
        //  this.margins + calcInitialQRSpaceX + (xIndex * this.xSpacing * this.qrFullImageSize),
        //  this.margins + calcInitialQRSpaceY + (yIndex * this.ySpacing * this.qrFullImageSize),  
        //  this.qrFullImageSize, this.qrFullImageSize);

        let extraTextLine = 0;
        if(this.textToPrint.includes('-B-N')){
          extraTextLine = this.calculatedFontSize * 0.02;
        }

        if(this.textToPrint.includes('-N')){
          doc.setFont("Helvetica", "");
          doc.text(item.displayName,
            this.margins + calcInitialQRSpaceX + (0.5*this.qrFullImageSize) + (xIndex * this.xSpacing * this.qrFullImageSize),
            this.margins + extraTextLine + calcInitialQRSpaceY + this.qrFullImageSize + (this.calculatedFontSize*0.015) + (yIndex * this.ySpacing * this.qrFullImageSize), 
            {
              align: 'center',
              maxWidth: Math.min(this.xSpacing*this.qrSize*1.08, 0.15*this.calculatedFontSize)
            })
        }

        if(this.textToPrint.includes('-B')){
          doc.setFont("Courier", "Bold");
          doc.text(item.binID,
            this.margins + calcInitialQRSpaceX + (0.5*this.qrFullImageSize) + (xIndex * this.xSpacing * this.qrFullImageSize),
            this.margins + calcInitialQRSpaceY + (this.qrFullImageSize*0.94) + (this.calculatedFontSize*0.015) + (yIndex * this.ySpacing * this.qrFullImageSize),
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

    else {
      let itemIndex = 0;
      let xIndex = 0;
      let yIndex = 0;
      for(let item of this.itemsInQueue){
        doc.addImage(this.getBase64QR(document.getElementById('qrCode' + itemIndex)), 'PNG', 
          this.margins + (xIndex * this.xSpacing * this.qrFullImageSize),
          this.margins + (yIndex * this.ySpacing * this.qrFullImageSize),  
          this.qrFullImageSize, this.qrFullImageSize);

        let extraTextLine = 0;
        if(this.textToPrint.includes('-B-N')){
          extraTextLine = this.calculatedFontSize * 0.013;
        }

        if(this.textToPrint.includes('-N')){
          doc.setFont("Helvetica", "");
          doc.text(item.displayName,
            this.margins + (1.1*this.qrFullImageSize) + (xIndex * this.xSpacing * this.qrFullImageSize),
            this.margins + extraTextLine + (this.qrFullImageSize*0.5) - (this.calculatedFontSize * 0.018) + (yIndex * this.ySpacing * this.qrFullImageSize), 
            {
              baseline: 'top',
              maxWidth: this.xSpacing*this.qrSize*0.9
            })
        }

        if(this.textToPrint.includes('-B')){
          doc.setFont("Courier", "Bold");
          doc.text(item.binID,
            this.margins + (1.1*this.qrFullImageSize) + (xIndex * this.xSpacing * this.qrFullImageSize),
            this.margins + (this.qrFullImageSize*0.06) + (yIndex * this.ySpacing * this.qrFullImageSize),
            {
              baseline: 'top'
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
    this.itemsInQueue.push({displayName: "MOMMA", binID: "001-0XX", ID: 'o8WKvkebo46rfmNnNmQY', type: 'i'})
  }

}
