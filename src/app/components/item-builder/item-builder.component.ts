import { Component, OnInit } from '@angular/core';
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
    private snack: MatSnackBar
    ) { }

    readonly separatorKeysCodes: number[] = [ENTER, COMMA, SPACE];
    readonly MAX_STEP = 4;
    readonly MIN_STEP = 0;

    id: string;                               // item id
    step = -1;                                 // What step are we at in filling in data
    item: Item;                               // Item being setup
    category: Category;                       // Category of the item
    categoryAncestors: Category[];            // All of the Category's parents
    locationsAndAncestors: HierarchyItem[][]; // The locations and their ancestors
    attributesForCard: AttributeCard[];       // Attributes of the item, for the UI
    additionalText: string;                   // Helps with setting up the title

  ngOnInit() {
    // retrieve id
    this.id = this.route.snapshot.paramMap.get('id');
    // Actively retrieve if the step changes
    this.route.queryParamMap.subscribe(params => {
      this.step = Number(params.get('step'));
      if(this.step > this.MAX_STEP || this.step < this.MIN_STEP){
        this.router.navigate(['/item/' + this.id], {replaceUrl:true});
      }
    })

    this.searchService.getItem(this.id).subscribe(item => {
      if (!item) {
        return;
      }
      this.item = item;

      this.searchService.getCategory(item.category).subscribe(category => {
        this.category = category;

        // Setup additional text if there's extra. 
        // This also means if the title is significantly different, it will not show. I believe this is best as this is setting something up like it is new.
        if(category.prefix){
          if(category.prefix === item.name.substring(0, category.prefix.length) && category.prefix.length < item.name.length){
            this.additionalText = item.name.substring(category.prefix.length);
          }
        }
        

        this.searchService.getAncestorsOf(category).subscribe(categoryAncestors => {
          if(categoryAncestors[0]){ //Sometimes it returns a sad empty array, cache seems to mess with the initial return
            this.categoryAncestors = categoryAncestors[0];
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
   * Updates the item's category
   * @param result The new category/s chosen
   * @param oldCategory old category
   */
  updateItemCategory(result: string[], oldCategory: string) {
    if (result && result.length > 0 && this.item.category !== result[0]) {
      this.item.category = result[0];
      let localSub = this.searchService.getCategory(result[0]).subscribe(newCategory => {
        if(newCategory){
          this.adminService.addToRecent(newCategory);

          if(newCategory.prefix){
            if(!this.item.name){ // If the item doesn't have a name yet, jsut set it to be the prefix
              this.item.name = newCategory.prefix;
              this.item.fullTitle = this.item.name + this.buildAttributeString();
            }
            else if(!this.item.name.startsWith(newCategory.prefix)){ // Replace old prefix if it's there
              if(this.category.prefix && this.item.name.startsWith(this.category.prefix)){
                this.item.name = newCategory.prefix + " " + this.item.name.substring(this.category.prefix.length-1, this.item.name.length-1).trim();
              } else {
                this.item.name = newCategory.prefix + " " + this.item.name;
              }
            }
          }
          else if(newCategory.ID !== 'root'){ // If it has no prefix but it's not the root, make the name blank
            this.item.name = '';
            this.item.fullTitle = this.item.name + this.buildAttributeString();
          }
  
          this.searchService.getAncestorsOf(newCategory).subscribe(categoryAncestors => this.categoryAncestors = categoryAncestors[0]);
          localSub.unsubscribe(); // Don't want this screwing with us later
          this.adminService.updateItem(this.item, oldCategory, null); // TODO: Not good placement, seperate from normal saving routine
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

  // YIKES REPEATED CODE
  buildAttributeString(category: Category = this.category): string {
    if(!this.category){
      return '';
    }

    let buildingString = '';
    for(let suffixIndex in category.suffixStructure){
      let id = category.suffixStructure[suffixIndex].attributeID;

      if(id === 'parent'){
        for(let index in this.categoryAncestors){
          if(this.categoryAncestors[index].ID === category.parent){
            buildingString += category.suffixStructure[suffixIndex].beforeText + 
            this.buildAttributeString(this.categoryAncestors[index]) +
            category.suffixStructure[suffixIndex].afterText;
          }
        }
      }

      else {
        for(let attr in this.item.attributes){
          if(this.item.attributes[attr].ID === id){
            if(this.item.attributes[attr].value){ // Don't insert anything if there's no value
              buildingString += category.suffixStructure[suffixIndex].beforeText + 
              this.item.attributes[attr].value +
              category.suffixStructure[suffixIndex].afterText;
            }
          }
        }
      }
    }
    return buildingString;
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
    this.item.fullTitle = this.item.name + this.buildAttributeString();
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
            this.nextStep();
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

    // check dirty
    this.placeIntoDB();
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
  // ACTUAL DIFFERENCES FROM ITEM DISPLAY
  //

  updateTitleFromUI(){
    if(this.category.prefix){
      this.item.name = this.category.prefix + this.additionalText;
    }
    else {
      this.item.name = this.additionalText;
    }
    this.item.fullTitle = this.item.name + this.buildAttributeString();
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
      if(!this.item.fullTitle){
        return false;
      }

      // Currently just asks you to make sure it's good
      return true;
    }

    // Default to false
    return false;
  }

  nextStep(){
    if(this.step == 1 || this.step == 2){
      this.placeIntoDB();
    }
    //this.step += 1;
    this.router.navigate(['/itemBuilder/' + this.id], { queryParams: { step: this.step + 1 } });
  }

}
