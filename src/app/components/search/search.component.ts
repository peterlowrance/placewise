import {Component, OnDestroy, OnInit, ComponentFactoryResolver, ViewChild, ElementRef} from '@angular/core';
import {Item} from '../../models/Item';
import {ActivatedRoute, Router} from '@angular/router';
import {HierarchyItem} from '../../models/HierarchyItem';
import {FormControl} from '@angular/forms';
import {SearchService} from '../../services/search.service';
import {NavService} from '../../services/nav.service';
import {Observable, Subscription} from 'rxjs';
import {AuthService} from 'src/app/services/auth.service';
import * as Fuse from 'fuse.js';
import {AdminService} from 'src/app/services/admin.service';
import {MatDialog, throwMatDialogContentAlreadyAttachedError} from '@angular/material/dialog';
import { trigger, state, style, transition, animate, keyframes} from '@angular/animations';
import { Category } from 'src/app/models/Category';
import { switchMap } from 'rxjs/operators';
import { url } from 'inspector';
import { Identifiers } from '@angular/compiler';
import { CacheService } from 'src/app/services/cache.service';
import { ItemBuilderModalComponent } from '../item-builder-modal/item-builder-modal.component';
import { Attribute } from 'src/app/models/Attribute';
import { AttributeValue } from 'src/app/models/Attribute';
import { AdvancedAlphaNumSort } from 'src/app/utils/AdvancedAlphaNumSort';
import { HierarchyLocation } from 'src/app/models/Location';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QRScannerDialogComponent } from '../qrscanner-dialog/qrscanner-dialog.component';
import { QRCodeCategoryDialogComponent } from '../qrcode-category-dialog/qrcode-category-dialog.component';
import { QRCodeLocationDialogComponent } from '../qrcode-location-dialog/qrcode-location-dialog.component';

/**
 *
 * TODO: displays multiple items on startup in layer with items, problem with calling
 * displayDescendents once and then loadLevel (which calls displayDescendents)
 *
 */

@Component({
  selector: 'app-home',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
  animations:[
    trigger('button-extention-item', [
      state('shrunk', style({width: '50px', visibility: 'hidden', pointerEvents: 'none', display: 'none'})),
      state('extended', style({width: '80px', visibility: 'visible', pointerEvents: 'auto', display: 'block'})),
      transition('shrunk <=> extended', animate('250ms'))
    ]),
    trigger('button-extention-hierarchy', [
      state('shrunk', style({width: '90px', visibility: 'hidden', pointerEvents: 'none', display: 'none'})),
      state('extended', style({width: '140px', visibility: 'visible', pointerEvents: 'auto', display: 'block'})),
      transition('shrunk <=> extended', animate('250ms'))
    ]),
    trigger('binInput', [
      state('open', style({
        top: '150px'
      })),
      state('closed', style({
        top: '0px'
      })),
      transition('open <=> closed', [
        animate('0.18s ease-out')
      ]),
    ]),
    trigger('searchInput', [
      state('open', style({
        marginTop: '32px', marginBottom: '8px'
      })),
      state('closed', style({
        marginTop: '-80px', marginBottom: '32px'
      })),
      transition('open <=> closed', [
        animate('0.18s ease-out')
      ]),
    ])
  ]
})
export class SearchComponent implements OnInit, OnDestroy {
  @ViewChild("binInput") binInput: ElementRef;
  @ViewChild("shelfInput") shelfInput: ElementRef;
  @ViewChild("searchInput") searchInput: ElementRef;

  control = new FormControl();
  root: HierarchyItem;
  rootSub: Subscription;

  workspaceID: string;
  hierarchyItems: HierarchyItem[];
  originalHierarchyItems: HierarchyItem[];
  items: Item[];
  binItems: Item[];
  originalItems: Item[];
  obsItems: {[itemId: string] : Observable<Item>} = {}; // For cache
  subItems: {[itemId: string] : Subscription} = {}; // For cache

  columns: number;
  previousSearch = '';
  previousSearchRoot = '';
  isLoading = false;
  isLoadingAttributes = false;
  percentLoadedAttributes = 0;
  filterableAttributes: Attribute[] // For selecting which ones to filter by
  attributeValues: string[];
  originalAttributeValues: string[]; // For resetting after searching
  currentAttribute: AttributeValue; // For the current attribute that that values are being searched for
  filteredAttributes: AttributeValue[]; // Attributes that are being actively filtered.

  parentSub: Subscription;
  returnSub: Subscription;
  paramQuerySub: Subscription;
  routeSub: Subscription;

  searchBarOpen = false;
  binBarOpen = false;
  binSearchItem: Item = null;
  doubleBackspace = false;

  /**The user's role, used for fab loading */
  role: string = '';

  /**Admin fab open direction */
  direction = 'left';
  /**Admin fab open animation type */
  animation = 'scale';
  /**Admin fab spin */
  spin = false;
  /**Admin fab icon */
  ico = 'add';
  miniFabState = 'shrunk'
  itemSearchOptions = {
    shouldSort: true,
    keys: ['name', 'tags', 'attributes.value'],
    distance: 50,
    threshold: .4
  };
  attributeSearchOptions = {
    shouldSort: true,
    distance: 50,
    threshold: .4
  };
  hierarchySearchOptions = {
    shouldSort: true,
    keys: ['name'],
    distance: 50,
    threshold: .4
  };

  constructor(
    private navService: NavService,
    private searchService: SearchService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private adminService: AdminService,
    private cacheService: CacheService,
    private snack: MatSnackBar,
    public dialog: MatDialog) {
    // subscribe to nav state
    this.returnSub = this.navService.getReturnState().subscribe(
      val => {
        if (val && this.root) { // if we returned
          this.navigateUpHierarchy();
        }
      }
    );
  }

  ngOnDestroy() {
    this.parentSub.unsubscribe();
    this.returnSub.unsubscribe();
    this.paramQuerySub.unsubscribe();
    this.routeSub.unsubscribe();
    Object.values(this.subItems).forEach(sub => sub.unsubscribe());
  }

  ngOnInit() {
    // Naviagte to the location/category everytime the url is updated
    this.routeSub = this.route.paramMap.subscribe(route => {
      const urlID = route.get('id');
      const selectedSearch = route.get('selectedHierarchy') === 'categories' ? 'category' : 'location';
      this.workspaceID = route.get('workspaceID');

      if(urlID && (!this.root || this.root.ID !== urlID)){
        // Load root from cache if possible
        let cache = this.cacheService.get(urlID, selectedSearch);
        if(cache){
          window.scrollTo(0,0); 
          this.root = cache as HierarchyItem;
        }
  
        // Load the current level
        this.updateSubscribedParent(urlID, selectedSearch);
        this.determineCols();
      }
    })

    // Get role
    this.authService.getRole().subscribe(
      val => this.role = val
    );

    // change if parent is different
    this.parentSub = this.navService.getParent().subscribe(val => {
      if(val){
        this.root = val;
        this.loadLevel();
      }
      else {
        console.log("Error: unable to get home root");
      }
    });

    this.searchService.loadBinData(this.workspaceID).then(resolved => {
      if(resolved){
        this.paramQuerySub = this.route.queryParamMap.subscribe(queryMap => {
          let URLbinID = queryMap.get('bin')
          if(URLbinID){
            let itemID = this.searchService.getItemIDFromBinID(URLbinID);
            if(itemID && itemID !== 'no ID'){
              this.router.navigate(['/w/' + this.workspaceID +  '/item/', itemID], {replaceUrl:true});
              this.snack.open("Routed from bin " + URLbinID, "OK", {duration: 4000});
            }
            else {
              this.snack.open("No item was found for " + URLbinID, "OK", {duration: 4000});
            }
          }
        })
      }
    });
  }

  navigateUpHierarchy() { // Yikes, repeated code from init
    this.updateSubscribedParent(this.root.parent, this.root.type);
  }

  updateSubscribedParent(id: string, type: string){
    if(type === 'category'){
      this.navService.setSubscribedParent(this.searchService.subscribeToCategory(this.workspaceID, id));
    } else {
      this.navService.setSubscribedParent(this.searchService.subscribeToLocation(this.workspaceID, id));
    }
  }

  /**
   * Load the items and category/locations that directly descend from the root
   * @param rootID root to display children of
   * @param selectedSearch category or location
   */
  loadLevel() {
    this.resetDisplay();
    this.displayDescendants(this.root);
    this.loadAttributes();
  }

  selectAttribute(value: string) {
    this.currentAttribute.value = value;
    if(this.filteredAttributes)
    this.filteredAttributes.push(this.currentAttribute);
    else this.filteredAttributes = [this.currentAttribute];
    this.attributeValues = [];
    this.originalAttributeValues = [];
    this.filterResults();
  }

  removeAttributeFromFilter(name: string) {
    for(let attr in this.filteredAttributes) {
      if(this.filteredAttributes[attr].name === name){
        this.filteredAttributes.splice(parseInt(attr), 1);

        if(this.filteredAttributes.length === 0){
          this.filteredAttributes = null; // For the categories to turn back on
          this.displayItems(this.root);
        }
        else {
          this.filterResults(); //Refilter if there's attribute filters left
        }
        break;
      }
    }
  }

  loadAttributes() {
    if(this.root.type === 'category'){
      let category = this.root as Category;
      let attributes: Attribute[];
      this.searchService.getLoadedParentsOf(this.workspaceID, category.ID, 'category').then(categoryAncestors => {

        if(categoryAncestors){ //Sometimes it returns a sad empty array, cache seems to mess with the initial return
          let allParents = categoryAncestors as Category[];
          for(let parent in allParents){
            for(let attr in allParents[parent].attributes){
              if(attributes){
                attributes.push({name: allParents[parent].attributes[attr]['name']});
              } else {
                attributes = [{name: allParents[parent].attributes[attr]['name']}];
              }
            }
          }
        }

        this.filterableAttributes = attributes;
      })
    }
  }

  gatherAttributeValues(attribute: AttributeValue){

    this.percentLoadedAttributes = 10;
    this.isLoadingAttributes = true;
    this.currentAttribute = attribute;
    this.attributeValues = [];

    this.searchService.getAllDescendantHierarchyItems(this.workspaceID, this.root.ID, this.root.type === 'category').subscribe(hierarchyItems => {
      this.percentLoadedAttributes = 30;
      this.searchService.getAllDescendantItems(this.workspaceID, this.root, hierarchyItems).subscribe(items => {

        // A progress bar for a ton amount of items
        let slice = 60/((items.length/1000)+1);
        let count = 0;
        for(let item in items) {

          count++;
          if(count > 1000){
            this.percentLoadedAttributes += slice;
            count = 0;
          }

          if(items[item].attributes)
          for(let attr in items[item].attributes){
            if(items[item].attributes[attr].name === attribute.name){

                let newAttrValueCapped = items[item].attributes[attr].value.toUpperCase();
                if(newAttrValueCapped){
                  if(this.attributeValues.length === 0){
                    this.attributeValues.push(items[item].attributes[attr].value);
                  }
                  else if(AdvancedAlphaNumSort.compare(this.attributeValues[this.attributeValues.length-1].toUpperCase(), newAttrValueCapped) < 0){
                    this.attributeValues.splice(this.attributeValues.length, 0, items[item].attributes[attr].value);
                  }
                  else if(this.attributeValues[this.attributeValues.length-1].toUpperCase() === newAttrValueCapped){
                    // Do nothing. It already has a value like it
                  }
                  else {
                    for(let value in this.attributeValues){
                      if(newAttrValueCapped === this.attributeValues[value].toUpperCase()){
                        // Do nothing. It already has a value like it
                        break;
                      }
                      else if(AdvancedAlphaNumSort.compare(newAttrValueCapped, this.attributeValues[value].toUpperCase()) < 0){
                        this.attributeValues.splice(parseInt(value), 0, items[item].attributes[attr].value);
                        break;
                      }
                    }
                  }
                }
                this.isLoadingAttributes = false;
            }
          }
        }
        this.originalAttributeValues = JSON.parse(JSON.stringify(this.attributeValues));
      });
    });
  }

  displayDescendants(root: HierarchyItem = this.root) {
    this.hierarchyItems = [];
    this.searchService.getDescendantsOfRoot(this.workspaceID, root ? root.ID : 'root', root ? root.type === 'category' : false).subscribe(descendants => {
      this.hierarchyItems = descendants;
    });
    // Load items that descend from root
    if (root && root.items) {
      this.displayItems(root);
    }
  }

  // This is called every time the carrently viewed root is updated
  displayItems(root: HierarchyItem) {
    this.items = [];
    this.binItems = [];

    if(this.subItems){
      Object.values(this.subItems).forEach(sub => sub.unsubscribe());
    }

    if (root.items) {
      // For each itemID descending from root, get the item from the data and added to the global items array
      for (let itemID of root.items) {
        this.obsItems[itemID] = this.searchService.getItem(this.workspaceID, itemID);
        this.subItems[itemID] = this.obsItems[itemID].subscribe(returnedItem => {
          if (returnedItem !== null && typeof returnedItem !== 'undefined') {
            let itemFound = false;
            
            // Update the item if already displayed
            for(let item in this.items){
              if(this.items[item].ID === returnedItem.ID){
                // If the item was found in binless items but now has a bin, switch its array
                if(this.root.type === 'location' && this.items[item].locationMetadata && this.items[item].locationMetadata[this.root.ID]
                && this.items[item].locationMetadata[this.root.ID].binID){
                  this.items.splice(parseInt(item));
                  this.binItems = this.addItemToSortedArray(returnedItem, this.binItems, "binID");
                }
                // Otherwise just update the item
                else {
                  this.items[item] = returnedItem;
                }
                itemFound = true;
                break;
              }
            }

            // If the item hasn't been found yet, try looking in the binned items
            if(!itemFound){
              for(let item in this.binItems){
                if(this.binItems[item].ID === returnedItem.ID){
                  // If the item was found in binned items but no longer has a bin, switch its array
                  if(this.root.type === 'location' && (!this.binItems[item].locationMetadata || !this.binItems[item].locationMetadata[this.root.ID]
                    || !this.binItems[item].locationMetadata[this.root.ID].binID)){
                    this.binItems.splice(parseInt(item));
                    this.items = this.addItemToSortedArray(returnedItem, this.items, "name");
                  }
                  // Otherwise just update the item
                  else {
                    this.binItems[item] = returnedItem;
                  }
                  itemFound = true;
                  break;
                }
              }
            }

            // Add it if not found, and keep it in sorted order
            if(!itemFound){
              if(this.root.type === 'location' && returnedItem.locationMetadata && returnedItem.locationMetadata[this.root.ID]
                  && returnedItem.locationMetadata[this.root.ID].binID){
                this.binItems = this.addItemToSortedArray(returnedItem, this.binItems, "binID");
              }
              else {
                this.items = this.addItemToSortedArray(returnedItem, this.items, "name");
              }
            }
            
          }
          
        });
      }
    }
  }

  addItemToSortedArray(item: Item, itemList: Item[], elementToCompare: string): Item[] {
    // If the list has nothing in it, initialize it with the item
    if(!itemList || itemList.length < 1){
      itemList = [item];
      return itemList;
    }

    if(elementToCompare === 'binID'){
      if(AdvancedAlphaNumSort.compare(item.locationMetadata[this.root.ID].binID, itemList[itemList.length-1].locationMetadata[this.root.ID].binID) > 0){
        itemList.push(item);
        return itemList;
      }

      // Otherwise search for where to add it earlier in the list
      for(let itemIndex in itemList){
        if(AdvancedAlphaNumSort.compare(item.locationMetadata[this.root.ID].binID, itemList[itemIndex].locationMetadata[this.root.ID].binID) <= 0){
          itemList.splice(parseInt(itemIndex), 0, item);
          return itemList;
        }
      }
    }
    else {
      // If the item name is greater than the the last element in the list, just add it to the end
      if(AdvancedAlphaNumSort.compare(item[elementToCompare].toUpperCase(), itemList[itemList.length-1][elementToCompare].toUpperCase()) > 0){
        itemList.push(item);
        return itemList;
      }

      // Otherwise search for where to add it earlier in the list
      for(let itemIndex in itemList){
        if(AdvancedAlphaNumSort.compare(item[elementToCompare].toUpperCase(), itemList[itemIndex][elementToCompare].toUpperCase()) <= 0){
          itemList.splice(parseInt(itemIndex), 0, item);
          return itemList;
        }
      }
    }

    return itemList;
  }

  onResize(event) {
    this.determineCols();
  }

  determineCols(fontSize: number = this.getFontSize(), width = document.body.clientWidth) {
    // BAD: OUTDATED
    const fontLine = fontSize * 15; // Sets max characters (but not directly) on a line
    this.columns = Math.floor(width / fontLine * 0.96);
    if(this.columns > 3){
      this.columns = 3;
    }
  }

  getFontSize() {
    const textField = document.documentElement;
    const style = window.getComputedStyle(textField, null).getPropertyValue('font-size');
    return parseFloat(style);
  }

  goToItem(item: Item) {
    this.cacheService.store(item);
    this.cacheService.store(this.root); // Currently this only helps if you go back to this page, but that still happens often
    this.router.navigate(['/w/' + this.workspaceID +  '/item/', item.ID]);
  }

  goToHierarchy(hierItem: HierarchyItem) {
    this.control.setValue('');
    window.history.pushState(null, null, '/w/' + this.workspaceID + '/search/' + (hierItem.type === 'category' ? 'categories' : 'locations') + '/' + hierItem.ID);
    this.updateSubscribedParent(hierItem.ID, hierItem.type);
  }

  resetDisplay(){
    this.attributeValues = null;
    this.originalAttributeValues = null;
    this.filterableAttributes = null;
    this.binBarOpen = false;
    this.searchBarOpen = false;
  }

  /**Toggles the admin fab icon */
  toggleIco() {
    this.ico = this.ico === 'add' ? 'close' : 'add';
    this.miniFabState = this.ico === 'add' ? 'shrunk' : 'extended';
  }

  clearSearchBar(){
    this.control.setValue('');
  }

  filterResults(){
    this.searchService.getAllDescendantHierarchyItems(this.workspaceID, this.root.ID, this.root.type === 'category').subscribe(hierarchyItems => {
      this.searchService.getAllDescendantItems(this.workspaceID, this.root, hierarchyItems).subscribe(items => {
        let newItemResults: Item[] = [];
        for(let item in items){
          if(items[item].attributes){
            let passAll = true;
            for(let requiredAttr in this.filteredAttributes){
              let pass = false;
              for(let attr in items[item].attributes){
                if(items[item].attributes[attr].name === this.filteredAttributes[requiredAttr].name && items[item].attributes[attr].value.toUpperCase() === this.filteredAttributes[requiredAttr].value.toUpperCase()){
                  pass = true;
                  break;            // TODO: ORDER WRONG
                }
              }
              if(!pass) {
                passAll = false;
                break; // It did not ahve all the required filters
              }
            }
            if(passAll){
              newItemResults.push(items[item]);
            }
          }
        }
        this.items = newItemResults;
      });
    });
  }

  searchTextChange(event) {
    if (event === '') {
      // Reset the view to the normal things in the current root
      this.displayDescendants(this.root);
      this.attributeValues = this.originalAttributeValues;
      return;
    } else { // Otherwise, get all descendant hierarchy items and items and fuzzy match them
      this.isLoading = true;
      this.searchService.getAllDescendantHierarchyItems(this.workspaceID, this.root.ID, this.root.type === 'category').subscribe(hierarchyItems => {
        this.searchService.getAllDescendantItems(this.workspaceID, this.root, hierarchyItems).subscribe(items => {
          // Search items
          const itemSearcher = new Fuse(items, this.itemSearchOptions);
          this.items = itemSearcher.search(event);
          this.isLoading = false;
        });
        // Search hierarchy items
        const hierarchySearcher = new Fuse(hierarchyItems, this.hierarchySearchOptions);
        this.hierarchyItems = hierarchySearcher.search(event);
      });
      if(this.attributeValues){
        this.attributeValues = JSON.parse(JSON.stringify(this.originalAttributeValues));
        const attrValueSearcher = new Fuse(this.attributeValues, this.attributeSearchOptions);
        this.attributeValues = attrValueSearcher.search(event).map(i => this.originalAttributeValues[i]);
      }
    }
    this.previousSearch = event;
    this.previousSearchRoot = this.root.ID;
  }

  openQRScanner(){
    this.dialog.open(QRScannerDialogComponent, {
      width: '480px',
      data: {
        workspaceID: this.workspaceID
      }
    });
  }

  

  goToEditHierarchy() {
    this.router.navigate(['w/' + this.workspaceID + '/hierarchyItem/' + (this.root.type === 'category' ? 'categories' : 'locations') + '/' + this.root.ID]);
  }

  openQRDialog() {
    if(this.root.type === 'category'){
      this.dialog.open(QRCodeCategoryDialogComponent, {
        width: '45rem',
        data: {workspaceID: this.workspaceID, category: this.root}
      });
    }
    else {
      this.dialog.open(QRCodeLocationDialogComponent, {
        width: '45rem',
        data: {workspaceID: this.workspaceID, location: this.root}
      });
    }
  }

  addItem(){
    const dialogRef = this.dialog.open(ItemBuilderModalComponent, {
      width: '480px',
      data: {
        workspaceID: this.workspaceID,
        hierarchyObj: this.root
      }
    });
  }

  /** Adds a hierarchy item to the current depth */
  addHierarchy() {
    if (this.root.type === 'category') {

      let categoryData: Category =
      {
        name: 'NEW CATEGORY',
        parent: this.root.ID,
        children: [],
        items: [],
        titleFormat: [{type: "parent"}]
      }

      this.adminService.addCategory(this.workspaceID, categoryData, this.root.ID).subscribe(id => {
        this.router.navigate(['/w/' + this.workspaceID + '/hierarchyItem/categories/' + id]);
      });
    }
    else {

      this.adminService.addLocation(this.workspaceID, {
        name: 'NEW LOCATION',
        parent: this.root.ID,
        children: [],
        items: []
      } as HierarchyItem, this.root.ID).subscribe(id => {
        this.router.navigate(['/w/' + this.workspaceID + '/hierarchyItem/locations/' + id]);
      });
    }
  }

  toggleHierarchy() {
    if(this.root.type === 'category'){
      this.router.navigate(['/w/' + this.workspaceID + '/search/locations/root']);
    }
    else {
      this.router.navigate(['/w/' + this.workspaceID + '/search/categories/root']);
    }
  }

  toggleBinBar(){
    this.binBarOpen = !this.binBarOpen;
    if(this.binBarOpen){
      this.shelfInput.nativeElement.focus();
    }
  }

  toggleSearchBar(){
    this.searchBarOpen = !this.searchBarOpen;
    if(this.searchBarOpen){
      this.searchInput.nativeElement.focus();
    }
    if(this.binBarOpen){
      this.binBarOpen = false;
    }
  }

  updateQuickSearchShelf(event){
    if(this.shelfInput.nativeElement.value.length > 3){
      let start = (this.shelfInput.nativeElement.value as string).substring(0, 3);
      let chopped = (this.shelfInput.nativeElement.value as string).substring(3);
      this.shelfInput.nativeElement.value = start;

      if(chopped.length > 3){
        this.binInput.nativeElement.value = chopped.substring(0, 3);
      }
      else {
        this.binInput.nativeElement.value = chopped;
      }

      this.binInput.nativeElement.focus();
    }
    else if(event.key === 'Enter'){
      if(this.shelfInput.nativeElement.value.length < 3){
        for(let i = this.shelfInput.nativeElement.value.length; i < 3; i++){
          this.shelfInput.nativeElement.value = "0" + this.shelfInput.nativeElement.value;
        }
      }
      let locationID = this.searchService.getLocationIDFromShelfID(this.shelfInput.nativeElement.value);
      if(locationID && locationID !== 'err' && locationID !== 'no ID' && locationID !== this.root.ID){
        this.searchService.subscribeToLocation(this.workspaceID, locationID).subscribe(loc => {
          this.binInput.nativeElement.value = '';
          this.goToHierarchy(loc);
          this.shelfInput.nativeElement.blur();
        });
      }
    }
    
  }

  updateQuickSearchBin(event){
    // Wait until the user hits backspace twice before returning to the shelf number
    if(this.binInput.nativeElement.value.length < 1 && event.key === 'Backspace'){
      if(this.doubleBackspace){
        this.shelfInput.nativeElement.focus();
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

    // If the user entered to search or hit a full bin ID, attempt to search and go to it
    else if(this.binInput.nativeElement.value.length === 3 || event.key === "Enter"){
      // If enter was hit but the number isn't big enough (as a string) add zeros until sufficient
      if(this.binInput.nativeElement.value.length < 3){
        for(let i = this.binInput.nativeElement.value.length; i < 3; i++){
          this.binInput.nativeElement.value = "0" + this.binInput.nativeElement.value;
        }
      }

      if(this.shelfInput.nativeElement.value){
        let binID = this.shelfInput.nativeElement.value + '-' + this.binInput.nativeElement.value;
        let itemID = this.searchService.getItemIDFromBinID(binID);

        if(!itemID || itemID === 'no ID'){
          this.snack.open("No item was found for " + binID, "OK", {duration: 4000});
        }
        else {
          this.searchService.getItem(this.workspaceID, itemID).subscribe(item => {
            if(item){
              for(let loc in item.locationMetadata){
                if((item.locationMetadata[loc].binID && item.locationMetadata[loc].binID === binID) ||
                (item.locationMetadata[loc].binIDRange && item.locationMetadata[loc].binID <= binID && item.locationMetadata[loc].binIDRange >= binID)){
                  this.searchService.subscribeToLocation(this.workspaceID, loc).subscribe(locationData => {
  
                    // If we got a result, go to the item's location and deselect the input so
                    // we can fully see the result on mobile
                    this.goToHierarchy(locationData);
                    this.binSearchItem = item;
                    this.binInput.nativeElement.blur();
                  });
                }
              }
            }
          });
        }
      }
    }
    else {
      // If there was no search but there is a search result, clear it and return the location to normal
      if(this.binSearchItem){
        this.binSearchItem = null;
        this.loadLevel();
      }
    }
  }
}
