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

@Component({
  selector: 'app-hierarchy-item',
  templateUrl: './hierarchy-item.component.html',
  styleUrls: ['./hierarchy-item.component.css']
})
export class HierarchyItemComponent implements OnInit {
  
  isCategory = true;                                        // Category or location
  hierarchyItem: HierarchyItem;                             // Main thing we'd view here
  control = new FormControl('', Validators.nullValidator);  // Makes sure the name is non-empty
  role: string;                                             // If the user is admin
  dirty: boolean;                                           // Is the item edited dirty
  previousItem: HierarchyItem;                              // Previous item, before edits are made
  imageToSave: File = null;                                 // The image to upload when saved
  parentsToDisplay: HierarchyItem[][];                      // For the ancestor view component (and eventually loading attributes)
  attributeNames: string[] = [];                            // Names of attributes in this category
  inheritedAttributes: [{
    name: string;
    categoryName: string;
  }];                   // Names of unmodifyable attributes from any parent
  //renameBind: string[] = [];                                       // For attribute renaming inputs from the form field
  isSaving = false;

  // edit fields for name and description
  @ViewChild('name', {static: false}) nameField: ElementRef;
  // @ViewChild('desc', {static: false}) descField: ElementRef;
  // @ViewChild('tags', {static: false}) tagsField: ElementRef;
  textEditFields: {
    name: boolean;
    // desc: boolean;
    // tags: boolean;
  } = {name: false/*, desc: false, tags: false*/};

  constructor(
    private searchService: SearchService, 
    private route: ActivatedRoute, 
    private authService: AuthService, 
    private imageService: ImageService,
    private snack: MatSnackBar, 
    public adminService: AdminService,
    private router: Router,
    public dialog: MatDialog,
    ) { }

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

        this.searchService.getAncestorsOf(cat).subscribe(parents => {
          this.parentsToDisplay = parents;
          this.inheritedAttributes = null;

          for(let parent in parents[0]){
            let attrCategory = (parents[0][parent] as Category);
            if(attrCategory.attributes)
            for(let attr in attrCategory.attributes){ // Print att (TEMP)
              if(this.inheritedAttributes){
                this.inheritedAttributes.push({name: attrCategory.attributes[attr]["name"], categoryName: attrCategory.name});
              }
              else {
                this.inheritedAttributes = [
                  {
                    name: attrCategory.attributes[attr]["name"],
                    categoryName: attrCategory.name
                  }
                ]
              }
            }
          }

        });
        this.previousItem = JSON.parse(JSON.stringify(this.hierarchyItem)); // deep copy
      })
      
    } else {
      this.searchService.getLocation(id).subscribe(loc => {
        this.hierarchyItem = loc;
        this.searchService.getAncestorsOf(loc).subscribe(parents => this.parentsToDisplay = parents);
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
            this.checkDirty();
            this.imageToSave = file;
          });
        }
      };
    }
  }

  checkDirty() {
    if (JSON.stringify(this.hierarchyItem) === JSON.stringify(this.previousItem)) {
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
    this.isSaving = true;
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
      if (confirmation === true) {
        this.previousItem = JSON.parse(JSON.stringify(this.hierarchyItem));
        this.dirty = false;
        this.snack.open('Save Successful', "OK", {duration: 3000, panelClass: ['mat-toolbar']});
      } else {
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
      // case 'desc':
      //   this.textEditFields.desc = true;
      //   // focus
      //   setTimeout(() => this.descField.nativeElement.focus(), 0);
      //   break;
      // case 'tags':
      //   this.textEditFields.tags = true;
      //   // focus
      //   setTimeout(() => this.tagsField.nativeElement.focus(), 0);
      //   break;
      default:
        break;
    }
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

    this.dirty = true;
  }

  async deleteAttribute(name: string){
    if (confirm('Are you sure you want to delete the attribute?\nThis cannot be undone.')) {
      let attrs = (this.hierarchyItem as Category).attributes;
      for(let attr in attrs){
        if(attrs[attr]["name"] === name){
          delete (this.hierarchyItem as Category).attributes[attr];
          this.attributeNames = this.attributeNames.filter(elem => elem !== name);
          this.dirty = true;
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
      if(result[0])
        this.hierarchyItem.parent = result[0];
        if(this.isCategory){
          this.adminService.updateCategoryPosition(result[0], this.hierarchyItem.ID, oldLocation)
        } else {
          this.adminService.updateLocationPosition(result[0], this.hierarchyItem.ID, oldLocation)
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
