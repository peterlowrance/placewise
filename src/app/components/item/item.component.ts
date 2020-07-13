// adapted tree control from https://material.angular.io/components/tree/examples
import {Component, OnDestroy, OnInit, ElementRef, ViewChild} from '@angular/core';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {Item} from 'src/app/models/Item';
import {Report} from 'src/app/models/Report';
import {ItemReportModalData} from 'src/app/models/ItemReportModalData';
import {ActivatedRoute} from '@angular/router';
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
import {Subscription} from 'rxjs';
import {Location} from '@angular/common';
import {MatSnackBar} from '@angular/material';
import { Category } from 'src/app/models/Category';


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
}

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.css']
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
  previousItem: Item; // previous item, before edits are made
  imageToSave: File = null; // the image to upload when saved

  loading = true;  // whether the page is actively loading
  report: Report = {
    description: '',
    item: {
      ID: '0',
      name: '',
      imageUrl: ''
    },
    reportDate: '',
    reporter: ''
  }; // user report
  errorDesc: ItemReportModalData = {valid: false, desc: ''}; // user-reported error description
  expanded = false;  // is the more info panel expanded

  // category of the item
  category: Category;
  categoryAncestors: Category[];
  locationsAndAncestors: HierarchyItem[][];
  attributesForCard: AttributeCard[];

  role: string; // user role for editing
  dirty: boolean; // is the item edited dirty
  missingData: string; // string of data missing, null if nothing is missing

  textEditFields: {
    name: boolean;
    desc: boolean;
    tags: boolean;
  } = {name: false, desc: false, tags: false};

  deleteSub: Subscription; // delete subscription

  ngOnInit() {
    // retrieve id
    this.id = this.route.snapshot.paramMap.get('id');

    // get the item from the id
    this.searchService.getItem(this.id).subscribe(item => {
      if (!item) {
        return;
      }
      // get the item ref
      this.item = item;
      this.previousItem = JSON.parse(JSON.stringify(item)); // deep copy

      // Load image for item TODO: Not any more

      // get the locations information
      this.searchService.getAncestorsOf(item).subscribe(locations => {
        this.locationsAndAncestors = locations;
      });

      // get the category information
      this.searchService.getCategory(item.category).subscribe(category => {
        this.category = category;
        this.searchService.getAncestorsOf(category).subscribe(categoryAncestors => {
          if(categoryAncestors[0]){ //Sometimes it returns a sad empty array, cache seems to mess with the initial return
            this.categoryAncestors = categoryAncestors[0];
            this.attributesForCard = this.loadAttributesForCards([category].concat(categoryAncestors[0]), item);
          }
          else {
            this.attributesForCard = this.loadAttributesForCards([category], item)
          }
          // Display missing data
          this.missingData = this.formatMissingDataString(item);
        })
      });

    });

    // get user role
    this.role = this.authService.role;

    // set up admin change forms
    // this.nameForm = this.formBuilder.group({name: this.nameControl})

    // set up link to delete
    // this.deleteSub = this.navService.getDeleteMessage().subscribe(val => this.requestDelete(val));
  }

  ngOnDestroy() {
    //this.deleteSub.unsubscribe();
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

  createReport() {
    // reset report data, ensure clicking out defaults to fail and no double send
    this.errorDesc = {valid: false, desc: ''};

    const dialogRef = this.dialog.open(ReportDialogComponent, {
      width: '30rem',
      data: {
        valid: this.errorDesc.valid,
        desc: this.errorDesc.desc
      }
    });

    dialogRef.afterClosed().subscribe(result => {if (result) this.issueReport(result)});
  }

  /**
   * Issues a report to the backend DB
   * @param result The resulting report from the report modal
   */
  issueReport(result: ItemReportModalData) {
    this.errorDesc = result;
    // if it's valid, build and isue report, else leave
    if (this.errorDesc.valid) {
      this.report.description = this.errorDesc.desc;
      this.report.item.name = this.item.name;
      this.report.item.ID = this.item.ID;
      this.report.item.imageUrl = this.item.imageUrl;
      // TODO: input reporter name from auth service
      // this.report.reporter
      this.report.reportDate = new Date().toDateString();

      // TODO: issue report
      return this.adminService.placeReport(this.report.item.ID, this.report.description).toPromise().then(
        () => this.snack.open("Report Sent", "OK", {duration: 3000, panelClass: ['mat-toolbar']}),
        (err) => this.snack.open("Report Failed, Please Try Later", "OK", {duration: 3000, panelClass: ['mat-toolbar']})
      );
    }
  }

  /**
   * A field edit handler
   * @param field the string name of the item field to edit
   */
  editField(field: string) {
    // set edit field value to enable state change, then set focus
    switch (field) {
      case 'name':
        this.textEditFields.name = true;
        // focus
        setTimeout(() => this.nameField.nativeElement.focus(), 0);
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
      this.item.locations = result;
      // Update the item locations then refresh
      this.adminService.updateItem(this.item, null, oldLocations).then(val => {
        if (val) {
          location.reload();
        }
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
   * Updates the item's category
   * @param result The new category/s chosen
   * @param oldCategory old category
   */
  updateItemCategory(result: string[], oldCategory: string) {
    if (result && result.length > 0) {
      this.item.category = result[0];
      this.searchService.getCategory(result[0]).subscribe(category => {
        this.searchService.getAncestorsOf(category).subscribe(categoryAncestors => this.categoryAncestors = categoryAncestors[0])
      });
      this.adminService.updateItem(this.item, oldCategory, null);
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
          category: parents[parent].name
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
          category: "None"
        })
      }
    }
    return cards;
  }

  onAttrValueSubmit(card: AttributeCard){
    let hasAttribute = false;
    for(let attr in this.item.attributes){
      if(this.item.attributes[attr].ID === card.ID){
        this.item.attributes[attr].value = card.value;
        hasAttribute = true;
      }
    }
    if(!hasAttribute){
      if(!this.item.attributes){
        this.item.attributes = [{
          name: card.name,
          ID: card.ID,
          value: card.value
        }];
      }
      else{
        this.item.attributes.push({
          name: card.name,
          ID: card.ID,
          value: card.value
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
            this.imageToSave = file;
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
  add(event: MatChipInputEvent | any): void {
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
      this.dirty = false;
      return false;
    } else {
      this.dirty = true;
      return true;
    }
  }

  /**
   * Saves the item to the database, sets not dirty, and sets previousItem
   */
  async saveItem() {
    // first, upload the image if edited, upload when we get the new ID
    if (this.previousItem.imageUrl !== this.item.imageUrl) {
      // post to upload image
      if (this.imageToSave) {
        return this.imageService.putImage(this.item.imageUrl, this.item.ID).then(link => {
          this.item.imageUrl = link;
          this.placeIntoDB();
        });
      }
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
      if (val === true) {
        this.previousItem = JSON.parse(JSON.stringify(this.item));
        this.dirty = false;
        this.snack.open('Item Save Successful', "OK", {duration: 3000, panelClass: ['mat-toolbar']});
      } else {
        this.snack.open('Item Save Failed', "OK", {duration: 3000, panelClass: ['mat-warn']});
      }
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
