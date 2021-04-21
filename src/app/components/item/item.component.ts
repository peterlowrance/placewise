// adapted tree control from https://material.angular.io/components/tree/examples
import {Component, OnDestroy, OnInit, ElementRef, ViewChild} from '@angular/core';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {Item} from 'src/app/models/Item';
import {Report} from 'src/app/models/Report';
import {ItemReportModalData} from 'src/app/models/ItemReportModalData';
import {ActivatedRoute, Router} from '@angular/router';
import {SearchService} from 'src/app/services/search.service';
import {MatDialog} from '@angular/material/dialog';
import {ReportDialogComponent} from '../report-dialog/report-dialog.component';
import {HierarchyItem} from 'src/app/models/HierarchyItem';
import {NestedTreeControl} from '@angular/cdk/tree';
import {AuthService} from '../../services/auth.service';
import {FormBuilder} from '@angular/forms';
import {MatChipInputEvent} from '@angular/material/chips';
import {COMMA, ENTER, SPACE} from '@angular/cdk/keycodes';
import {AdminService} from 'src/app/services/admin.service';
import {ImageService} from '../../services/image.service';
import {ModifyHierarchyDialogComponent} from '../modify-hierarchy-dialog/modify-hierarchy-dialog.component';
import {NavService} from 'src/app/services/nav.service';
import {Observable, Subscription} from 'rxjs';
import {Location} from '@angular/common';
import {MatSnackBar} from '@angular/material';
import { Category } from 'src/app/models/Category';
import { trigger, style, transition, animate, keyframes} from '@angular/animations';
import { WorkspaceUser } from 'src/app/models/WorkspaceUser';
import { CacheService } from 'src/app/services/cache.service';
import {HierarchyLocation} from 'src/app/models/Location';
import { stringify } from '@angular/compiler/src/util';
import { ItemBuilderModalComponent } from '../item-builder-modal/item-builder-modal.component';


interface TreeNode {
  name: string;
  imageUrl: string;
  children: TreeNode[];
  ID: string;
}

interface AttributeCard {
  name: string;
  ID: string;
  value?: string;
  category: string;
  focused: boolean;
}

interface TrackingCard {
  name: string;
  locationID: string;
  type: string;
  isNumber: boolean;
  amount: any;
  cap?: number;
  isBeingEdited?: boolean;
}

interface TrackingData {
  type: string;
  isNumber: boolean;
  amount: any;
  cap?: number;
  isBeingEdited?: boolean;
}

interface ItemLocation {
  location: HierarchyLocation;
  ancestors?: HierarchyItem[];
  tracking: TrackingData;
  isPanelExtended?: Boolean;
}

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.css'],
  animations:[
    trigger('open-undo-fab', [
      transition(':enter', [
        animate('400ms', keyframes([
          style({opacity: 0}),
          style({opacity: 1})
        ]))
        ]
      )
    ])
  ]
})
export class ItemComponent implements OnInit, OnDestroy {

  constructor(
    private searchService: SearchService,
    private adminService: AdminService,
    private routeLocation: Location,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private authService: AuthService,
    private imageService: ImageService,
    private navService: NavService,
    private cacheService: CacheService,
    private router: Router,
    private snack: MatSnackBar
  ) {
  }

  readonly separatorKeysCodes: number[] = [ENTER, COMMA, SPACE];
  //edit fields for name and description
  @ViewChild('name', {static: false}) nameField: ElementRef;
  @ViewChild('desc', {static: false}) descField: ElementRef;
  @ViewChild('tags', {static: false}) tagsField: ElementRef;

  id: string; // item id
  item: Item; // item returned by id
  previousItem: Item; // records short term edits for saving
  originalItem: Item; // how the item was when we started, before edits were made
  attributeSuffix: string; // Current suffix text so then we don't calculate it every time

  // Subscriptions to destroy after leaving
  itemSub: Subscription;
  categorySub: Subscription;
  locationsSub: Subscription[];

  loading = true;  // whether the page is actively loading
  report: Report = {
    description: '',
    item: {
      ID: '0',
      name: '',
      imageUrl: ''
    },
    timestamp: 0,
    reporter: '',
    reportedTo: [],
    location: ''
  }; // user report
  errorDesc: ItemReportModalData = {valid: false, desc: '', selectedUsers: [], allUsers: []}; // user-reported error description
  expanded = false;  // is the more info panel expanded
  attributesExpanded = false;  // is the more info panel expanded
  isSaving = false;

  // category of the item
  category: Category;
  categoryAncestors: Category[];
  attributesForCard: AttributeCard[];

  itemLocations: ItemLocation[] = [];

  role: string; // user role for editing
  missingData: string; // string of data missing, null if nothing is missing
  recordingForPhoto = false;

  textEditFields: {
    name: boolean;
    desc: boolean;
    tags: boolean;
  } = {name: false, desc: false, tags: false};

  deleteSub: Subscription; // delete subscription

  getDirty(){ return this.navService.getDirty() }
  setDirty(value: boolean){ this.navService.setDirty(value); }


  ngOnInit() {

    // retrieve id
    this.id = this.route.snapshot.paramMap.get('id');

    let cache = this.cacheService.get(this.id, "item");

    //this.route.queryParamMap.subscribe(params => {
      // Retrieve data if this item should have a quick route back to where it came
    //});

    // If the item is in cache, we can load everything at once
    if(cache){
      window.scrollTo(0,0); 
      this.item = cache as Item;
      this.categorySub = this.setupCategorySubscription(this.item);
      //this.locationsSub = this.searchService.getAncestorsOf(this.item).subscribe(locations => {this.locationsAndAncestors = locations;});
    }

    // Start live subscription
    this.itemSub = this.searchService.getItem(this.id).subscribe(item => {
      if (!item) {
        return;
      }
      this.item = item;

      // Setup change/revert tracking info
      if(!this.originalItem) { // We don't want to overwrite if there's already old data
        this.originalItem = JSON.parse(JSON.stringify(item));
        this.previousItem = JSON.parse(JSON.stringify(item));
      }

      //if(locationSub)
      // Go through each location and build a tracker for each
      this.locationsSub = this.setupLocationsSubscriptions(item);
      
      // If there was cache, remove it
      if(cache){
        cache = null;
      }

      // Otherwise, this has not been fully loaded yet
      else {
        // Load category
        if(this.categorySub) this.categorySub.unsubscribe();
        this.categorySub = this.setupCategorySubscription(item);
        
        // Load locations
        /*
        if(this.locationsSub) this.locationsSub.unsubscribe();
        this.locationsSub = 
        */
      }

    });

    // get user role
    this.role = this.authService.role;

  }

  linkTo(objID: string, type: string){
    if(type === "category"){
      this.router.navigate(['/search/categories/' + objID]);
    }
    else if(type === "location") {
      this.router.navigate(['/search/locations/' + objID]);
    }
  }

  
  private setupCategorySubscription(item: Item): Subscription { // I could also take in Obs<Cat> if that helps in the future
    // Return it for unsubscribing
    return this.searchService.getCategory(item.category).subscribe(category => {
      this.category = category;

      // Load category ancestors for attributes
      this.searchService.getAncestorsOf(category).subscribe(categoryAncestors => {

        // Make sure it exists, and also make sure it's not just an empty array
        if(categoryAncestors[0]){
          // Update component data
          this.categoryAncestors = categoryAncestors[0];
          this.attributeSuffix = this.searchService.buildAttributeSuffixFrom(item, this.categoryAncestors);
          
          // Load item attributes into card data
          let rebuiltCards = this.loadAttributesForCards([category].concat(categoryAncestors[0]), item);

          // If we'd never had them loaded or the amount of cards/attributes have changed, update them
          if(!this.attributesForCard || this.attributesForCard.length !== rebuiltCards.length){
            this.attributesForCard = rebuiltCards;
          }

          // Otherwise, update the neccesary information but keep the structure
          // This is so that when users enter data, they don't get kicked out of text fields
          // since the UI would be completely replacing them.
          else {
            // Go through the cards and update the info
            for(let newCard in rebuiltCards){
              let found = false;
              for(let originalCard in this.attributesForCard){
                if(this.attributesForCard[originalCard].ID === rebuiltCards[newCard].ID){
                  found = true;
                  // Deep check to see if it needs updated
                  if(JSON.stringify(this.attributesForCard[originalCard]) !== JSON.stringify(rebuiltCards[newCard])){
                    this.attributesForCard[originalCard] = rebuiltCards[newCard]
                  }
                  break;
                }
              }
              // Attributes didn't align, so just reset
              if(!found){
                this.attributesForCard = rebuiltCards; 
                break;
              }
            }
          }
        }
        else { // Otherwise it's just root? Does loading attributes make sense here?
          this.attributesForCard = this.loadAttributesForCards([category], item)
        }
      })
    });
  }

  private setupLocationsSubscriptions(item: Item): Subscription[] {
    let subs: Subscription[] = [];

    // Delete any locations that are not included in the item now
    for(let dataIndex in this.itemLocations){
      let found = false;
      for(let locationID of item.locations){
        if(this.itemLocations[dataIndex].location.ID === locationID){
          found = true;
          break;
        }
      }

      if(!found){
        this.itemLocations.splice(Number.parseInt(dataIndex), 1);
      }
    }

    // Subscribe to the locations individually
    for(let locIndex in item.locations){
      let sub = this.searchService.getLocation(item.locations[locIndex]).subscribe(location => {
        let tracking: TrackingData;
        let found = false;
        
        // First try to find tracking data for this location that already exists on the item
        if(item.tracking)
        for(let tracked of item.tracking){
          if(tracked.locationID === location.ID){
            found = true;
            let isNumber = tracked.type.startsWith('number');
            let cap = isNumber ? parseInt(tracked.type.substring(7)) : 0; // If there's a cap, it will be formatted like "number,[number]" so start at 7 to read it

            tracking = { type: tracked.type, isNumber, amount: tracked.amount, cap }
            break;
          }
        };

        // Otherwise, fill in default tracking data
        if(!found){
          tracking = { type: "amount", isNumber: false, amount: "Good", cap: 0 }
        }
        
        // See if there's already an ItemLocation corresponding to this and update it.
        let index = this.itemLocations.findIndex((elem) => {return elem.location.ID === location.ID});
        if(index > -1){
          this.itemLocations[index].location = location;
          this.itemLocations[index].tracking = tracking;
        }
        // Otherwise, add the new location
        else {
          this.itemLocations.push({location, tracking, isPanelExtended: item.locations.length < 2});
        }
      })
      subs.push(sub);
    }
    return subs;
  }

  ngOnDestroy() {
    if(this.itemSub) this.itemSub.unsubscribe();
    if(this.categorySub) this.categorySub.unsubscribe();
    //this.locationsSub.unsubscribe();
  }

  toggleMoreInfo() {
    this.expanded = !this.expanded;
  }

  toggleAttributeInfo() {
    this.attributesExpanded = !this.attributesExpanded;
  }

  toggleNumberTrackingForLocation(locationID: string) {
    for(let locationData of this.itemLocations){
      if(locationData.location.ID === locationID){
        if(locationData.tracking.isNumber){ // New value hasn't been set yet so this is reversed
          locationData.tracking.amount = 'Good';

          for(let trackingData of this.item.tracking){
            
            if(trackingData.locationID === locationID){
              trackingData.type = 'approx';
              trackingData.amount = 'Good';
              break;
            }
          }
        }
        else {
          locationData.tracking.amount = 0;

          let found = false;
          for(let trackingData of this.item.tracking){
            if(trackingData.locationID === locationID){
              found = true;
              trackingData.type = 'number,0';
              trackingData.amount = 0;
              break;
            }
          }
          if(!found){
            if(this.item.tracking){
              this.item.tracking.push({locationID: locationID, type: 'number,0', amount: 0});
            }
            else {
              this.item.tracking = [{locationID: locationID, type: 'number,0', amount: 0}];
            }
          }
        }
      }
    }

    this.checkDirty();
  }

  closeEditingTrackingNumber(card: TrackingData, locationID){
    card.isBeingEdited = false;
    for(let dataCard in this.item.tracking){
      if(this.item.tracking[dataCard].locationID === locationID){
        this.item.tracking[dataCard].amount = card.amount;
      }
    }

    this.checkDirty();
  }

  // Auto report number
  updateTrackingCap(card: TrackingData, locationID){
    // @ts-ignore capFocus is not apart of code, just for UI
    card.capFocus = false;

    for(let dataCard in this.item.tracking){
      if(this.item.tracking[dataCard].locationID === locationID){
        this.item.tracking[dataCard].type = 'number,' + card.cap;
      }
    }
    this.checkDirty();
  }

  modifyTrackingNumber(locationID: string, modification: string, type: string, amount = 0){
    if(modification === 'Replace'){
      this.setTrackingAmount(locationID, amount, type, false);
    }
    else if (modification === 'subtract one'){
      if(amount <= 0) return;
      this.setTrackingAmount(locationID, amount-1, type);
    }
    else if (modification === 'add one'){
      this.setTrackingAmount(locationID, amount+1, type, false);
    }
  }

  setTrackingAmount(locationID: string, value: any, type: string = "approx", sendReport = true){
    // For Database
    if(this.role !== 'Admin'){
      this.adminService.updateTracking(locationID, this.item.ID, 'approx', value).then(
        (fulfilled) => this.updateUITrackingData(locationID, value),
      (reject) => {
        console.log("Tracking Update Rejected: " + JSON.stringify(reject));
      })
    }
    else {
      let found = false;
      for(let dataCard in this.item.tracking){
        if(this.item.tracking[dataCard].locationID === locationID){
          this.item.tracking[dataCard].amount = value;
          found = true;
          break;
        }
      }
      if(!found){
        if(this.item.tracking){
          this.item.tracking.push({locationID: locationID, type, amount: value});
        }
        else {
          this.item.tracking = [{locationID: locationID, type, amount: value}];
        }
      }

      this.updateUITrackingData(locationID, value)
      this.checkDirty();
    }
  }

  updateUITrackingData(locationID: string, value: string){
    for(let data of this.itemLocations){ // For UI
      if(data.location.ID === locationID){
        data.tracking.amount = value;
        break;
      }
    }
  }

  createReport() {
    const dialogRef = this.dialog.open(ReportDialogComponent, {
      width: '30rem',
      data: {
        item: this.item,
        locations: this.itemLocations.map(data => { return data.location})
      }
    });
  }

  /**
   * Takes in the element we want to edit and displays the according modal
   * @param field the string name of the item field to edit
   */
  editField(field: string) {
    // Find and open the according modal
    let modalStep = -1;
    switch (field) {
      case 'Attributes': modalStep = 1; break;
      case 'Category': this.editCategory(); break;
      case 'Description': modalStep = 4; break;
      case 'Image': modalStep = 3; break;
      case 'Location': this.editLocation(); break;
      case 'Tags': modalStep = 4; break;
      case 'Title': modalStep = 2; break;
      default: break;
    }

    // Open the item builder modal if applicable
    if(modalStep > -1){
      this.dialog.open(ItemBuilderModalComponent, {
        width: '480px',
        data: {hierarchyObj: this.item, step: modalStep}
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

      this.adminService.updateItem(this.item, null, oldLocations); // TODO: Not good placement, seperate from main saving mechanism
      this.setDirty(true);

      // Update recent locations
      for(let index in newLocations){
        let localSub = this.searchService.getLocation(newLocations[index]).subscribe(loc => {
          this.adminService.addToRecent(loc);
          localSub.unsubscribe(); // Don't want this screwing with us later
        })
      }
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
  
          this.searchService.getAncestorsOf(newCategory).subscribe(categoryAncestors => this.categoryAncestors = categoryAncestors[0])
          localSub.unsubscribe(); // Don't want this screwing with us later
          this.adminService.updateItem(this.item, oldCategory, null); // TODO: Not good placement, seperate from normal saving routine
        }
      });
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

  /**
   * Checks to see if the current item is dirty (edited)
   */
  checkDirty() {
    if (JSON.stringify(this.item) === JSON.stringify(this.previousItem)) {
      this.setDirty(false);
      return false;
    } else {
      this.setDirty(true);
      this.saveItem();
      return true;
    }
  }

  /*
  * ITEM DISPLAY ONLY (Don't bring this over in the future for item builder)
  * Undoes all modifications while the user was on this page
  */
  undoChanges(original: Item = this.originalItem) {
    let itemToRevert = this.item;
    this.item = JSON.parse(JSON.stringify(this.originalItem)); // Copy so then the original stays original
    
    if(this.item.category !== itemToRevert.category){
      this.updateItemCategory([this.item.category], itemToRevert.category);
    }
    if(this.item.locations !== itemToRevert.locations){
      this.updateItemLocations(this.item.locations, itemToRevert.locations);
    }

    this.saveItem();
    this.setDirty(false);
  }

  /**
   * Saves the item to the database, sets not dirty, and sets previousItem
   */
  async saveItem() {
    this.isSaving = true;

    // first, upload the image if edited, upload when we get the new ID
    if (this.previousItem.imageUrl !== this.item.imageUrl) {
      return this.imageService.putImage(this.item.imageUrl, this.item.ID).then(link => {
        this.item.imageUrl = link;
        this.placeIntoDB();
      });
    } else {
      //else just place
      return this.placeIntoDB();
    }

  }

  /**
   * Places the item into the database
   */
  async placeIntoDB() {
    return this.adminService.updateItem(this.item, null, null).then(val => {
      this.isSaving = false;
      this.previousItem = JSON.parse(JSON.stringify(this.item)); // Update short term changes
    },
    reject => {
      this.snack.open('Item Save Failed: ' + reject, "OK", {duration: 3000, panelClass: ['mat-warn']});
      this.undoChanges(this.previousItem); // Revert to last saved data
    });
  }

  async requestDelete() {
      if (confirm('Are you sure you want to delete the item?\nThis cannot be undone.')) {
        //remove image if exists, else just remove item
        if (this.item.imageUrl !== null && typeof this.item.imageUrl !== 'undefined'
          && this.item.imageUrl !== '../../../assets/notFound.png') {
          return this.imageService.removeImage(this.item.ID).then(() => {
            this.removeFromDB();
          });
        } else { // else just delete from the DB
          return this.removeFromDB();
        }
      }
  }

  /**
   * Removes the current item from the firebase DB
   */
  async removeFromDB() {
    //remove image
    return this.adminService.removeItem(this.item).toPromise().then(val => {
      if (val) {
        this.snack.open('Item Successfully Deleted', "OK", {duration: 2000, panelClass: ['mat-toolbar']});
        this.navService.returnState();
        this.routeLocation.back();
      } else this.snack.open('Item Deletion Failed', "OK", {duration: 3000, panelClass: ['mat-warn']});
    });
  }

}
