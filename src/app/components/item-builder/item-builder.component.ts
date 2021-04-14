import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Category } from 'src/app/models/Category';
import { Item } from 'src/app/models/Item';
import { SearchService } from 'src/app/services/search.service';
import { ModifyHierarchyDialogComponent } from '../modify-hierarchy-dialog/modify-hierarchy-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import { AdminService } from 'src/app/services/admin.service';
import { HierarchyItem } from 'src/app/models/HierarchyItem';
import {MatChipInputEvent, MatSnackBar} from '@angular/material';
import { ImageService } from 'src/app/services/image.service';
import {COMMA, ENTER, SPACE} from '@angular/cdk/keycodes';
import {CdkTextareaAutosize} from '@angular/cdk/text-field';
import { Subscription, SubscriptionLike } from 'rxjs';
import {Location} from "@angular/common";
import { HostListener } from '@angular/core';


interface AttributeCard {
  name: string;
  ID: string;
  value?: string;
  category: string;
  focused: boolean;
}

@Component({
  selector: 'app-item-builder',
  templateUrl: './item-builder.component.html',
  styleUrls: ['./item-builder.component.css']
})
export class ItemBuilderComponent implements OnInit {

  constructor(
    private searchService: SearchService,
    public dialog: MatDialog,
    private adminService: AdminService,
    private imageService: ImageService,
    private route: ActivatedRoute,
    private router: Router,
    private snack: MatSnackBar,
    private location: Location
    ) { }

    @ViewChild('autosize', {static: false}) autosize: CdkTextareaAutosize;

    readonly separatorKeysCodes: number[] = [ENTER, COMMA, SPACE];
    readonly MAX_STEP = 4;
    readonly MIN_STEP = 0;

    id: string;                               // item id
    step = -1;                                // What step are we at in filling in data
    singleStep: Boolean;                      // If we are here to edit one piece of the item
    item: Item;                               // Item being setup
    category: Category;                       // Category of the item
    categoryAncestors: Category[];            // All of the Category's parents
    locationsAndAncestors: HierarchyItem[][]; // The locations and their ancestors
    attributesForCard: AttributeCard[];       // Attributes of the item, for the UI
    additionalText: string;                   // Helps with setting up the title
    autoTitleBuilder: boolean;                // Switch value on UI
    attributeSuffix: string;                  // Pre-loaded suffix

    returnTo: string;

  ngOnInit() {
    // Retrieve id
    this.id = this.route.snapshot.paramMap.get('id');

    // Actively retrieve if the step changes
    this.route.queryParamMap.subscribe(params => {

      this.step = Number(params.get('step'));
      if(this.step > this.MAX_STEP || this.step < this.MIN_STEP){
        this.router.navigate(['/item/' + this.id]);
      }

      if(params.get('singleStep')){
        this.singleStep = true;
      }

      this.returnTo = params.get('returnTo');
    })

    this.searchService.getItem(this.id).subscribe(item => {
      
      if (!item) {
        return;
      }
      this.item = item;

      this.searchService.getCategory(item.category).subscribe(category => {
        this.category = category;

        this.searchService.getAncestorsOf(category).subscribe(categoryAncestors => {
          if(categoryAncestors[0]){ //Sometimes it returns a sad empty array, cache seems to mess with the initial return
            this.categoryAncestors = categoryAncestors[0];
            this.attributeSuffix = this.searchService.buildAttributeSuffixFrom(this.item, this.categoryAncestors);

            // Setup additional text for auto title builder
            let additionalTextData = this.getAdditionalTextFrom(this.category.prefix, this.attributeSuffix, this.item.name);
            this.additionalText = additionalTextData.additionalText;
            this.autoTitleBuilder = additionalTextData.isAutoTitle;
            // If there is no item name, build an automatic title.
            if(!this.item.name){
              this.item.name = (this.category.prefix ? this.category.prefix : "") + (this.attributeSuffix ? this.attributeSuffix : "");

              // If this resulted in a name, toggle on the Automatic Title Builder
              if(this.item.name){
                this.autoTitleBuilder = true;
              }
            }

            let rebuiltCards = this.loadAttributesForCards([category].concat(categoryAncestors[0]), item);
            if(!this.attributesForCard || this.attributesForCard.length !== rebuiltCards.length){
              this.attributesForCard = rebuiltCards;
            }
            else {
              for(let newCard in rebuiltCards){ // This is to attempt to only save over the ones modified. Otherwise, users are often kicked out of edit fields
                let found = false;
                for(let originalCard in this.attributesForCard){
                  if(this.attributesForCard[originalCard].ID === rebuiltCards[newCard].ID){
                    found = true;
                    if(JSON.stringify(this.attributesForCard[originalCard]) !== JSON.stringify(rebuiltCards[newCard])){
                      this.attributesForCard[originalCard] = rebuiltCards[newCard]
                    }
                    break;
                  }
                }
                if(!found){
                  this.attributesForCard = rebuiltCards; // Attributes didn't align, so jsut reset
                  break;
                }
              }
            }
          }
          else {
            this.attributesForCard = this.loadAttributesForCards([category], item)
          }
        })
      });

      this.searchService.getAncestorsOf(item).subscribe(locations => {
        this.locationsAndAncestors = locations;
      });
    })
  }

  ngOnDestroy(){

  }

  /**
   * Changes the item's category
   */
  editCategory() {
    const oldCategory = this.item.category ? this.item.category : 'root';
    const dialogRef = this.dialog.open(ModifyHierarchyDialogComponent, {
      width: '45rem',
      data: {hierarchy: 'categories', singleSelection: true, parents: [this.item.category]}
    });
    dialogRef.afterClosed().subscribe(result => this.updateItemCategory(result, oldCategory));
  }

  /**
   * Update the item on UI and in DB with a new category
   * @param result The new category/s chosen
   * @param oldCategory old category
   */
  updateItemCategory(result: string[], oldCategory: string) {
    // Make sure we got data and that it wasn't just the same category
    if (result && result.length > 0 && this.item.category !== result[0]) { 

      // Get category data
      let localSub = this.searchService.getCategory(result[0]).subscribe(newCategory => {
        if(newCategory){ // For for the actual data to come in

          // Load new category ancestors before continuing
          this.searchService.getAncestorsOf(newCategory).subscribe(categoryAncestors => {

            // If this was using the auto prefix, replace it.
            if(this.category.prefix && this.item.name.startsWith(this.category.prefix)){
              this.item.name = this.item.name.substring(this.category.prefix.length);
              if(newCategory.prefix){
                this.item.name = newCategory.prefix + this.item.name;
              }
            }

            // If this was using the auto suffix, replace it.
            if (this.attributeSuffix && this.item.name.endsWith(this.attributeSuffix)) {
              this.item.name = this.item.name.substring(0, this.item.name.length - this.attributeSuffix.length).trim()
              if(newCategory.suffixStructure){
                this.item.name = this.item.name + this.searchService.buildAttributeSuffixFrom(this.item, categoryAncestors[0]);
              }
            }
    
            // Don't want this screwing with us later
            localSub.unsubscribe();

            // Update the item's category on the UI and update the DB
            this.adminService.addToRecent(newCategory); // UI category cache
            this.item.category = result[0];
            this.categoryAncestors = categoryAncestors[0]
            this.adminService.updateItem(this.item, oldCategory, null); // TODO: Not good placement, seperate from normal saving routine
          });

        }
      });
    }
  }

  /**
   * Changes the item's locations to new locations
   */
  editLocation() {
    // Deep copy locations
    const oldLocations = JSON.parse(JSON.stringify(this.item.locations));
    const dialogRef = this.dialog.open(ModifyHierarchyDialogComponent, {
      width: '45rem',
      data: {hierarchy: 'locations', singleSelection: false, parents: this.item.locations}
    });
    dialogRef.afterClosed().subscribe(result => this.updateItemLocations(result, oldLocations));
  }

  /**
   * Updates the item's locations
   * @param result locations chosen
   * @param oldLocations old locations
   */
  updateItemLocations(result: string[], oldLocations: string[]) {
    if (result) {
      // Go through and get the new locations for saving to recent
      let newLocations: string[] = [];

      for(let resultIndex in result){
        let found = false;
        for(let currentIndex in oldLocations){
          if(oldLocations[currentIndex] === result[resultIndex]){
            found = true;
            break;
          }
        }
        if(!found){
          newLocations.push(result[resultIndex]);
        }
      }

      // Update the item locations
      this.item.locations = result;
      
      // NOTE: Inside the updateItem, the tracked data for old locations in the data structure get removed. But the card is removed here:
      /*
      for(let oldLocIndex in oldLocations){
        if(newLocations.indexOf(oldLocations[oldLocIndex]) === -1){
          for(let cardIndex in this.trackingCards){
            if(this.trackingCards[cardIndex].locationID === oldLocations[oldLocIndex]){
              this.trackingCards.splice(parseInt(cardIndex), 1);
            }
          }
        }
      }
      */

      this.adminService.updateItem(this.item, null, oldLocations); // TODO: Not good placement, seperate from main saving mechanism
      // this.setDirty(true);
      this.searchService.getAncestorsOf(this.item).subscribe(locations => {
        this.locationsAndAncestors = locations;
      });

      // Update recent locations
      for(let index in newLocations){
        let localSub = this.searchService.getLocation(newLocations[index]).subscribe(loc => {
          this.adminService.addToRecent(loc);
          localSub.unsubscribe(); // Don't want this screwing with us later
        })
      }
    }
  }

  loadAttributesForCards(parents: Category[], item: Item): AttributeCard[] {
    let cards: AttributeCard[] = [];

    // Add category attributes
    for(let parent in parents){
      for(let attr in parents[parent].attributes){
        cards.push({
          name: parents[parent].attributes[attr]['name'],
          ID: attr,
          category: parents[parent].name,
          focused: false
        })
      }
    }

    // Fill in data or add orphaned attribute
    for(let itemAttr in item.attributes){
      let hasAttribute = false;
      for(let card in cards){
        if(cards[card].ID === item.attributes[itemAttr].ID){
          cards[card].value = item.attributes[itemAttr].value;
          hasAttribute = true;
        }
      }

      if(!hasAttribute){
        cards.push({
          name: item.attributes[itemAttr].name,
          ID: item.attributes[itemAttr].ID,
          value: item.attributes[itemAttr].value,
          category: "None",
          focused: false
        })
      }
    }

    cards.sort(function(a, b) {
      var nameA = a.name.toUpperCase(); // ignore upper and lowercase
      var nameB = b.name.toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
    
      // names must be equal
      return 0;
    })
    return cards;
  }

  onAttrValueSubmit(card: AttributeCard){
    let hasAttribute = false;
    card.focused = false;
    for(let attr in this.item.attributes){
      if(this.item.attributes[attr].ID === card.ID){
        this.item.attributes[attr].value = card.value ? card.value.trim() : '';
        hasAttribute = true;
      }
    }
    if(!hasAttribute && card.value){
      if(!this.item.attributes){
        this.item.attributes = [{
          name: card.name,
          ID: card.ID,
          value: card.value.trim()
        }];
      }
      else{
        this.item.attributes.push({
          name: card.name,
          ID: card.ID,
          value: card.value.trim()
        })
      }
    }

    // Rebuild title

    let newSuffix = this.searchService.buildAttributeSuffixFrom(this.item, this.categoryAncestors);

    // If we had the auto suffix, replace it
    if(this.attributeSuffix && this.item.name.endsWith(this.attributeSuffix)){
      this.item.name = this.item.name.substring(0, this.item.name.length - this.attributeSuffix.length) + newSuffix;
    }

    // If there was no suffix, add on the new one
    if(!this.attributeSuffix){
      this.item.name += newSuffix;
    }

    this.attributeSuffix = newSuffix;
  }


  //
  // MODIFIED FROM ITEM DISPLAY
  //

  /**
   * Handles uploading an image file to firestorage
   * @param event
   */
  uploadImage(fileEvent: Event) {
    // cast
    const element = (fileEvent.target as HTMLInputElement);
    // only change if there was a file upload
    if (element.files && element.files[0]) {
      // set image url file
      const file = element.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (ev) => {
        if (typeof reader.result === 'string') {
          this.imageService.resizeImage(reader.result).then(url => {
            this.item.imageUrl = url;
            // set dirty and save for upload
            this.saveItemImage();
          });
        }
      };
    }
  }

  /**
   * Saves the item's image and updates the database
   */
  async saveItemImage() {
    return this.imageService.putImage(this.item.imageUrl, this.item.ID).then(link => {
      this.item.imageUrl = link;
      this.placeIntoDB();
    });
  }

  deleteAttribute(card: AttributeCard){
    let deleteCardIndex = this.attributesForCard.indexOf(card);
    this.attributesForCard.splice(deleteCardIndex, 1);

    for(let attributeIndex in this.item.attributes){
      if(this.item.attributes[attributeIndex].ID === card.ID){
        this.item.attributes.splice(Number.parseInt(attributeIndex), 1);
      }
    }
  }

  addTag(event: MatChipInputEvent | any): void {
    const input = event.input;
    const value = event.value;
    if (this.item.tags == null) this.item.tags = [];
    // Add our fruit
    if ((value || '').trim()) {
      this.item.tags.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  /**
   * Places the item into the database
   */
  async placeIntoDB() {
    return this.adminService.updateItem(this.item, null, null).then(val => {
    },
    reject => {
      this.snack.open('Item Save Failed: ' + reject, "OK", {duration: 3000, panelClass: ['mat-warn']});
    });
  }

  //
  // TODO: Untidy way of saving elements every change
  //

  removeTag(tag: string): void {
    const index = this.item.tags.indexOf(tag);

    if (index >= 0) {
      this.item.tags.splice(index, 1);
    }
  }

  onDescSubmit() {
    // Use to put in DB each time
  }


  //
  // ACTUAL DIFFERENCES FROM ITEM DISPLAY
  //

  // Build and set title string from auto title
  updateTitleFromUI(){
    if(this.category.prefix){
      if(this.additionalText){
        this.item.name = this.category.prefix + " " + this.additionalText.trim() + this.attributeSuffix;
      }
      else {
        this.item.name = this.category.prefix + this.attributeSuffix;
      }
    }
  }

  checkPrefixOverwritten(): Boolean {
    return this.category.prefix === this.item.name.substring(0, this.category.prefix.length);
  }

  isReadyForNextStep(): Boolean {

    // Setup Category and Locaiton
    if(this.step == 0){
      // If we're still loading category
      if(!this.category){
        return false;
      }
      // If category is not assigned
      else if(this.category.name == 'root'){
        return false;
      }
      // If we're still loading locations
      if(!this.locationsAndAncestors){
        return false;
      }
      // If there is no location
      else if(this.locationsAndAncestors.length == 0){
        return false;
      }
      // If it is the unassigned location
      else if(this.locationsAndAncestors[0][0].name === 'root'){
        return false;
      }
      // No problems, we're set to go
      return true;
    }

    // Setup attributes
    else if(this.step == 1){
      // If we're still loading attributes
      if(!this.attributesForCard){
        return false;
      }
      else {
        // Go through each attribute and make sure it has a value
        for(let attr of this.attributesForCard){
          if(!attr.value){
            return false;
          }
        }
        return true;
      }
    }

    // Setup title
    else if(this.step == 2){
      // Only disable if the title is blank
      if(!this.item.name){
        return false;
      }

      // Currently just asks you to make sure it's good
      return true;
    }

    // Default to false
    return false;
  }

  /** 
  * @return The additional text between the suffix and prefix. 
  * If it could not remove both, the auto title flag is set to false.
  */
  getAdditionalTextFrom(prefix: string, suffix: string, name: string): {additionalText: string, isAutoTitle: boolean} {
    // If there is no prefix or suffix, then there's no auto title
    if(!prefix && !suffix){
      return {additionalText: name, isAutoTitle: false};
    }

    let result = {additionalText: name, isAutoTitle: true};

    // Check for a prefix. If there is one, remove it. If that was not possible, uncheck auto title.
    if(prefix){
      if(name.startsWith(prefix)){
        result.additionalText = result.additionalText.substring(prefix.length).trim();
      }
      else {
        result.isAutoTitle = false;
      }
    }

    // Check for a suffix. If there is one, remove it. If that was not possible, uncheck auto title.
    if(suffix){
      if(name.endsWith(suffix)){
        result.additionalText = result.additionalText.substring(0, result.additionalText.length - suffix.length).trim();
      }
      else {
        if(result.isAutoTitle){
          result.isAutoTitle = false;
        }
        else {
          // If there was no prefix either, then there is no additional text
          result.additionalText = "";
        }
      }
    }

    return result;
  }

  /*
  * Called when the auto title is triggered
  */
  onToggleAutoTitle(event){
    // If we just turned it on, replace old manual title
    if(event.checked){

      this.additionalText = this.getAdditionalTextFrom(this.category.prefix, this.attributeSuffix, this.item.name).additionalText;

      // Build title, if additionalText exists put a space between it and the prefix
      this.item.name = 
        (this.category.prefix ? this.category.prefix : "") + 
        (this.additionalText ? " " + this.additionalText : "") +
        (this.attributeSuffix ? this.attributeSuffix : "");
    }
  }

  nextStep(cancelled?){
    if(!cancelled && this.step !== 0 && this.step !== 3){
      this.placeIntoDB();
    }
    
    if(this.singleStep || this.step + 1 > this.MAX_STEP){
      if(this.returnTo){
        this.router.navigate(['/item/' + this.id], { queryParams: { returnTo: this.returnTo } });
      }
      else {
        this.router.navigate(['/item/' + this.id]);
      }
      return;
    }

    else {
      //this.step += 1;
      if(this.returnTo){
        this.router.navigate(['/itemBuilder/' + this.id], { queryParams: { step: this.step + 1, returnTo: this.returnTo } });
      }
      else {
        this.router.navigate(['/itemBuilder/' + this.id], { queryParams: { step: this.step + 1 } });
      }
      window.scrollTo(0, 0);
    }
  }

}
