import { ENTER, COMMA, SPACE } from '@angular/cdk/keycodes';
import { Component, OnInit, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipInputEvent } from '@angular/material/chips'
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Category } from 'src/app/models/Category';
import { HierarchyItem } from 'src/app/models/HierarchyItem';
import { HierarchyObject } from 'src/app/models/HierarchyObject';
import { Item } from 'src/app/models/Item';
import { HierarchyLocation } from 'src/app/models/Location';
import { AdminService } from 'src/app/services/admin.service';
import { ImageService } from 'src/app/services/image.service';
import { SearchService } from 'src/app/services/search.service';
import { ModifyHierarchyDialogComponent } from '../modify-hierarchy-dialog/modify-hierarchy-dialog.component';
import { AttributeOption } from 'src/app/models/Attribute';
import { ENGINE_METHOD_DIGESTS } from 'constants';

interface AttributeCard {
  name: string;
  value?: string;
  category: string;
  focused: boolean;
  type: string;
  isValid: boolean;
  layerNames?: string[];
  selectors?: {
    selectedValue?: string,
    options: AttributeOption[]
  }[] 
}

@Component({
  selector: 'app-item-builder-modal',
  templateUrl: './item-builder-modal.component.html',
  styleUrls: ['./item-builder-modal.component.css']
})
export class ItemBuilderModalComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<ItemBuilderModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {hierarchyObj: HierarchyObject, step?: string},
    private searchService: SearchService,
    public dialog: MatDialog,
    private adminService: AdminService,
    private imageService: ImageService,
    private route: ActivatedRoute,
    private router: Router,
    private snack: MatSnackBar,
  ) { }

  readonly separatorKeysCodes: number[] = [ENTER, COMMA, SPACE];


  step: string = '';                                // What step are we at in filling in data
  singleStep: Boolean;                      // If we are here to edit one piece of the item
  item: Item;                               // Item being setup
  category: Category;                       // Category of the item
  categoryAndAncestors: Category[];         // For attributes
  locations: HierarchyLocation[];           // The locations and their ancestors
  attributesForCard: AttributeCard[];       // Attributes of the item, for the UI
  additionalText: string;                   // Helps with setting up the title
  autoTitleBuilder: boolean;                // Switch value on UI
  attributeSuffix: string;                  // Pre-loaded suffix
  loadingLocations: boolean = true;         // For if it takes a while to load locations... Doesn't end up being very useful atm
  binIDsToSave: { 
    [locationID: string] : {
      ID: string;
      previousID: string;
    }
  } = {};
  invalidBinIDErrors: {[locationID: string] : string} = {};
  binIDData: {
    location: HierarchyLocation;
    loadedID: string;
    shelfID: string;
  }[] = [];

  ngOnInit() {
    // Setup if this is just for editing one piece of an item
    if(this.data.step){
      this.singleStep = true;
      this.step = this.data.step;
      this.item = JSON.parse(JSON.stringify(this.data.hierarchyObj as Item));
    }

    // Otherwise start initializing a new item to build out
    else {
      this.item = {
        name: '',
        locations: [],
        category: 'root',
        imageUrl: '../../../assets/notFound.png'
      };
      this.step = 'basic';

      // If we started with a category, fill in the data we know
      if(this.data.hierarchyObj.type === 'category'){
        this.item.category = this.data.hierarchyObj.ID;
        this.category = this.data.hierarchyObj as Category;
      }
      // Do the same if it was a location
      else if (this.data.hierarchyObj.type === 'location'){
        this.item.locations = [this.data.hierarchyObj.ID];
        
      }
    }

    // Load category info plus category's parents for attributes
    this.searchService.getCategory(this.item.category).subscribe(category => {
      this.category = category;

      this.searchService.getAncestorsOf(category).subscribe(categoryAncestors => {
        if(categoryAncestors[0]){ //Sometimes it returns a sad empty array, cache seems to mess with the initial return
          this.categoryAndAncestors = categoryAncestors[0];
          this.categoryAndAncestors.unshift(this.category);
          
          let returnData = this.adminService.updateItemDataFromCategoryAncestors(this.item, this.categoryAndAncestors);
          this.attributeSuffix = returnData.attributeSuffix;
          this.additionalText = returnData.additionalText;
          this.autoTitleBuilder = returnData.isAutoTitle;

          this.loadCards();
        }
        else {
          this.attributesForCard = this.loadAttributesForCards([category], this.item)
        }
      })
    });

    this.loadLocationsFromIDs(this.item.locations);
  }

  ngOnDestroy(){

  }

  /**
   * Called when locations need to be loaded from init or change. This will get the data once and unsubscribe.
   * Also shows if there are more to be loaded through "loadingLocations" for UI
   */
  loadLocationsFromIDs(locationIDs: string[]){
    // For counting up how many locations we need to load
    let needToBeLoaded = locationIDs.length;
    this.loadingLocations = needToBeLoaded > 0;
    
    // If there are no locations, just set the locations to empty
    if(!this.loadingLocations){
      this.locations = [];
      return;
    }
    
    // Reset current data (setting to null for UI)
    this.locations = null;
    // Load this in once all are ready
    let loadedLocations: HierarchyLocation[] = [];

    // Assign data to slots in locations and subs as they load in
    for(let location in locationIDs){
      // Manual single get. Maybe we should add this functionaly in search service
      let localSub = this.searchService.getLocation(locationIDs[location]).subscribe(locationData => {
        if(locationData){
          loadedLocations[location] = locationData;

          let shelfID = '000';
          if(locationData.shelfID){
            shelfID = locationData.shelfID;

            // For tracking how many we've loaded so far. If we have all loaded, update the loading flag
            needToBeLoaded -= 1;
            if(needToBeLoaded < 1){
              this.loadingLocations = false;
              this.locations = loadedLocations;
            }

            // Load bin data
            if(this.item.locationMetadata && this.item.locationMetadata[locationData.ID] && this.item.locationMetadata[locationData.ID].binID){
              this.binIDData.push({location: locationData, loadedID: this.item.locationMetadata[locationData.ID].binID.split('-')[1], shelfID})
            }
            else {
              this.binIDData.push({location: locationData, loadedID: '', shelfID});
            }
          }
          else if(locationData.parent) {
            this.searchService.getShelfIDFromAncestors(locationData.parent).then(result => {
              shelfID = result;

              // Repeated code scream
              needToBeLoaded -= 1;
              if(needToBeLoaded < 1){
                this.loadingLocations = false;
                this.locations = loadedLocations;
              }

              // Load bin data
              if(this.item.locationMetadata && this.item.locationMetadata[locationData.ID] && this.item.locationMetadata[locationData.ID].binID){
                this.binIDData.push({location: locationData, loadedID: this.item.locationMetadata[locationData.ID].binID.split('-')[1], shelfID})
              }
              else {
                this.binIDData.push({location: locationData, loadedID: '', shelfID});
              }
            });
          }
        }

        // Only get the data once
        localSub.unsubscribe();
      });
    }
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
            this.categoryAndAncestors = categoryAncestors[0];
            this.categoryAndAncestors.unshift(newCategory);

            let returnData = this.adminService.updateItemDataFromCategoryAncestors(this.item, this.categoryAndAncestors, this.category);
            this.attributeSuffix = returnData.attributeSuffix;
            this.additionalText = returnData.additionalText;
            this.autoTitleBuilder = returnData.isAutoTitle;

            this.loadCards();
    
            // Don't want this screwing with us later
            localSub.unsubscribe();

            // Update the item's category on the UI and update the DB
            this.adminService.addToRecent(newCategory); // UI category cache
            this.item.category = newCategory.ID;
            this.category = newCategory;
            // this.adminService.updateItem(this.item, oldCategory, null); // TODO: Not good placement, seperate from normal saving routine
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
    dialogRef.beforeClosed().subscribe(result => this.updateItemLocations(result, oldLocations));
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

      //this.adminService.updateItem(this.item, null, oldLocations); // TODO: Not good placement, seperate from main saving mechanism
      // this.setDirty(true);

      this.loadLocationsFromIDs(result);

      // Update recent locations
      for(let index in newLocations){
        let localSub = this.searchService.getLocation(newLocations[index]).subscribe(loc => {
          this.adminService.addToRecent(loc);
          localSub.unsubscribe(); // Don't want this screwing with us later
        })
      }
    }
  }

  loadCards(){
    // Whenever category updates, load/reload the attributes into the cards with category metadata
    let rebuiltCards = this.loadAttributesForCards(this.categoryAndAncestors, this.item);
    if(!this.attributesForCard || this.attributesForCard.length !== rebuiltCards.length){
      this.attributesForCard = rebuiltCards;
    }
    else {
      for(let newCard in rebuiltCards){ // This is to attempt to only save over the ones modified. Otherwise, users are often kicked out of edit fields
        let found = false;
        for(let originalCard in this.attributesForCard){
          if(this.attributesForCard[originalCard].name === rebuiltCards[newCard].name){
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

  loadAttributesForCards(parents: Category[], item: Item): AttributeCard[] {
    let cards: AttributeCard[] = [];

    // Add category attributes
    for(let parent in parents){
      for(let attr in parents[parent].attributes){

        let selectors: {
          selectedValue?: string,
          options: AttributeOption[]
        }[];

        if(parents[parent].attributes[attr].options){
          // Prep selectors
          selectors = [{options: parents[parent].attributes[attr].options}];

          // Load the according item's attribute value(s) into the selectors
          for(let itemAttr in item.attributes){
            if(item.attributes[itemAttr].name === parents[parent].attributes[attr].name){

              if(parents[parent].attributes[attr].layerNames){ // If there's multiple layers
                let splitData = item.attributes[itemAttr].value.split('\n');

                // Add each value (skip layer names, they should be in order)
                for(let index = 0; index < (splitData.length-1)/2; index++){
                  // Select value
                  selectors[index].selectedValue = splitData[index*2+1];
                  for(let option of selectors[index].options){
                    if(option.value === splitData[index*2+1]){
                      // If there's another layer yet to be filled, add layer
                      if(option.dependentOptions){
                        selectors.push({options: option.dependentOptions});
                      }
                      break;
                    }
                  }
                }
              }
              else {
                // If there's not multiple layers, load the single value (and take off the \n)
                selectors[0].selectedValue = item.attributes[itemAttr].value.split('\n')[0];
              }
              break;
            }
          }
        }

        cards.push({
          name: parents[parent].attributes[attr]['name'],
          category: parents[parent].name,
          focused: false,
          isValid: false, // If there's data there, it should already be valid
          type: parents[parent].attributes[attr]['type'] || 'text',
          layerNames: parents[parent].attributes[attr].layerNames,
          selectors: selectors
        })
      }
    }

    // Fill in data or add orphaned attribute
    for(let itemAttr in item.attributes){
      let hasAttribute = false;
      for(let card in cards){
        if(cards[card].name === item.attributes[itemAttr].name){
          cards[card].value = item.attributes[itemAttr].value;
          cards[card].isValid = true;
          hasAttribute = true;
        }
      }

      if(!hasAttribute){
        cards.push({
          name: item.attributes[itemAttr].name,
          value: item.attributes[itemAttr].value,
          category: "None",
          focused: false,
          type: 'text',
          isValid: true
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

  // Updates and cleans up the attributes and title
  onAttrValueSubmit(card: AttributeCard){
    let hasAttribute = false;
    card.focused = false;
    for(let attr in this.item.attributes){
      if(this.item.attributes[attr].name === card.name){
        this.item.attributes[attr].value = card.value ? card.value.trim() : '';
        hasAttribute = true;
      }
    }
    if(!hasAttribute && card.value){
      if(!this.item.attributes){
        this.item.attributes = [{
          name: card.name,
          value: card.value.trim()
        }];
      }
      else{
        this.item.attributes.push({
          name: card.name,
          value: card.value.trim()
        })
      }
    }

    // POST KNOWING IT'S JUST THE SAME THING:
    card.isValid = true;
  }

  onAttrOptionSubmit(card: AttributeCard, selectorIndex: number, optionIndex: number, option: string){
    // Update UI, possibly for another selector
    if(selectorIndex < card.selectors.length - 1){
      card.selectors.splice(selectorIndex+1, card.selectors.length-selectorIndex-1);
    }
    if(card.selectors[selectorIndex].options[optionIndex].dependentOptions){
      card.isValid = false;
      card.selectors.push({
        options: card.selectors[selectorIndex].options[optionIndex].dependentOptions
      });
    }
    else {
      card.isValid = true;
    }

    // Update item data
    let hasAttribute = false;
    for(let attr in this.item.attributes){
      if(this.item.attributes[attr].name === card.name){
        this.item.attributes[attr].value = '';
        for(let index = 0; index < card.selectors.length; index++){
          // Sometimes we have the card loaded with a selector but no value. In this case, don't bother to add that
          if(card.selectors[index].selectedValue){
            // If there's multiple layers, store the layer name followed by it's value
            if(card.layerNames){
              this.item.attributes[attr].value += card.layerNames[index] + '\n';
            }
            this.item.attributes[attr].value += card.selectors[index].selectedValue + '\n';
          }
        }
        hasAttribute = true;
      }
    }
    if(!hasAttribute){
      if(!this.item.attributes){
        this.item.attributes = [{
          name: card.name,
          value: card.layerNames ? card.layerNames[0] + '\n' + option + '\n' : option + '\n'
        }];
      }
      else{
        this.item.attributes.push({
          name: card.name,
          value: card.layerNames ? card.layerNames[0] + '\n' + option + '\n' : option + '\n'
        })
      }
    }
  }

  // After changing attributes, this updates the title
  rebuildTitle(){
    // Rebuild title
    let newSuffix = this.searchService.buildAttributeSuffixFrom(this.item, this.categoryAndAncestors);

    if(newSuffix){
      this.autoTitleBuilder = true;
    }

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
            // save for upload later
          });
        }
      };
    }
  }

  /**
   * Saves the item's image and updates the database
   */
  saveItemImage() {
    return this.imageService.putImage(this.item.imageUrl, this.item.ID).then(link => {
      this.item.imageUrl = link;
      this.placeIntoDB();
    });
  }

  deleteAttribute(card: AttributeCard){
    let deleteCardIndex = this.attributesForCard.indexOf(card);
    this.attributesForCard.splice(deleteCardIndex, 1);

    for(let attributeIndex in this.item.attributes){
      if(this.item.attributes[attributeIndex].name === card.name){
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
    else {
      if(this.additionalText){
        this.item.name = this.additionalText.trim() + this.attributeSuffix;
      }
      else {
        this.item.name = this.attributeSuffix;
      }
    }
  }

  checkPrefixOverwritten(): Boolean {
    return this.category.prefix === this.item.name.substring(0, this.category.prefix.length);
  }

  isReadyForNextStep(): Boolean {

    // Setup Category and Location
    if(this.step === 'basic'){
      // If we're still loading category
      if(!this.category){
        return false;
      }
      // If category is not assigned
      else if(this.category.ID == 'root'){
        return false;
      }
      // If we're still loading locations
      if(!this.locations){
        return false;
      }
      // If there is no location
      else if(this.locations.length == 0){
        return false;
      }
      // If it is the unassigned location
      else if(this.locations[0].ID === 'root'){
        return false;
      }
      // No problems, we're set to go
      return true;
    }

    else if(this.step === 'bins'){
      for(let _ in this.invalidBinIDErrors){
        return false;
      }
      return true;
    }

    else if(this.step === 'attributes'){
      // If we're still loading attributes
      if(!this.attributesForCard){
        return false;
      }
      else {
        // Go through each attribute and make sure it has a value
        for(let attr of this.attributesForCard){
          if(!attr.isValid){
            return false;
          }
        }
        return true;
      }
    }

    else if(this.step === 'title'){
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

  /*
  * Called when the auto title is triggered
  */
  onToggleAutoTitle(event){
    // If we just turned it on, replace old manual title
    if(event.checked){

      this.additionalText = '';
      this.rebuildTitle();
    }
  }

  submitBinID(location: HierarchyLocation, binInput, shelfID){
    let previousID = null;
    if(this.item.locationMetadata && this.item.locationMetadata[location.ID] && this.item.locationMetadata[location.ID].binID){
      previousID = this.item.locationMetadata[location.ID].binID;
    }

    // If we have it blank, leave values as null for deleting
    if(!binInput.value){
      this.addBinIDToBeSaved(location.ID, null, previousID);
    }

    // If the input has gotten too long, cut off the extra added
    if(binInput.value.length > 3){
      binInput.value = binInput.value.substring(0, 3);
    }
    
    // This is so then we're not directly messing with user input 
    // when filling in the other zeros
    let fullBinNumber: string = binInput.value;
    if(fullBinNumber.length < 3){
      for(let i = 0; i < 3-binInput.value.length; i++){
        fullBinNumber = '0' + fullBinNumber;
      }
    }

    // Build the new bin ID
    let binID = shelfID + "-" + fullBinNumber;
    // If the ID is the same as before, just exit
    if(previousID === binID){
      return;
    }
    
    // Check to make sure it's not being used by a different item
    let polledID = this.searchService.getItemIDFromBinID(binID);
    if(polledID === 'no ID'){
      // This means everything checks out

      // Add it to be saved to BinDictionary later
      this.addBinIDToBeSaved(location.ID, binID, previousID);

      // Update item data with new BinID
      if(this.item.locationMetadata){
        if(this.item.locationMetadata[location.ID]){
          this.item.locationMetadata[location.ID].binID = binID;
        }
        else {
          this.item.locationMetadata[location.ID] = {binID: binID};
        }
      }
      else {
        this.item.locationMetadata = {[location.ID] : {binID: binID}};
      }
    }
    else if(polledID === 'err'){
      this.invalidBinIDErrors[location.ID] = "There was an error retrieving your data.";
    }
    else if(polledID === this.item.ID){
      delete this.invalidBinIDErrors[location.ID];
    }
    else {
      this.invalidBinIDErrors[location.ID] = "Bin ID " + binID + " is already in use.";
    }
  }

  addBinIDToBeSaved(locationID: string, binID: string, previousID: string){
    let binIDtoSave = this.binIDsToSave[locationID];
    if(binIDtoSave){
      binIDtoSave.ID = binID;
    }
    else {
      this.binIDsToSave[locationID] = {
        ID: binID,
        previousID: previousID
      }
    }

    delete this.invalidBinIDErrors[locationID];
  }

  saveBinIDs(){
    this.adminService.addBinIDs(this.binIDsToSave, this.item.ID);
  }

  isCardIncomplete(card: AttributeCard){
    if(card.value){
      return false;
    }
    else if (card.selectors && !card.selectors[card.selectors.length-1].options){
      return false;
    }

    return true;
  }

  nextStep(){
    if(this.step === 'attributes'){
      this.rebuildTitle();
    }
    else if(this.step === 'picture' && this.singleStep && this.item.imageUrl && this.item.imageUrl !== '../../../assets/notFound.png'){
      this.saveItemImage();
    }

    if(this.singleStep){
      // Note: We don't need to do corrections for category/location saving because we pull up those modals directly
      if(this.step === 'bins'){
        this.saveBinIDs();
      }
      if(this.step !== 'picture'){
        this.placeIntoDB();
      }
      this.dialogRef.close({wasValid: true});
      return;
    }

    else {
      if(this.step === 'extras'){
        if(this.singleStep){
          this.router.navigate(['/item/' + this.item.ID]);
        }
        else {
          this.finish();
        }
      }

      else {
        this.step = this.getNextStep(this.step);
        window.scrollTo(0, 0);
      }
    }
  }

  getNextStep(step: string): string {
    switch(step){
      case 'basic': return 'bins';
      case 'bins': return 'attributes';
      case 'attributes': return 'title';
      case 'title': return 'picture';
      case 'picture': return 'extras';
      default: return 'exit';
    }
  }

  cancel(){
    this.dialogRef.close({wasValid: false});
  }

  finish(){
    this.adminService.createItemAtLocation(this.item).subscribe(id => {
      this.item.ID = id;
      if(this.item.imageUrl !== '../../../assets/notFound.png'){
        this.saveItemImage();
      }
      this.saveBinIDs();
      this.router.navigate(['/item/' + id]);
      this.dialogRef.close({wasValid: true});
    });
  }
}
