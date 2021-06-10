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

/**
 *
 * TODO: displays multiple items on startup in layer with items, problem with calling
 * displayDescendents once and then loadLevel (which calls displayDescendents)
 *
 */

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  animations:[
    trigger('button-extention-item', [
      state('shrunk', style({width: '50px', visibility: 'hidden', pointerEvents: 'none'})),
      state('extended', style({width: '80px', visibility: 'visible', pointerEvents: 'auto'})),
      transition('shrunk <=> extended', animate('250ms'))
    ]),
    trigger('button-extention-hierarchy', [
      state('shrunk', style({width: '90px', visibility: 'hidden', pointerEvents: 'none'})),
      state('extended', style({width: '140px', visibility: 'visible', pointerEvents: 'auto'})),
      transition('shrunk <=> extended', animate('250ms'))
    ])
  ]
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild("binInput") binInput: ElementRef;
  @ViewChild("shelfInput") shelfInput: ElementRef;
  control = new FormControl();
  root: HierarchyItem;
  rootSub: Subscription;

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
  typeForSelectionButtons: string;

  parentSub: Subscription;
  returnSub: Subscription;

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

  quickSearchShelf;
  quickSearchBin;
  doubleBackspace

  constructor(
    private navService: NavService,
    private searchService: SearchService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private adminService: AdminService,
    private cacheService: CacheService,
    public dialog: MatDialog) {
    // subscribe to nav state
    this.returnSub = this.navService.getReturnState().subscribe(
      val => {
        if (val && this.root) { // if we returned
          this.navigateUpHierarchy();
        }
      }
    );

    // change if parent is different
    this.parentSub = this.navService.getParent().subscribe(val => {
        if(val){
          this.root = val;
          this.typeForSelectionButtons = this.root.type;
          this.loadLevel();
        }
      }
    );
  }

  ngOnDestroy() {
    this.parentSub.unsubscribe();
    this.returnSub.unsubscribe();
    Object.values(this.subItems).forEach(sub => sub.unsubscribe());
  }

  ngOnInit() {
    // Naviagte to the location/category everytime the url is updated
    const urlID = this.route.snapshot.paramMap.get('id');
    const selectedSearch = this.route.snapshot.paramMap.get('selectedHierarchy') === 'categories' ? 'category' : 'location';
    this.typeForSelectionButtons = selectedSearch;

    // Load root from cache if possible
    
    let cache = this.cacheService.get(urlID, selectedSearch);
    if(cache){
      window.scrollTo(0,0); 
      this.root = cache as HierarchyItem;
    }

    // Load the current level
    this.updateSubscribedParent(urlID, selectedSearch);

    // ROUTER IS UNTRUSTWORTHY - internal changes can make the router think it doesn't need to update anything
    // this.route.paramMap.subscribe(params => {
    //     const urlID = params.get('id');
    //     this.selectedSearch = params.get('selectedHierarchy') === 'categories' ? 'Categories' : 'Locations';
    //     this.loadLevel(urlID, this.selectedSearch);
    //   }
    // );

    this.determineCols();
    // Get role
    this.authService.getRole().subscribe(
      val => this.role = val
    );
  }

  navigateUpHierarchy() { // Yikes, repeated code from init
    this.updateSubscribedParent(this.root.parent, this.root.type);
  }

  updateSubscribedParent(id: string, type: string){
    if(type === 'category'){
      this.navService.setSubscribedParent(this.searchService.getCategory(id));
    } else {
      this.navService.setSubscribedParent(this.searchService.getLocation(id));
    }
  }

  /**
   * Load the items and category/locations that directly descend from the root
   * @param rootID root to display children of
   * @param selectedSearch category or location
   */
  loadLevel() {
    this.resetAttributeData();
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
      this.searchService.getAncestorsOf(category).subscribe(categoryAncestors => {

        if(categoryAncestors[0]){ //Sometimes it returns a sad empty array, cache seems to mess with the initial return
          let allParents = [category].concat(categoryAncestors[0]);
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

    this.percentLoadedAttributes = 2;
    this.isLoadingAttributes = true;
    this.currentAttribute = attribute;
    this.attributeValues = [];

    this.searchService.getAllDescendantHierarchyItems(this.root.ID, this.root.type === 'category').subscribe(hierarchyItems => {
      this.percentLoadedAttributes = 6;
      this.searchService.getAllDescendantItems(this.root, hierarchyItems).subscribe(items => {

        let slice = 94/items.length;
        for(let item in items) {
          this.percentLoadedAttributes += slice;
          if(items[item].attributes)
          for(let attr in items[item].attributes){
            if(items[item].attributes[attr].name === attribute.name){

                let newAttrValueCapped = items[item].attributes[attr].value.toUpperCase();
                if(newAttrValueCapped){
                  if(this.attributeValues.length === 0){
                    this.attributeValues.push(items[item].attributes[attr].value);
                  }
                  else if(this.attributeValues[this.attributeValues.length-1].toUpperCase() < newAttrValueCapped){
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
                      else if(newAttrValueCapped < this.attributeValues[value].toUpperCase()){
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
    this.searchService.getDescendantsOfRoot(root ? root.ID : 'root', root.type === 'category').subscribe(descendants => {
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
        this.obsItems[itemID] = this.searchService.getItem(itemID);
        this.subItems[itemID] = this.obsItems[itemID].subscribe(returnedItem => {
          if (returnedItem !== null && typeof returnedItem !== 'undefined') {
            let itemFound = false;
            
            // Update the item if already displayed
            for(let item in this.items){
              if(this.items[item].ID === returnedItem.ID){
                // If the item was found in binless items but now has a bin, switch its array
                if(this.items[item].locationMetadata && this.items[item].locationMetadata[this.root.ID]
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
            for(let item in this.binItems){
              if(this.binItems[item].ID === returnedItem.ID){
                // If the item was found in binless items but no longer has a bin, switch its array
                if(this.items[item].locationMetadata && this.items[item].locationMetadata[this.root.ID]
                  && this.items[item].locationMetadata[this.root.ID].binID){
                  this.items.splice(parseInt(item));
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

            // Add it if not found, and keep it in sorted order
            if(!itemFound){
              if(returnedItem.locationMetadata && returnedItem.locationMetadata[this.root.ID]
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

  addItemToSortedArray(item: Item, itemList: Item[], elementToCompare: string){
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
        if(AdvancedAlphaNumSort.compare(item.locationMetadata[this.root.ID].binID, itemList[itemList.length-1].locationMetadata[this.root.ID].binID) < 0){
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
        if(AdvancedAlphaNumSort.compare(item[elementToCompare].toUpperCase(), itemList[itemIndex][elementToCompare].toUpperCase()) < 0){
          itemList.splice(parseInt(itemIndex), 0, item);
          return itemList;
        }
      }
    }
  }

  onResize(event) {
    this.determineCols();
  }

  determineCols(fontSize: number = this.getFontSize(), width = document.body.clientWidth) {
    const fontLine = fontSize * 15; // Sets max characters (but not directly) on a line
    const calcWidth = width > (fontSize*60) ? fontSize*60 : width;
    this.columns = Math.floor(calcWidth / fontLine * 0.96);
  }

  getFontSize() {
    const textField = document.documentElement;
    const style = window.getComputedStyle(textField, null).getPropertyValue('font-size');
    return parseFloat(style);
  }

  goToItem(item: Item) {
    this.cacheService.store(item);
    this.cacheService.store(this.root); // Currently this only helps if you go back to this page, but that still happens often
    this.router.navigate(['/item/', item.ID]);
  }

  goToHierarchy(hierItem: HierarchyItem) {
    this.control.setValue('');
    window.history.pushState(null, null, 'search/' + (this.root.type === 'category' ? 'categories' : 'locations') + '/' + hierItem.ID);
    this.updateSubscribedParent(hierItem.ID, hierItem.type);
  }

  toggleHierarchy(event) {
    this.control.setValue('');
    this.searchTextChange('');
    window.history.pushState(null, null, 'search/' + event.value.toLowerCase() + '/' + (this.root ? this.root.ID : 'root'));
    this.updateSubscribedParent('root', this.root.type === 'category' ? 'location' : 'category');
  }

  resetAttributeData(){
    this.attributeValues = null;
    this.originalAttributeValues = null;
    this.filterableAttributes = null;
  }

  /**Toggles the admin fab icon */
  toggleIco() {
    this.ico = this.ico === 'add' ? 'close' : 'add';
    this.miniFabState = this.ico === 'add' ? 'shrunk' : 'extended';
  }

  /**Adds an item to the current depth */
  addItem() {
    if (this.ico === 'close') {
      this.toggleIco();
    }
    // add the item
    let category = 'root';
    let location = null;
    let name = '';
    // to category
    if (this.root.type === 'category') {
      category = this.root.ID;
      let cat = this.root as Category;
      if(cat.prefix){
        name = cat.prefix;
      }
    } else { // add to locations
      location = this.root.ID;
    }

    const dialogRef = this.dialog.open(ItemBuilderModalComponent, {
      width: '480px',
      data: {
        hierarchyObj: this.root
      }
    });

    /*this.adminService.createItemAtLocation(name, '', [], category, '../../../assets/notFound.png', location).subscribe(id => {
      if(this.root.type === 'category'){
        this.router.navigate(['/itemBuilder/' + id], { queryParams: { step: 0, returnTo: 'search/categories/' + this.root.ID + ':' + this.root.name} });
      }
      else {
        this.router.navigate(['/itemBuilder/' + id], { queryParams: { step: 0, returnTo: 'search/locations/' + this.root.ID + ':' + this.root.name} });
      }
    });*/
  }

  /** Adds a hierarchy item to the current depth */
  addHierarchy() {
    if (this.ico === 'close') {
      this.toggleIco();
    }

    if (this.root.type === 'category') {

      let categoryData: Category =
      {
        name: 'NEW CATEGORY',
        parent: this.root.ID,
        children: [],
        items: [],
        titleFormat: [{type: "parent"}]
      }

      this.adminService.addCategory(categoryData, this.root.ID).subscribe(id => {
        this.router.navigate(['/hierarchyItem/categories/' + id]);
      });
    }
    else {

      this.adminService.addLocation({
        name: 'NEW LOCATION',
        parent: this.root.ID,
        children: [],
        items: []
      } as HierarchyItem, this.root.ID).subscribe(id => {
        this.router.navigate(['/hierarchyItem/locations/' + id]);
      });
    }
  }

  clearSearchBar(){
    this.control.setValue('');
  }

  filterResults(){
    this.searchService.getAllDescendantHierarchyItems(this.root.ID, this.root.type === 'category').subscribe(hierarchyItems => {
      this.searchService.getAllDescendantItems(this.root, hierarchyItems).subscribe(items => {
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
      this.searchService.getAllDescendantHierarchyItems(this.root.ID, this.root.type === 'category').subscribe(hierarchyItems => {
        this.searchService.getAllDescendantItems(this.root, hierarchyItems).subscribe(items => {
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

  updateQuickSearchShelf(event){
    if(event.target.value.length === 3 || event.key === "Enter"){
      this.binInput.nativeElement.focus();

      let locationID = this.searchService.getLocationFromShelfID(this.searchService.convertNumberToThreeDigitString(this.quickSearchShelf));
      console.log(locationID);
      if(locationID && locationID !== 'err' && locationID !== 'no ID' && locationID !== this.root.ID){
        this.searchService.getLocation(locationID).subscribe(loc => {
          this.goToHierarchy(loc);
        });
      }
    }

    else if(event.target.value.length > 3){
      let chopped = (event.target.value as string).substring(3);
      this.quickSearchShelf = Number.parseInt((event.target.value as string).substring(0, 3));

      if(chopped.length > 3){
        this.quickSearchBin = Number.parseInt(chopped.substring(0, 3));
      }
      else {
        this.quickSearchBin = Number.parseInt(chopped);
      }
    }
  }

  updateQuickSearchBin(event){
    if(event.target.value.length > 3){
      this.quickSearchBin = Number.parseInt(event.target.value.substring(0, 3));
      console.log(this.quickSearchBin);
    }
    else if(event.target.value.length === 3 || event.key === "Enter"){
      if(this.quickSearchShelf || this.quickSearchShelf === 0){
        let locationID = this.searchService.getLocationAndItemFromBinID(this.searchService.convertNumberToThreeDigitString(this.quickSearchShelf) + '-' 
        + this.searchService.convertNumberToThreeDigitString(this.quickSearchBin)).split(',')[0];

        if(locationID && locationID !== 'err' && locationID !== 'no ID' && locationID !== this.root.ID){
          this.searchService.getLocation(locationID).subscribe(loc => {
            this.goToHierarchy(loc);
          });
        }
      }
    }
  }
}
