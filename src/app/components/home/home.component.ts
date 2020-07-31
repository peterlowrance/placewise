import {Component, OnDestroy, OnInit, ComponentFactoryResolver} from '@angular/core';
import {Item} from '../../models/Item';
import {ActivatedRoute, Router} from '@angular/router';
import {HierarchyItem} from '../../models/HierarchyItem';
import {FormControl} from '@angular/forms';
import {SearchService} from '../../services/search.service';
import {NavService} from '../../services/nav.service';
import {Subscription} from 'rxjs';
import {AuthService} from 'src/app/services/auth.service';
import * as Fuse from 'fuse.js';
import {AdminService} from 'src/app/services/admin.service';
import {MatDialog, throwMatDialogContentAlreadyAttachedError} from '@angular/material/dialog';
import { trigger, state, style, transition, animate, keyframes} from '@angular/animations';
import { Category } from 'src/app/models/Category';
import { switchMap } from 'rxjs/operators';
import { url } from 'inspector';
import { Identifiers } from '@angular/compiler';

/**
 *
 * TODO: displays multiple items on startup in layer with items, problem with calling
 * displayDescendents once and then loadLevel (which calls displayDescendents)
 *
 */

 interface Attribute {
   ID: string;
   name: string;
   value?: string;
 }

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
  control = new FormControl();
  root: HierarchyItem;
  rootSub: Subscription;

  hierarchyItems: HierarchyItem[];
  originalHierarchyItems: HierarchyItem[];
  items: Item[];
  originalItems: Item[];

  columns: number;
  previousSearch = '';
  previousSearchRoot = '';
  isLoading = false;
  isLoadingAttributes = false;
  percentLoadedAttributes = 0;
  filterableAttributes: Attribute[] // For selecting which ones to filter by
  attributeValues: string[];
  originalAttributeValues: string[]; // For resetting after searching
  currentAttribute: Attribute; // For the current attribute that that values are being searched for
  filteredAttributes: Attribute[]; // Attributes that are being actively filtered.
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

  constructor(
    private navService: NavService,
    private searchService: SearchService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private adminService: AdminService,
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
          // this.displayDescendants(val, this.selectedSearch === 'Categories');
          // this.loadAttributes();
          // console.log("Loaded from parentSub:" + val.name);
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
  }

  ngOnInit() {
    // Naviagte to the location/category everytime the url is updated
    const urlID = this.route.snapshot.paramMap.get('id');
    const selectedSearch = this.route.snapshot.paramMap.get('selectedHierarchy') === 'categories' ? 'category' : 'location';
    this.typeForSelectionButtons = selectedSearch;
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

  removeAttributeFromFilter(ID: string) {
    for(let attr in this.filteredAttributes) {
      if(this.filteredAttributes[attr].ID === ID){
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
                attributes.push({ID: attr, name: allParents[parent].attributes[attr]['name']});
              } else {
                attributes = [{ID: attr, name: allParents[parent].attributes[attr]['name']}];
              }
            }
          }
        }

        this.filterableAttributes = attributes;
      })
    }
  }

  gatherAttributeValues(attribute: Attribute){

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
            if(items[item].attributes[attr].ID === attribute.ID){

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

  /**
   * Sets the nav type field of the nav controller
   * @param type string search type
   */
  private setNavType(type: string) {
    this.navService.setSearchType(type);
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
    if (root.items) {
      // For each itemID descending from root, get the item from the data and added to the global items array
      for (const itemID of root.items) {
        this.searchService.getItem(itemID).subscribe(returnedItem => {
          if (returnedItem !== null && typeof returnedItem !== 'undefined') {
            let itemFound = false;
            
            // Update the item if already displayed
            for(let item in this.items){
              if(this.items[item].ID === returnedItem.ID){
                this.items[item] = returnedItem;
                itemFound = true;
                break;
              }
            }

            // Add it if not found, and keep it in sorted order
            if(!itemFound){
              let newItemNameCapped = returnedItem.name.toUpperCase();
              if(this.items.length === 0){
                this.items.push(returnedItem);
              }
              else if(this.items[this.items.length-1].name.toUpperCase() < newItemNameCapped){
                this.items.splice(this.items.length, 0, returnedItem);
              }
              else {
                for(let item in this.items){
                  if(newItemNameCapped <= this.items[item].name.toUpperCase()){
                    this.items.splice(parseInt(item), 0, returnedItem);
                    break;
                  }
                }
              }
            }
            
          }
        });
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
    let location = 'root';
    // to category
    if (this.root.type === 'category') {
      category = this.root.ID;
    } else { // add to locations
      location = this.root.ID;
    }
    this.adminService.createItemAtLocation('NEW ITEM', '', [], category, '../../../assets/notFound.png', location).subscribe(id => {
      this.router.navigate(['/item/' + id]);
    });
  }

  /** Adds a hierarchy item to the current depth */
  addHierarchy() {
    if (this.ico === 'close') {
      this.toggleIco();
    }

    if (this.root.type === 'category') {

      this.adminService.addCategory({
        name: 'NEW CATEGORY',
        parent: this.root.ID,
        children: [],
        items: []
      } as HierarchyItem, this.root.ID).subscribe(id => {
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
                if(items[item].attributes[attr].ID === this.filteredAttributes[requiredAttr].ID && items[item].attributes[attr].value.toUpperCase() === this.filteredAttributes[requiredAttr].value.toUpperCase()){
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
}
