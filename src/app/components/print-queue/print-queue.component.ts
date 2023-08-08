import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import jsPDF from 'jspdf';
import { PrintItem } from 'src/app/models/PrintItem';
import { SimpleFieldDialogComponent } from '../simple-field-dialog/simple-field-dialog.component';
import { PrintService } from 'src/app/services/print.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { QRCodeComponent, QRCodeElementType, QRCodeModule } from 'angularx-qrcode';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators'
import { SearchService } from 'src/app/services/search.service';
import { ConfirmComponent } from '../confirm/confirm.component';

@Component({
  selector: 'app-print-queue',
  templateUrl: './print-queue.component.html',
  styleUrls: ['./print-queue.component.css'],
})
export class PrintQueueComponent implements OnInit {
  @ViewChild("binInputExt") binInputExt: ElementRef;
  @ViewChild("binInput") binInput: ElementRef;
  @ViewChild("shelfInput") shelfInput: ElementRef;

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
  linkQRTo: string;
  workspaceID: string;
  doubleBackspace = false;
  queueSubscription: Subscription;
  qrBins: number = 0;
  loadingItems: boolean = false;
  loadingProgress: number = 0;

  constructor(
    public dialog: MatDialog, 
    private printService: PrintService, 
    private searchService: SearchService,
    private authService: AuthService,
    private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.workspaceID = this.route.snapshot.paramMap.get('workspaceID');

    this.calculateGrid();
    this.updateFontSize();
    this.loadQueue();

    this.searchService.loadBinData(this.workspaceID);
  }

  ngOnDestroy() {
    this.queueSubscription.unsubscribe();
  }


  loadQueue(){
    this.authService.getUser().subscribe(user => {
      if(user && user.id){
        this.queueSubscription = this.printService.getItemsInQueue(this.workspaceID, user.id).subscribe(items => {
          this.itemsInQueue = items;
          this.setupTextForQRs(false);
        })
      }
    })
  }


  setupTextForQRs(useBins: boolean){
    for(let printItem of this.itemsInQueue){
      if(useBins){
        this.linkQRTo = 'bin';

        if(printItem.binID){
          printItem.QRtext = '/b/' + printItem.binID;
        }
        else {
          printItem.QRtext = '/' + printItem.type + '/' + printItem.ID;
        }
      }
      else {
        this.linkQRTo = 'item';
        printItem.QRtext = '/' + printItem.type + '/' + printItem.ID;
      }
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
      return '24px';
    }
    else if(index % this.calculatedColumns === (this.calculatedColumns - 1)){
      return '8px';
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
        this.printService.updateItemsInQueue(this.workspaceID, this.itemsInQueue);
      }
    });
  }

  removeItem(index: number){
    this.printService.updateItemsInQueue(this.workspaceID, 
      this.itemsInQueue.slice(0, index).concat(this.itemsInQueue.slice(index+1, this.itemsInQueue.length-1)));
    /*
    this.itemsInQueue.splice(index, 1);
    */
  }
  

  drop(event: CdkDragDrop<string[]>){
    moveItemInArray(this.itemsInQueue, event.previousIndex, event.currentIndex);
    this.printService.updateItemsInQueue(this.workspaceID, this.itemsInQueue);
  }


  swapDimensions(){
    let widthHolder = this.pageWidth;
    this.pageWidth = this.pageHeight;
    this.pageHeight = widthHolder;

    this.calculateGrid();
  }


  printPDF(){

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
        doc.addImage(this.getBase64QR(document.getElementById('qrCode' + itemIndex)), 'PNG', 
          this.margins + calcInitialQRSpaceX + (xIndex * this.xSpacing * this.qrFullImageSize),
          this.margins + calcInitialQRSpaceY + (yIndex * this.ySpacing * this.qrFullImageSize),  
          this.qrFullImageSize, this.qrFullImageSize);

        let extraTextLine = 0;
        if(this.textToPrint.includes('-B-N')){
          extraTextLine = this.calculatedFontSize * 0.02;
        }

        if(this.textToPrint.includes('-N') && item.type !== 'b'){
          doc.setFont("Helvetica", "");
          doc.text(item.displayName,
            this.margins + calcInitialQRSpaceX + (0.5*this.qrFullImageSize) + (xIndex * this.xSpacing * this.qrFullImageSize),
            this.margins + extraTextLine + calcInitialQRSpaceY + this.qrFullImageSize + (this.calculatedFontSize*0.015) + (yIndex * this.ySpacing * this.qrFullImageSize), 
            {
              align: 'center',
              maxWidth: Math.min(this.xSpacing*this.qrSize*1.08, 0.15*this.calculatedFontSize)
            })
        }

        // Print bin of selected or we're printing a bin number without an item
        if(this.textToPrint.includes('-B') || (item.type === 'b' && this.textToPrint.includes('-N'))){
          doc.setFont("Courier", "Bold");
          doc.text(item.binID ?? item.ID,
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

        if(this.textToPrint.includes('-N') && item.type !== 'b'){
          doc.setFont("Helvetica", "");
          doc.text(item.displayName,
            this.margins + (1.1*this.qrFullImageSize) + (xIndex * this.xSpacing * this.qrFullImageSize),
            this.margins + extraTextLine + (this.qrFullImageSize*0.5) - (this.calculatedFontSize * 0.018) + (yIndex * this.ySpacing * this.qrFullImageSize), 
            {
              baseline: 'top',
              maxWidth: this.xSpacing*this.qrSize*0.9
            })
        }

        if(this.textToPrint.includes('-B') || (item.type === 'b' && this.textToPrint.includes('-N'))){
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

    window.open(doc.output("bloburl"), "_blank");
    this.dialog.open(ConfirmComponent, {
      width: '400px',
      data: {
        desc: "Would you like to clear the queue now that you have printed the items?",
        confirmText: "Clear",
        textColor: 'warn'
    }}).afterClosed().subscribe(result => {
      if(result && result.confirm){
        this.clearAllItems(true);
      }
    });
  }


  updateQuickSearchShelf(event){
    this.checkAndMoveToNextBinInput(this.shelfInput, this.binInput);
  }


  updateQuickSearchBin(event){
    this.checkAndMoveToNextBinInput(this.binInput, this.binInputExt);
    this.checkAndBackupInput(event, this.binInput, this.shelfInput);
    this.calculateNumberOfQRs();
  }

  
  updateQuickSearchBinExt(event){
    this.checkAndBackupInput(event, this.binInputExt, this.binInput);
    this.calculateNumberOfQRs();
  }


  checkAndMoveToNextBinInput(input: ElementRef<any>, nextInput: ElementRef<any>){
    if(input.nativeElement.value.length > 3){
      let start = (input.nativeElement.value as string).substring(0, 3);
      let chopped = (input.nativeElement.value as string).substring(3);
      input.nativeElement.value = start;

      if(chopped.length > 3){
        nextInput.nativeElement.value = chopped.substring(0, 3);
      }
      else {
        nextInput.nativeElement.value = chopped;
      }

      nextInput.nativeElement.focus();
    }
  }


  checkAndBackupInput(event, input: ElementRef<any>, prevInput: ElementRef<any>){
    // Wait until the user hits backspace twice before returning to the shelf number
    if(input.nativeElement.value.length < 1 && event.key === 'Backspace'){
      if(this.doubleBackspace){
        prevInput.nativeElement.focus();
        this.doubleBackspace = false;
      }
      else {
        this.doubleBackspace = true;
      }
    }
    // If they had not hit backspace or have no characters in the input, reset the backspace counter
    else {
      this.doubleBackspace = false;
    }

    // If there was too much text entered, chop off the extra text
    if(this.binInput.nativeElement.value.length > 3){
      this.binInput.nativeElement.value = this.binInput.nativeElement.value.substring(0, 3);
    }
  }


  calculateNumberOfQRs(){
    if(this.binInputExt.nativeElement.value && this.binInput.nativeElement.value){
      let newBinAmount = this.binInputExt.nativeElement.value - this.binInput.nativeElement.value + 1;
      
      if(newBinAmount > 0){
        this.qrBins = newBinAmount;
      }
      else {
        this.qrBins = 0;
      }
    }
    else if(this.binInput.nativeElement.value){
      this.qrBins = 1;
    }
    else {
      this.qrBins = 0;
    }
  }


  async addBinQRs(){
    if(this.qrBins > 0){

      if(this.binInput.nativeElement.value){

        let newItemsInQueue: PrintItem[] = [];
        let binNumber = Number.parseInt(this.binInput.nativeElement.value)
        let endingNum = this.binInputExt.nativeElement.value ? Number.parseInt(this.binInputExt.nativeElement.value) : binNumber;
        this.loadingItems = true;
        let progressInterval = 100/this.qrBins;

        for(; binNumber <= endingNum; binNumber++){
          let binID = this.convertNumberToThreeDigitString(this.shelfInput.nativeElement.value) 
            + '-' + this.convertNumberToThreeDigitString(binNumber);

          let itemID = this.searchService.getItemIDFromBinID(binID);
          this.loadingProgress += progressInterval;

          if(itemID && itemID !== 'err' && itemID !== 'no ID'){
            let loadedItem = await this.searchService.getItem(this.workspaceID, itemID).pipe(first(result => result !== undefined)).toPromise();

            if(loadedItem){
              newItemsInQueue.push({
                ID: itemID,
                displayName: loadedItem.name,
                binID: binID,
                type: 'i'
              });

              continue;
            }
          }
          
          newItemsInQueue.push({
            ID: binID,
            displayName: "Bin " + binID,
            type: 'b'
          });
          
        }

        this.printService.updateItemsInQueue(this.workspaceID, this.itemsInQueue.concat(newItemsInQueue));
        this.clearBinInfo();
        this.loadingItems = false;
        this.loadingProgress = 0;
      }
    }
  }


  clearBinInfo(){
    this.shelfInput.nativeElement.value = null;
    this.binInput.nativeElement.value = null;
    this.binInputExt.nativeElement.value = null;
    this.qrBins = 0;
  }


  clearAllItems(bypassConfirm?: boolean){
    if(!bypassConfirm){
      if(confirm("Are you sure you want to reset the print queue?")){
        this.printService.updateItemsInQueue(this.workspaceID, []);
      }
    }
    else {
      this.printService.updateItemsInQueue(this.workspaceID, []);
    }
  }


  convertNumberToThreeDigitString(num: number | string): string {
    
    let strigifiedNum = num.toString();

    if(strigifiedNum.length === 1){
      return '00' + strigifiedNum;
    }
    else if(strigifiedNum.length === 2){
      return '0' + strigifiedNum;
    }
    else {
      return num.toString();
    }
    
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

}
