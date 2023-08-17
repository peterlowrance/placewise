import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import jsPDF from 'jspdf';
import { PrintItem } from 'src/app/models/PrintItem';
import { SimpleFieldDialogComponent } from '../simple-field-dialog/simple-field-dialog.component';
import { PrintService } from 'src/app/services/print.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators'
import { SearchService } from 'src/app/services/search.service';
import { ConfirmComponent } from '../confirm/confirm.component';
import { PrintTemplate } from 'src/app/models/PrintTemplate';
import { formatDate } from '@angular/common';

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
  printTemplates: PrintTemplate[];
  selectedTab: number = 0;
  templateName: string = '';

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

    // Make sure the bin document is loaded for loading items right away if adding to the queue via bin ID is used
    this.searchService.loadBinData(this.workspaceID);

    this.printService.getPrintTemplates(this.workspaceID).then(result => {
      this.printTemplates = result;
    })
  }

  ngOnDestroy() {
    this.queueSubscription.unsubscribe();
  }


  // This sets up a subscription to the queue if it doesn't already exist.
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


  // This sets up what is encoded into the QR code
  // If printing bin numbers is selected, it will prefer to use the bin ID over normal ID
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


  // Determines how many qr codes can fit with the current configuration
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


  // Updates font size based on qr Sizes, or if there's an override
  updateFontSize(){
    if(this.overrideFontSize){
      this.calculatedFontSize = this.overrideFontSize;
    }
    else {
      this.calculatedFontSize = Math.floor(this.fontMultiplier * this.qrSize)/10;
    }
  }

  // Gets the spacing between elements in the queue to show row and page separations
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

  // Makes sure we have all necessary info before being able to print
  checkReady(){
    if(this.qrSize && this.calculatedFontSize){
      return true;
    }
    return false;
  }

  // Open dialog to edit the label of a print queue item
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


  // Removes an item in queue by first removing it from Firebase. Then the updated array will come back through the queue subscription
  removeItem(index: number){
    this.printService.updateItemsInQueue(this.workspaceID, 
      this.itemsInQueue.slice(0, index).concat(this.itemsInQueue.slice(index+1, this.itemsInQueue.length-1)));
  }
  

  // When using the drag and drop, switch the items then update Firebase
  drop(event: CdkDragDrop<string[]>){
    moveItemInArray(this.itemsInQueue, event.previousIndex, event.currentIndex);
    this.printService.updateItemsInQueue(this.workspaceID, this.itemsInQueue);
  }


  // After swapping the length and width of the paper, recalculate how many QRs can fit
  swapDimensions(){
    let widthHolder = this.pageWidth;
    this.pageWidth = this.pageHeight;
    this.pageHeight = widthHolder;

    this.calculateGrid();
  }


  loadTemplate(index: number){
    let template = this.printTemplates[index];

    this.templateName = template.templateName;
    this.format = template.format;
    this.pageWidth = template.width;
    this.pageHeight = template.height;
    this.textToPrint = template.whatIsPrinted;
    this.margins = template.margins;
    this.qrSize = template.qrSize;
    if(template.fontSize) {this.overrideFontSize = template.fontSize; }
    else { this.overrideFontSize = null; this.updateFontSize(); }
    
    if(template.linkToBin) {this.linkQRTo = 'bin'; this.setupTextForQRs(true)}
    else {this.linkQRTo = 'item'; this.setupTextForQRs(false)}

    this.calculateGrid();

    this.selectedTab = 2;
  }


  printPDF(){

    // Initial page setup
    let doc = new jsPDF({orientation: this.pageWidth > this.pageHeight ? 'l' : 'p', unit: 'in', format: [this.pageWidth, this.pageHeight]});
    doc.setFontSize(this.calculatedFontSize);
    let totalQRsPerPage = this.calculatedColumns * this.calculatedRows;
    let isVertical = this.format.startsWith('vert');

    // Determine the offset from the edge of the page to make the items look centered on vertical setup
    let calcInitialQRSpaceX = 0;
    let calcInitialQRSpaceY = 0;
    if(isVertical){
      calcInitialQRSpaceX = (this.pageWidth - (2*this.margins) - ((this.calculatedColumns-1) * this.xSpacing * this.qrFullImageSize) - this.qrFullImageSize)/2;
      calcInitialQRSpaceY = (this.pageHeight - (2*this.margins) - (this.calculatedRows * this.ySpacing * this.qrFullImageSize))/2;
      // If the height is longer than the space available, make it always start at the margin
      if(calcInitialQRSpaceY < 0) { calcInitialQRSpaceY = 0 }
    }

    let itemIndex = 0;
    let xIndex = 0;
    let yIndex = 0;

    // Render each QR with thier given labels
    for(let item of this.itemsInQueue){
      // Render the QR from pre-rendered hidden QR codes generated on the DOM using angularx-qrcode elements
      doc.addImage(this.getBase64QR(document.getElementById('qrCode' + itemIndex)), 'PNG', 
        this.margins + calcInitialQRSpaceX + (xIndex * this.xSpacing * this.qrFullImageSize),
        this.margins + calcInitialQRSpaceY + (yIndex * this.ySpacing * this.qrFullImageSize),  
        this.qrFullImageSize, this.qrFullImageSize);

      // If there's both bin number and label to be printed, setup the label being printed on a different line
      let extraTextLine = 0;
      if(this.textToPrint.includes('-B-N')){
        extraTextLine = this.calculatedFontSize * (isVertical ? 0.02 : 0.013);
      }

      // If the label (item name) is included, render it - unless the print item is just a bin, then ignore this
      if(this.textToPrint.includes('-N') && item.type !== 'b'){
        doc.setFont("Helvetica", "");
        doc.text(item.displayName.replace(/(\r\n|\n|\r)/gm, ""),
          this.margins + calcInitialQRSpaceX + ((isVertical ? 0.5 : 1.1)*this.qrFullImageSize) + (xIndex * this.xSpacing * this.qrFullImageSize),
          this.margins + extraTextLine + calcInitialQRSpaceY + (this.qrFullImageSize*(isVertical ? 1.0 : 0.5)) + (this.calculatedFontSize*(isVertical ? 0.015 : -0.018)) + (yIndex * this.ySpacing * this.qrFullImageSize), 
          (isVertical ? {
            align: 'center',
            maxWidth: Math.min(this.xSpacing*this.qrSize*1.08, 0.15*this.calculatedFontSize)
          } : {
            baseline: 'top',
            maxWidth: this.xSpacing*this.qrSize*0.9
          }))
      }

      // If the bin id is included, render it. If the print item was just a bin, print this as its name
      if(this.textToPrint.includes('-B') || (item.type === 'b' && this.textToPrint.includes('-N'))){
        doc.setFont("Courier", "Bold");
        doc.text(item.binID ?? item.ID,
          this.margins + calcInitialQRSpaceX + ((isVertical ? 0.5 : 1.1)*this.qrFullImageSize) + (xIndex * this.xSpacing * this.qrFullImageSize),
          this.margins + calcInitialQRSpaceY + (this.qrFullImageSize*(isVertical ? 0.94 : 0.06)) + (this.calculatedFontSize*(isVertical ? 0.015 : 0)) + (yIndex * this.ySpacing * this.qrFullImageSize),
          (isVertical ? {
            align: 'center'
          } : {
            baseline: 'top'
          }))
      }

      itemIndex++;

      // Once there's enough QRs on one page, move to the next and start again
      if(itemIndex % totalQRsPerPage === 0 && itemIndex !== this.itemsInQueue.length){
        doc.addPage();
        xIndex = 0;
        yIndex = 0;
      }

      // If there's more room on this page, shift to next according column or row
      else {
        xIndex++;
        if(xIndex % this.calculatedColumns === 0){
          xIndex = 0;
          yIndex++;
        }
      }
    }

    // Render the document to a new page in the user's web browser
    window.open(doc.output("bloburl").toString(), "_blank");

    // Back in Placebin, open a pop up asking the user if they'd like to clear their browser
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


  // Called when the number in the shelf changes, checks if we should move to the bin input
  updateQuickSearchShelf(event){
    this.checkAndMoveToNextBinInput(this.shelfInput, this.binInput);
  }

  // Called when the number in the starting bin changes, checks if we should move inputs and how many bins are currently included
  updateQuickSearchBin(event){
    this.checkAndMoveToNextBinInput(this.binInput, this.binInputExt);
    this.checkAndBackupInput(event, this.binInput, this.shelfInput);
    this.calculateNumberOfBins();
  }

  
  // Called when the number in the ending bin changes, checks if we should move inputs and how many bins are currently included
  updateQuickSearchBinExt(event){
    this.checkAndBackupInput(event, this.binInputExt, this.binInput);
    this.calculateNumberOfBins();
  }


  // Once the digits are over three, move to next input.
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

  // If there's no numbers left and we hit backspace twice, move to previous input
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


  // You can figure this one out. If bins are negative, set it to zero.
  calculateNumberOfBins(){
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


  // Loads the items in the range of bin IDs, if one exists for that bin ID.
  // If one does not, it adds a print item that's just a bin ID with no item data.
  async addBinQRs(){
    if(this.qrBins > 0){

      if(this.binInput.nativeElement.value){

        let newItemsInQueue: PrintItem[] = [];
        let binNumber = Number.parseInt(this.binInput.nativeElement.value) // Starting number that will be incremented
        let endingNum = this.binInputExt.nativeElement.value ? Number.parseInt(this.binInputExt.nativeElement.value) : binNumber;
        this.loadingItems = true;
        let progressInterval = 100/this.qrBins; // For the progress indicator under the button

        // Go through each bin ID in the range, including the last number
        for(; binNumber <= endingNum; binNumber++){
          let binID = this.convertNumberToThreeDigitString(this.shelfInput.nativeElement.value) 
            + '-' + this.convertNumberToThreeDigitString(binNumber);

          let itemID = this.searchService.getItemIDFromBinID(binID);
          this.loadingProgress += progressInterval;

          // Make sure there's an item that has the bin ID before trying to load the item from Firebase
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
          
          // If there was no item, add the barebones bin print item
          newItemsInQueue.push({
            ID: binID,
            displayName: "Bin " + binID,
            type: 'b'
          });
          
        }

        // Add these new items to the print queue in Firebase, which will then update our print queue subscription
        this.printService.updateItemsInQueue(this.workspaceID, this.itemsInQueue.concat(newItemsInQueue));

        // Clean up the UI 
        this.clearBinInfo();
        this.loadingItems = false;
        this.loadingProgress = 0;
      }
    }
  }


  // When a new set of bins are added, remove the text in the inputs. Helps prevent spam, whether intentional or not
  clearBinInfo(){
    this.shelfInput.nativeElement.value = null;
    this.binInput.nativeElement.value = null;
    this.binInputExt.nativeElement.value = null;
    this.qrBins = 0;
  }


  // Removes all the items from the print queue, but first double checks you want to do that
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

  saveTemplate(){
    this.dialog.open(SimpleFieldDialogComponent, {
      width: '300px',
      data: {fieldName: 'Template Name:', value: this.templateName, description: 'If the name is the same as an existing template, that template will be overriden.'}
    }).beforeClosed().subscribe(result => {
      if(result && result.wasValid){
        let newTemplate: PrintTemplate = {
          templateName: result.value,
          updated: formatDate(Date.now(),'yyyy-MM-dd', 'en-US'),

          format: this.format,
          width: this.pageWidth,
          height: this.pageHeight,
          margins: this.margins,
          qrSize: this.qrSize,
          whatIsPrinted: this.textToPrint
        }

        if(this.linkQRTo === 'bin'){
          newTemplate.linkToBin = true;
        }

        if(this.overrideFontSize){
          newTemplate.fontSize = this.overrideFontSize;
        }

        this.printService.saveNewTemplate(this.workspaceID, this.printTemplates, newTemplate).then(resolved => {
          if(resolved){
            this.printService.getPrintTemplates(this.workspaceID).then(templates => {
              this.printTemplates = templates;
              this.selectedTab = 1;
            })
          }
        })
      }
    });
  }

  // Make numbers into the digits of the bin format
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
  
  // Gets the QR image from the hidden pre-rendered QR codes on the DOM
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
