import { Component, OnInit, Input, ElementRef, ViewChild, SystemJsNgModuleLoader } from '@angular/core';
import {HierarchyItem} from '../../models/HierarchyItem';
import {FormControl, Validators} from "@angular/forms";
import {ActivatedRoute} from '@angular/router';
import {AuthService} from "../../services/auth.service";
import { SearchService } from '../../services/search.service';
import {ImageService} from '../../services/image.service';
import {MatSnackBar} from '@angular/material';
import {AdminService} from '../../services/admin.service';
import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {ModifyHierarchyDialogComponent} from '../modify-hierarchy-dialog/modify-hierarchy-dialog.component';
import { Category } from 'src/app/models/Category';
import { Attribute } from 'src/app/models/Attribute';
import { Timestamp, timestamp } from 'rxjs/internal/operators/timestamp';
import { trigger, style, transition, animate, keyframes} from '@angular/animations';
import { NavService } from 'src/app/services/nav.service';
import { IfStmt } from '@angular/compiler';

@Component({
  selector: 'app-hierarchy-item',
  templateUrl: './hierarchy-item.component.html',
  styleUrls: ['./hierarchy-item.component.css'],
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
export class HierarchyItemComponent implements OnInit {
  
  isCategory = true;                                        // Category or location
  hierarchyItem: HierarchyItem;                             // Main thing we'd view here
  control = new FormControl('', Validators.nullValidator);  // Makes sure the name is non-empty
  role: string;                                             // If the user is admin
  previousItem: HierarchyItem;                              // Previous item, before edits are made
  imageToSave: File = null;                                 // The image to upload when saved
  parentsToDisplay: HierarchyItem[][];                      // For the ancestor view component (and eventually loading attributes)
  attributeNames: string[] = [];                            // Names of attributes in this category
  inheritedAttributes: [{
    name: string;
    categoryName: string;
    ID: string;
  }];                   // Names of unmodifyable attributes from any parent
  attributeSuffixesForDisplay: [{
    positionID: string;
    beforeText: string;
    attributeID: string;
    name: string;
    afterText: string;
    editingBefore: boolean;
    editingAfter: boolean;
  }]
  //renameBind: string[] = [];                                       // For attribute renaming inputs from the form field
  isSaving = false;
  dirty = false; // Needed for HTML

  // edit fields for name and description
  @ViewChild('name', {static: false}) nameField: ElementRef;
  @ViewChild('desc', {static: false}) descField: ElementRef;
  // @ViewChild('tags', {static: false}) tagsField: ElementRef;
  textEditFields: {
    name: boolean;
    desc: boolean;
    // tags: boolean;
  } = {name: false, desc: false,/* tags: false*/};

  constructor(
    private searchService: SearchService, 
    private route: ActivatedRoute, 
    private authService: AuthService, 
    private imageService: ImageService,
    private snack: MatSnackBar, 
    public adminService: AdminService,
    private router: Router,
    public dialog: MatDialog,
    public navService: NavService
    ) { }

    getDirty(){ return this.navService.getDirty() }
    setDirty(value: boolean){ this.navService.setDirty(value); }


  ngOnInit() {
    let id = this.route.snapshot.paramMap.get('id');
    this.isCategory = this.route.snapshot.paramMap.get('selectedHierarchy') === 'categories';
    this.role = this.authService.role;

    if(this.isCategory){
      this.searchService.getCategory(id).subscribe(cat => {
        this.hierarchyItem = cat;

        this.attributeNames = [];
        for(let att in cat.attributes){
          this.attributeNames.push(cat.attributes[att]["name"]);
        }
        this.attributeNames.sort(function(a, b) {
          var nameA = a.toUpperCase(); // ignore upper and lowercase
          var nameB = b.toUpperCase(); // ignore upper and lowercase
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }
          return 0;
        });

        this.searchService.getAncestorsOf(cat).subscribe(parents => {
          this.parentsToDisplay = parents;
          let buildingAttributes: [{
            name: string;
            categoryName: string;
            ID: string;
          }];

          for(let parent in parents[0]){
            let attrCategory = (parents[0][parent] as Category);
            if(attrCategory.attributes)
            for(let attr in attrCategory.attributes){
              if(buildingAttributes){

                // Have the attributes sorted as they are added
                let newItemNameCapped = attrCategory.attributes[attr]["name"].toUpperCase();
                if (buildingAttributes[buildingAttributes.length-1].name.toUpperCase() < newItemNameCapped){
                  buildingAttributes.splice(buildingAttributes.length, 0, {name: attrCategory.attributes[attr]["name"], categoryName: attrCategory.name, ID: attr});
                }
                else {
                  for(let index in buildingAttributes){
                    if(newItemNameCapped < buildingAttributes[index].name.toUpperCase()){
                      buildingAttributes.splice(parseInt(index), 0, {name: attrCategory.attributes[attr]["name"], categoryName: attrCategory.name, ID: attr});
                      break;
                    }
                  }
                }
              }
              else {
                buildingAttributes = [
                  {
                    name: attrCategory.attributes[attr]["name"],
                    categoryName: attrCategory.name,
                    ID: attr
                  }
                ]
              }
            }
          }
          this.inheritedAttributes = buildingAttributes;

          // TODO: MESSY. Might need to fully import local attributes in some way.
          // Setup attributes for being displayed in suffixes
          let buildingSuffixes: [{
            positionID: string;
            beforeText: string;
            attributeID: string;
            name: string;
            afterText: string;
            editingBefore: boolean;
            editingAfter: boolean;
          }];
          for(let suffix in cat.suffixStructure){

            if(cat.suffixStructure[suffix].attributeID === 'parent'){ // If it's the parent's suffix
                let before = cat.suffixStructure[suffix].beforeText;
                let after = cat.suffixStructure[suffix].afterText;
                let attrId = cat.suffixStructure[suffix].attributeID;

                if(buildingSuffixes){
                  buildingSuffixes.push({
                    beforeText: before, attributeID: attrId, afterText: after, positionID: suffix, editingBefore: false, editingAfter: false,
                    name: "Parent Category's Suffix"
                  })
                }
                else {
                  buildingSuffixes = [{
                    beforeText: before, attributeID: attrId, afterText: after, positionID: suffix, editingBefore: false, editingAfter: false,
                    name: "Parent Category's Suffix"
                  }]
                }
            }
            else {
              if(cat.attributes && cat.attributes[cat.suffixStructure[suffix].attributeID]){ // If the attribute is in the local category
                let before = cat.suffixStructure[suffix].beforeText;
                let after = cat.suffixStructure[suffix].afterText;
                let attrId = cat.suffixStructure[suffix].attributeID;
  
                if(buildingSuffixes){
                  buildingSuffixes.push({
                    beforeText: before, attributeID: attrId, afterText: after, positionID: suffix, editingBefore: false, editingAfter: false,
                    name: cat.attributes[cat.suffixStructure[suffix].attributeID]['name']
                  })
                }
                else {
                  buildingSuffixes = [{
                    beforeText: before, attributeID: attrId, afterText: after, positionID: suffix, editingBefore: false, editingAfter: false,
                    name: cat.attributes[cat.suffixStructure[suffix].attributeID]['name']
                  }]
                }
              }
              else for(let attr in this.inheritedAttributes){
                if(this.inheritedAttributes[attr].ID === cat.suffixStructure[suffix].attributeID){ // If the attribute come from one of the parents
                  let before = cat.suffixStructure[suffix].beforeText;
                  let after = cat.suffixStructure[suffix].afterText;
                  let attrId = cat.suffixStructure[suffix].attributeID;
  
                  if(buildingSuffixes){
                    buildingSuffixes.push({
                      beforeText: before, attributeID: attrId, afterText: after, positionID: suffix, editingBefore: false, editingAfter: false,
                      name: this.inheritedAttributes[attr].name
                    })
                  }
                  else {
                    buildingSuffixes = [{
                      beforeText: before, attributeID: attrId, afterText: after, positionID: suffix, editingBefore: false, editingAfter: false,
                      name: this.inheritedAttributes[attr].name
                    }]
                  }
                }
              }
            }
            this.attributeSuffixesForDisplay = buildingSuffixes;
          }

        });
        if(!this.previousItem) // Don't overwrite if we already have something
        this.previousItem = JSON.parse(JSON.stringify(this.hierarchyItem)); // deep copy
      })
      
    } else {
      this.searchService.getLocation(id).subscribe(loc => {
        this.hierarchyItem = loc;
        this.searchService.getAncestorsOf(loc).subscribe(parents => this.parentsToDisplay = parents);
        
        if(!this.previousItem) // Don't overwrite if we already have something
        this.previousItem = JSON.parse(JSON.stringify(this.hierarchyItem)); // deep copy
      })
    }
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
            this.hierarchyItem.imageUrl = url;
            // set dirty and save for upload
            this.imageToSave = file;
            this.checkDirty();
          });
        }
      };
    }
  }

  checkDirty() {
    if (JSON.stringify(this.hierarchyItem) === JSON.stringify(this.previousItem)) {
      this.setDirty(false);
      return false;
    } else {
      this.saveItem();
      this.setDirty(true);
      return true;
    }
  }

  /**
   * Saves the item to the database, sets not dirty, and sets previousItem
   */
  async saveItem() {
    this.isSaving = true;
    this.adminService.addToRecent(this.hierarchyItem);
    // first, upload the image if edited, upload when we get the new ID
    if (this.previousItem.imageUrl !== this.hierarchyItem.imageUrl) {
      // post to upload image
      if (this.imageToSave) {
        return this.imageService.putImage(this.hierarchyItem.imageUrl, this.hierarchyItem.ID).then(link => {
          this.hierarchyItem.imageUrl = link;
          this.update();
        });
      }
    } else {
      //else just place
      return this.update();
    }

  }

  update() {
    this.adminService.updateHierarchy(this.hierarchyItem, this.isCategory).then(confirmation => {
      if (confirmation !== true) {
        this.snack.open('Save Failed', "OK", {duration: 3000, panelClass: ['mat-warn']});
      }
      this.isSaving = false;
    });
  }

  /**
   * A field edit handler
   * @param field the string name of the item field to edit
   */
  editField(field: string) {
    // set edit field value to enable state change, then set focus
    switch (field) {
      case 'name':
        if(this.hierarchyItem.name === 'NEW LOCATION' || this.hierarchyItem.name === 'NEW CATEGORY') this.hierarchyItem.name = ''; // Clear default name immediately
        this.textEditFields.name = true;
        // focus
        setTimeout(() => this.nameField.nativeElement.focus(), 0);
        break;
      case 'desc':
        this.textEditFields.desc = true;
        // focus
        setTimeout(() => this.descField.nativeElement.focus(), 0);
        break;
      // case 'tags':
      //   this.textEditFields.tags = true;
      //   // focus
      //   setTimeout(() => this.tagsField.nativeElement.focus(), 0);
      //   break;
      default:
        break;
    }
  }

  bumpSuffixUp(positionID: string){
    let num = parseInt(positionID);
    if(num > 0){
      let suffixToBump = this.attributeSuffixesForDisplay[num];
      let cat = (this.hierarchyItem as Category);
      for(let index in cat.suffixStructure){
        if(cat.suffixStructure[index].attributeID === suffixToBump.attributeID && 
          cat.suffixStructure[index].beforeText === suffixToBump.beforeText &&
          cat.suffixStructure[index].afterText === suffixToBump.afterText){
          let temp = cat.suffixStructure.splice(parseInt(index), 1)[0];
          cat.suffixStructure.splice(parseInt(index)-1, 0, temp);
          break;
        }
      }
      this.checkDirty();
    }
  }

  bumpSuffixDown(positionID: string){
    let num = parseInt(positionID);
    let cat = (this.hierarchyItem as Category);
    if(num < cat.suffixStructure.length-1){
      let suffixToBump = this.attributeSuffixesForDisplay[num];
      for(let index in cat.suffixStructure){
        if(cat.suffixStructure[index].attributeID === suffixToBump.attributeID && 
          cat.suffixStructure[index].beforeText === suffixToBump.beforeText &&
          cat.suffixStructure[index].afterText === suffixToBump.afterText){
          let temp = cat.suffixStructure.splice(parseInt(index), 1)[0];
          cat.suffixStructure.splice(parseInt(index)+1, 0, temp);
          break;
        }
      }
      this.checkDirty();
    }
  }

  editSuffixField(positionID: string, field: string){
    if(field === 'after'){
      this.attributeSuffixesForDisplay[parseInt(positionID)].editingAfter = true;
    }
    else {
      this.attributeSuffixesForDisplay[parseInt(positionID)].editingBefore = true;
    }
  }

  setSuffixField(positionID: string, field: string, value: string){
    let suffixes = (this.hierarchyItem as Category).suffixStructure;
    if(field === 'after'){
      this.attributeSuffixesForDisplay[parseInt(positionID)].editingAfter = false;
      suffixes[parseInt(positionID)].afterText = value;
    }
    else {
      this.attributeSuffixesForDisplay[parseInt(positionID)].editingBefore = false;
      suffixes[parseInt(positionID)].beforeText = value;
    }
    this.checkDirty();
  }

  /**
   * Handles logic for submitting the name
   */
  onNameSubmit() {
    // check to see if name is valid
    if (this.hierarchyItem.name !== '') {
      // this.item.name = this.nameForm.value;
      // hide control
      this.textEditFields.name = false;
    } else {
      this.hierarchyItem.name = this.previousItem.name;
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
    if (this.hierarchyItem.desc !== '') {
      // this.item.name = this.nameForm.value;
      // hide control
      this.textEditFields.desc = false;
    } else {
      this.hierarchyItem.desc = this.previousItem.desc;
      // TODO: show snackbar
    }

    // check for dirtiness
    this.checkDirty();
  }

  /**
   * Changes attribute names, only accessible if 
   */
  onAttrNameSubmit(name: string, newname) {
    // check to see if name is valid
    if (newname.value !== '') {

      let catAttrs = (this.hierarchyItem as Category).attributes
      for(let attr in catAttrs){
        if(catAttrs[attr]["name"] === name){
          catAttrs[attr]["name"] = newname.value;
          break;
        }
      }

      this.checkDirty();
    }

  }

  onPrefixSubmit(prefix){
    (this.hierarchyItem as Category).prefix = prefix.value;
    this.checkDirty();
  }

  addAttribute(){
    let attrs = (this.hierarchyItem as Category).attributes;
    if(attrs){
      attrs[Date.now().toString()] = {"name": "New Attribute"};
    }
    else {
      attrs = {[Date.now().toString()]: {"name" : "New Attribute"}};
    }
    (this.hierarchyItem as Category).attributes = attrs;
    this.attributeNames.push("New Attribute");


    this.checkDirty();
  }

  setAttributeSuffix(idOrName: string, suffixID: string, isLocal: false){
    if(isLocal){ // Locally we only have the name
      let attrs = (this.hierarchyItem as Category).attributes;
      for(let attr in attrs){
        if(attrs[attr]['name'] === idOrName){
          (this.hierarchyItem as Category).suffixStructure[parseInt(suffixID)].attributeID = attr;
        }
      }
    }
    else { // Otherwise set the id directly
      (this.hierarchyItem as Category).suffixStructure[parseInt(suffixID)].attributeID = idOrName;
    }
    this.checkDirty();
  }

  addAttributeSuffix(){
    if((this.hierarchyItem as Category).suffixStructure){
      (this.hierarchyItem as Category).suffixStructure.push({beforeText: ' ', attributeID: 'parent', afterText: ''})
    }
    else {
      (this.hierarchyItem as Category).suffixStructure = [{beforeText: ' ', attributeID: 'parent', afterText: ''}];
    }
    this.checkDirty();
  }

  deleteAttributeSuffix(position: string){
    (this.hierarchyItem as Category).suffixStructure.splice(parseInt(position), 1);

    this.checkDirty();
  }

  undoChanges() {
    let itemToRevert = this.hierarchyItem;
    this.hierarchyItem = JSON.parse(JSON.stringify(this.previousItem)); // Copy so then the original stays original
    
    if(this.hierarchyItem.parent !== itemToRevert.parent){
      if(this.isCategory){
        this.adminService.updateCategoryPosition(this.hierarchyItem.parent, this.hierarchyItem.ID, itemToRevert.parent);
      } else {
        this.adminService.updateLocationPosition(this.hierarchyItem.parent, this.hierarchyItem.ID, itemToRevert.parent);
      }
    }

    this.saveItem();
    this.setDirty(false);
  }

  async deleteAttribute(name: string){
    if (confirm('Are you sure you want to delete the attribute?\nThis cannot be undone.')) {
      let attrs = (this.hierarchyItem as Category).attributes;
      for(let attr in attrs){
        if(attrs[attr]["name"] === name){
          delete (this.hierarchyItem as Category).attributes[attr];
          this.attributeNames = this.attributeNames.filter(elem => elem !== name);
          this.checkDirty();
        }
      }
    }
  }

  /**
   * Changes the item's position from what was selected in the Dialog
   */
  editHierarchy() {
    const oldLocation = this.hierarchyItem.parent ? this.hierarchyItem.parent : 'root';
    const dialogRef = this.dialog.open(ModifyHierarchyDialogComponent, {
      width: '45rem',
      data: {hierarchy: this.isCategory ? 'categories' : 'locations', singleSelection: true, id: this.hierarchyItem.ID, parents: [this.hierarchyItem.parent]}
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result && result[0] && this.hierarchyItem.parent !== result[0]){
        this.hierarchyItem.parent = result[0];
        if(this.isCategory){
          this.adminService.updateCategoryPosition(result[0], this.hierarchyItem.ID, oldLocation)
          let sub = this.searchService.getCategory(this.hierarchyItem.parent).subscribe(cat => {
            this.adminService.addToRecent(cat);
            sub.unsubscribe();
          });
        } else {
          this.adminService.updateLocationPosition(result[0], this.hierarchyItem.ID, oldLocation)
          let sub = this.searchService.getLocation(this.hierarchyItem.parent).subscribe(loc => {
            this.adminService.addToRecent(loc);
            sub.unsubscribe();
          });
        }
        this.setDirty(true);
        this.adminService.addToRecent(this.hierarchyItem);
      }
    });
  }

  requestDelete(){
    if (confirm('Are you sure you want to delete the ' + (this.isCategory ? 'category?\nCategories and items within ' : 'location?\nLocations and items within ') + this.hierarchyItem.name + ' will not be deleted.\nThis cannot be undone.')) {
      if (this.isCategory) {
        this.adminService.removeCategory(this.hierarchyItem).then(() => {
          this.snack.open('Category Successfully Deleted', "OK", {duration: 3000, panelClass: ['mat-toolbar']});
          this.router.navigate(['search/categories/' + this.hierarchyItem.parent]);
        }).catch(err => {
          this.snack.open('Category Deletion Failed', "OK", {duration: 3000, panelClass: ['mat-warn']});
        });
      } else {
        this.adminService.removeLocation(this.hierarchyItem).then(() => {
          this.snack.open('Location Successfully Deleted', "OK", {duration: 3000, panelClass: ['mat-toolbar']});
          this.router.navigate(['search/locations/' + this.hierarchyItem.parent]);
        }).catch(err => {
          this.snack.open('Location Deletion Failed', "OK", {duration: 3000, panelClass: ['mat-warn']});
        });
      }
      
    }
  }

  clearName(){
    this.hierarchyItem.name = '';
  }

  // /**
  //  * Move a node to a new location
  //  * @param node node to be moved
  //  * @param newParent new parent of the node. If it is null, the parent is the root
  //  */
  // move(node: TreeHierarchyItem, newParent?: TreeHierarchyItem) {
  //   const newParentID = newParent ? newParent.ID : 'root';
  //   const hasCorrectParent = (node.realParent && node.realParent.ID === newParentID) || (!node.realParent && !newParent);
  //   // If the node doesn't already have the correct parent, delete it and add it in the new position
  //   if (!hasCorrectParent) {
  //     this.delete(node, false, false);
  //     this.add(node, newParent, false);
  //     if (this.isCategory) {
  //       this.adminService.updateCategoryPosition(newParentID, node.ID, node.parent);
  //     } else {
  //       this.adminService.updateLocationPosition(newParentID, node.ID, node.parent);
  //     }
  //   }
  //   this.changeParentNode = null;
  //   this.openEditModal(node);
  //   // In .1 seconds, expand the parents of the moved item
  //   setTimeout(() => { this.expandParents(this.findByID(node.ID, this.dataSource.data));}, 100);
  // }

}
