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
    reportedTo: []
  }; // user report
  errorDesc: ItemReportModalData = {valid: false, desc: '', selectedUsers: [], allUsers: []}; // user-reported error description
  expanded = false;  // is the more info panel expanded
  attributesExpanded = false;  // is the more info panel expanded
  isSaving = false;

  // category of the item
  category: Category;
  categoryAncestors: Category[];
  locationsAndAncestors: HierarchyItem[][];
  attributesForCard: AttributeCard[];
  trackingCards: TrackingCard[] = [];

  itemLocations: [{
    location: Location;
    ancestors?: HierarchyItem[];
  }]

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

      // Location chain loading TEST
      console.time("chain test");
      this.searchService.getLocationAncestorsByChain(item.locations[0]).then((data) => {
        console.timeEnd("chain test");
        console.log(data);
      })

      // Setup change/revert tracking info
      if(!this.originalItem) { // We don't want to overwrite if there's already old data
        this.originalItem = JSON.parse(JSON.stringify(item));
        this.previousItem = JSON.parse(JSON.stringify(item));
      }

      // Go through each location and build a tracker for each
      for(let location in item.locations){
        let found = false;

        // First try to find tracking data that already exists
        for(let tracked in item.tracking){
          if(item.tracking[tracked].locationID === item.locations[location]){
            found = true;

            let localSub = this.searchService.getLocation(item.locations[location]).subscribe(loc => {
              if(loc){
                let cardFound = false;
                let isNumber = item.tracking[tracked].type.startsWith('number');
                let cap = isNumber ? parseInt(item.tracking[tracked].type.substring(7)) : 0; // If there's a cap, it will be formatted like "number,[number]" so start at 7 to read it

                for(let card in this.trackingCards){
                  if(this.trackingCards[card].locationID === item.locations[location]){
                    cardFound = true;
                    this.trackingCards[card] = {name: loc.name, locationID: item.locations[location], type: item.tracking[tracked].type, isNumber, amount: item.tracking[tracked].amount, cap};
                    break;
                  }
                }

                if(!cardFound){
                  this.trackingCards.push({ name: loc.name, locationID: item.locations[location], type: item.tracking[tracked].type, isNumber, amount: item.tracking[tracked].amount, cap});
                }
                localSub.unsubscribe();
              }
            })
            break;
          }
        }
        if(!found){
          let foundEmptyCard = false;
          for(let card in this.trackingCards){ // This is so then we aren't re-adding cards that have the tracking turned off
            if(this.trackingCards[card].locationID === item.locations[location]){
              foundEmptyCard = true;
              break;
            }
          }
          if(!foundEmptyCard){
            let localSub = this.searchService.getLocation(item.locations[location]).subscribe(loc => {
              if(loc){
                this.trackingCards.push({ name: loc.name, locationID: item.locations[location], type: 'approx', isNumber: false, amount: 'Good'});
                localSub.unsubscribe();
              }
            })
          }
        }
      }
      
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
        this.searchService.getAncestorsOf(item).subscribe(locations => {
          this.locationsAndAncestors = locations;
        });
      }

    });

    // get user role
    this.role = this.authService.role;

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
          this.attributeSuffix = this.searchService.buildAttributeSuffixFrom(item, this.categoryAncestors)
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

        // Display missing data
        this.missingData = this.formatMissingDataString(item);
      })
    });
  }

  private setupLocationsSubscriptions(item: Item): Subscription[] {
    let subs: Subscription[] = [];

    // Setup empty space for all of the location data to be loaded into
    this.locationsAndAncestors = [];
    for(let i = 0; i < item.locations.length; i++){
      this.locationsAndAncestors.push([]);
    }

    // Subscribe to the locations
    for(let locIndex in item.locations){
      let sub = this.searchService.getLocation(item.locations[locIndex]).subscribe(location => {
        // NEXT
      })
      subs.push(sub);
    }
    return subs;
  }

  ngOnDestroy() {
    this.itemSub.unsubscribe();
    this.categorySub.unsubscribe();
    //this.locationsSub.unsubscribe();
  }

  formatMissingDataString(item: Item): string {
    let builtString = "";
    if(item.category === "root"){
      builtString += "No category";
    }
    if(item.locations.length == 0 || (item.locations.length == 1 && item.locations[0] === "root")){
      if(builtString === ""){
        builtString += "No locations"
      } else {
        builtString += " or locations"
      }
    }
    if(this.attributesForCard){
      for(let card in this.attributesForCard){
        if(!this.attributesForCard[card].value){
          if(builtString ===""){
            builtString += "Missing attributes";
          } else {
            builtString += ", missing attributes"
          }
          break;
        }
      }
    }
    if(builtString === ""){
      builtString = null;
    }
    return builtString;
  }

  toggleMoreInfo() {
    this.expanded = !this.expanded;
  }

  toggleAttributeInfo() {
    this.attributesExpanded = !this.attributesExpanded;
  }

  toggleNumberTrackingForLocation(locationID: string) {
    for(let card in this.trackingCards){
      if(this.trackingCards[card].locationID === locationID){
        if(this.trackingCards[card].isNumber){ // New value hasn't been set yet so this is reversed
          this.trackingCards[card].amount = 'Good';

          for(let dataCard in this.item.tracking){
            if(this.item.tracking[dataCard].locationID === locationID){
              this.item.tracking[dataCard].type = 'approx';
              this.item.tracking[dataCard].amount = 'Good';
              break;
            }
          }
        }
        else {
          this.trackingCards[card].amount = 0;

          let found = false;
          for(let dataCard in this.item.tracking){
            if(this.item.tracking[dataCard].locationID === locationID){
              found = true;
              this.item.tracking[dataCard].type = 'number,0';
              this.item.tracking[dataCard].amount = 0;
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

  closeEditingTrackingNumber(card: TrackingCard){
    card.isBeingEdited = false;
    for(let dataCard in this.item.tracking){
      if(this.item.tracking[dataCard].locationID === card.locationID){
        this.item.tracking[dataCard].amount = card.amount;
      }
    }

    this.checkDirty();
  }

  // Auto report number
  updateTrackingCap(card: TrackingCard){
    // @ts-ignore capFocus is not apart of code, just for UI
    card.capFocus = false;

    for(let dataCard in this.item.tracking){
      if(this.item.tracking[dataCard].locationID === card.locationID){
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
        (fulfilled) => this.setLocalTrackingCard(locationID, value),
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

      this.setLocalTrackingCard(locationID, value)
      this.checkDirty();
    }

    // For reporting
    if(sendReport){
      if(type === 'approx'){
        if(value !== "Good"){
          this.sendAutoReport(value);
        }
      }
      else if(type.startsWith('number')){
        if(value <= parseInt(type.substring(7))){
          this.sendAutoReport(value);
        }
      }
    }
  }

  setLocalTrackingCard(locationID: string, value: string){
    for(let card in this.trackingCards){ // For UI
      if(this.trackingCards[card].locationID === locationID){
        this.trackingCards[card].amount = value;
        break;
      }
    }
  }

  createReport() {
    // reset report data, ensure clicking out defaults to fail and no double send
    this.errorDesc = {valid: false, desc: '', selectedUsers: [], allUsers: []};
    let reportedTo = this.adminService.getWorkspaceUsers().subscribe(users => {
      if(users && users.length === this.authService.usersInWorkspace){

        // Load admins for selection
        let admins: WorkspaceUser[] = users.filter(element => { return element.role === "Admin" });
        // Load selected people to report to
        let defaults: WorkspaceUser[] = admins.filter(element => { return this.authService.workspace.defaultUsersForReports.indexOf(element.id) > -1 });

        reportedTo.unsubscribe(); // Immediately unsubscribe, don't want this dialog to pop up again
        // NOTE: This will not work well when you are the only person being reported to

        const dialogRef = this.dialog.open(ReportDialogComponent, {
          width: '30rem',
          data: {
            valid: this.errorDesc.valid,
            desc: this.errorDesc.desc,
            selectedUsers: defaults,
            allUsers: admins
          }
        });
    
        dialogRef.afterClosed().subscribe(result => {
          if (result) this.issueReport(result);
        });
      }
    });
  }

  /**
   * Issues a report to the backend DB
   * @param result The resulting report from the report modal
   */
  issueReport(result: ItemReportModalData) {
    this.errorDesc = result;
    // if it's valid, build and issue report, else leave
    if (this.errorDesc.valid) {
      this.report.description = this.errorDesc.desc;
      this.report.item.name = this.item.name; // old
      this.report.item.ID = this.item.ID;
      this.report.item.imageUrl = this.item.imageUrl; // old
      this.report.timestamp = new Date().getUTCSeconds(); // old

      // Issue report
      return this.adminService.placeReport(this.report.item.ID, this.report.description, result.selectedUsers.map(user => user.id)).then(
        () => this.snack.open("Report Sent", "OK", {duration: 3000, panelClass: ['mat-toolbar']}),
        (err) => {
          this.snack.open("Report Failed, " + err.status, "OK", {duration: 10000, panelClass: ['mat-toolbar']})
          console.log(JSON.stringify(err));
        }
      );
    }
  }

  sendAutoReport(amount: any) {
    let desc = "Low";
    if(amount === "Low"){
      desc = "Auto Report: Item is low on supply.";
    } 
    else if (amount === "Empty") {
      desc = "Auto Report: There's no items left!";
    }
    else if (amount === 0) {
      desc = "Auto Report: There's no items left!";
    } 
    else {
      desc = "Auto Report: There's only " + amount + " left in stock.";
    }
    this.report.description = desc;
    this.report.item.name = this.item.name;
    this.report.item.ID = this.item.ID;
    this.report.item.imageUrl = this.item.imageUrl;
    this.report.timestamp = new Date().getUTCSeconds();

    return this.adminService.placeReport(this.report.item.ID, this.report.description, this.authService.workspace.defaultUsersForReports).then(
      () => this.snack.open("Report Sent", "OK", {duration: 3000, panelClass: ['mat-toolbar']}),
      (err) => this.snack.open("Report Failed, " + err.status, "OK", {duration: 3000, panelClass: ['mat-toolbar']})
    );
  }

  /**
   * A field edit handler
   * @param field the string name of the item field to edit
   */
  editField(field: string) {
    // set edit field value to enable state change, then set focus
    switch (field) {
      case 'name': 
        //this.textEditFields.name = true;
        // focus
        //setTimeout(() => this.nameField.nativeElement.focus(), 0);
        this.router.navigate(['/itemBuilder/' + this.id], { queryParams: { step: 2, singleStep: true } });
        break;
      case 'desc':
        this.textEditFields.desc = true;
        // focus
        setTimeout(() => this.descField.nativeElement.focus(), 0);
        break;
      case 'tags':
        this.textEditFields.tags = true;
        // focus
        setTimeout(() => this.tagsField.nativeElement.focus(), 0);
        break;
      default:
        break;
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
      for(let oldLocIndex in oldLocations){
        if(newLocations.indexOf(oldLocations[oldLocIndex]) === -1){
          for(let cardIndex in this.trackingCards){
            if(this.trackingCards[cardIndex].locationID === oldLocations[oldLocIndex]){
              this.trackingCards.splice(parseInt(cardIndex), 1);
            }
          }
        }
      }

      this.adminService.updateItem(this.item, null, oldLocations); // TODO: Not good placement, seperate from main saving mechanism
      this.setDirty(true);
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

          /*                                 TODO
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
          */
  
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
    this.checkDirty();
  }

  deleteAttribute(card: AttributeCard){
    let deleteCardIndex = this.attributesForCard.indexOf(card);
    this.attributesForCard.splice(deleteCardIndex, 1);

    for(let attributeIndex in this.item.attributes){
      if(this.item.attributes[attributeIndex].ID === card.ID){
        this.item.attributes.splice(Number.parseInt(attributeIndex), 1);
      }
    }
    this.checkDirty();
  }

  /**
   * Handles logic for submitting the name
   */
  onNameSubmit() {
    // check to see if name is valid
    if (this.item.name !== '') {
      // this.item.name = this.nameForm.value;
      // hide control
      this.textEditFields.name = false;
    } else {
      this.item.name = this.previousItem.name;
      // TODO: show snackbar
    }

    // check for dirtiness
    this.checkDirty();
  }

  /**
   * Handles logic for submitting the description
   */
  onDescSubmit() {
    // check to see if name is valid
    if (this.item.desc !== '') {
      // this.item.name = this.nameForm.value;
      // hide control
      this.textEditFields.desc = false;
    } else {
      this.item.desc = this.previousItem.desc;
      // TODO: show snackbar
    }

    // check for dirtiness
    this.checkDirty();
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
            // set dirty and save for upload
            this.checkDirty();
          });
        }
      };
    }
  }

  /** Tag control: https://material.angular.io/components/chips/examples */

  /**
   * Adds a tag to the list
   * @param event tag input event
   */
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
    this.checkDirty();
  }

  /**
   * Removes a tag from the list
   * @param tag string tag to remove
   */
  removeTag(tag: string): void {
    const index = this.item.tags.indexOf(tag);

    if (index >= 0) {
      this.item.tags.splice(index, 1);
    }

    // check dirty
    this.checkDirty();
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

  buildAttributeString(category: Category = this.category): string {
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
        this.snack.open('Item Successfully Deleted', "OK", {duration: 3000, panelClass: ['mat-toolbar']});
        this.navService.returnState();
        this.routeLocation.back();
      } else this.snack.open('Item Deletion Failed', "OK", {duration: 3000, panelClass: ['mat-warn']});
    });
  }

}
