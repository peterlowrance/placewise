import { Component, OnInit, Input, ElementRef, ViewChild, SystemJsNgModuleLoader } from '@angular/core';
import {HierarchyItem} from '../../models/HierarchyItem';
import {FormControl, FormGroupDirective, NgForm, Validators} from "@angular/forms";
import {ActivatedRoute} from '@angular/router';
import {AuthService} from "../../services/auth.service";
import { SearchService } from '../../services/search.service';
import {ImageService} from '../../services/image.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AdminService} from '../../services/admin.service';
import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {ModifyHierarchyDialogComponent} from '../modify-hierarchy-dialog/modify-hierarchy-dialog.component';
import { Category } from 'src/app/models/Category';
import { Timestamp, timestamp } from 'rxjs/internal/operators/timestamp';
import { trigger, style, transition, animate, keyframes} from '@angular/animations';
import { NavService } from 'src/app/services/nav.service';
import { IfStmt } from '@angular/compiler';
import { AttributeOptionsEditorDialogComponent } from 'src/app/components/attribute-options-editor-dialog/attribute-options-editor-dialog.component';
import { AttributeBuilderDialogComponent } from '../attribute-builder-dialog/attribute-builder-dialog.component';
import { AddAttributeSuffixDialogComponent } from '../add-attribute-suffix-dialog/add-attribute-suffix-dialog.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { CategoryAttribute } from 'src/app/models/Attribute';
import { HierarchyLocation } from 'src/app/models/Location';
import { ErrorStateMatcher } from '@angular/material/core';

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
  
  workspaceID: string;
  loaded: boolean = false;  // To tell if the item doesn't exist or just hasn't loaded
  isCategory = true;  // Category or location
  hierarchyItem: HierarchyItem;  // Main thing we'd view here
  hierAsCategory: Category;
  control = new FormControl('', Validators.nullValidator);  // Makes sure the name is non-empty
  role: string;  // If the user is admin
  previousItem: HierarchyItem;  // Previous item, before edits are made
  imageToSave: File = null;  // The image to upload when saved
  parentsToDisplay: HierarchyItem[][];  // For the ancestor view component (and eventually loading attributes)
  localAttributes: {  // Names of attributes in this category
    name: string,
    type: string,
    opened: boolean
  }[]
  inheritedAttributes: {  // Names of unmodifyable attributes from any parent
    categoryName: string,
    attribute: CategoryAttribute
  }[];
  //renameBind: string[] = [];                                       // For attribute renaming inputs from the form field
  isSaving = false;
  dirty = false; // Needed for HTML
  previousName: string; // Needed for automatically making the prefix the name with checking what it was previously: to make sure it's not custom
  shelfID: number;

  // edit fields for name and description
  @ViewChild('name') nameField: ElementRef;
  @ViewChild('desc') descField: ElementRef;
  // @ViewChild('tags', {static: false}) tagsField: ElementRef;
  textEditFields: {
    name: boolean;
    desc: boolean;
    prefix: boolean;
    // tags: boolean;
  } = {name: false, desc: false,/* tags: false,*/ prefix: false};


  usedID: string; // BAD: A bit hacky
  //matcher = new MyErrorStateMatcher();

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
    this.workspaceID = this.route.snapshot.paramMap.get("workspaceID");
    this.isCategory = this.route.snapshot.paramMap.get('selectedHierarchy') === 'categories';
    this.role = this.authService.role;

    if(this.isCategory){
      this.searchService.getCategory(this.workspaceID, id).subscribe(cat => {
        this.loaded = true;
        if(cat){
          this.hierarchyItem = cat;
          this.hierAsCategory = cat;

          this.localAttributes = [];
          for(let att in cat.attributes){
            this.localAttributes.push({
              name: cat.attributes[att]["name"], 
              type: cat.attributes[att]["type"] ? cat.attributes[att]["type"] : 'text',
              opened: cat.attributes[att]["name"] === 'New Attribute'
            });
          }
          this.localAttributes.sort(function(a, b) {
            var nameA = a.name.toUpperCase(); // ignore upper and lowercase
            var nameB = b.name.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }
            return 0;
          });

          this.searchService.getAncestorsOf(this.workspaceID, cat).subscribe(parents => {
            this.parentsToDisplay = parents;
            let buildingAttributes: {
              categoryName: string,
              attribute: CategoryAttribute
            }[];

            for(let parent in parents[0]){
              let ancestorCategory = (parents[0][parent] as Category);
              if(ancestorCategory.attributes)
              for(let attr in ancestorCategory.attributes){
                if(buildingAttributes){

                  // Have the attributes sorted as they are added
                  let newItemNameCapped = ancestorCategory.attributes[attr]["name"].toUpperCase();
                  if (buildingAttributes[buildingAttributes.length-1].attribute.name.toUpperCase() < newItemNameCapped){
                    buildingAttributes.splice(buildingAttributes.length, 0, {categoryName: ancestorCategory.name, attribute: ancestorCategory.attributes[attr]});
                  }
                  else {
                    for(let index in buildingAttributes){
                      if(newItemNameCapped < buildingAttributes[index].attribute.name.toUpperCase()){
                        buildingAttributes.splice(parseInt(index), 0, {categoryName: ancestorCategory.name, attribute: ancestorCategory.attributes[attr]});
                        break;
                      }
                    }
                  }
                }
                else {
                  buildingAttributes = [
                    {
                      categoryName: ancestorCategory.name,
                      attribute: ancestorCategory.attributes[attr]
                    }
                  ]
                }
              }
            }
            this.inheritedAttributes = buildingAttributes;

          });
          if(!this.previousItem) // Don't overwrite if we already have something
          this.previousItem = JSON.parse(JSON.stringify(this.hierarchyItem)); // deep copy
        }
      })
      
    } else {
      this.searchService.getLocation(this.workspaceID, id).subscribe(loc => {
        this.loaded = true;
        if(loc){
          this.hierarchyItem = loc;
          this.searchService.getAncestorsOf(this.workspaceID, loc).subscribe(parents => this.parentsToDisplay = parents);
          
          if(loc.shelfID){
            this.shelfID = Number.parseInt(loc.shelfID);
          }

          if(!this.previousItem) // Don't overwrite if we already have something
          this.previousItem = JSON.parse(JSON.stringify(this.hierarchyItem)); // deep copy
        }
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
        return this.imageService.putImage(this.workspaceID, this.hierarchyItem.imageUrl, this.hierarchyItem.ID).then(link => {
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
    // BAD: We should pass around a wrapper so that we don't have to hard duplicate when messing with some metadata
    this.adminService.updateHierarchy(this.workspaceID, JSON.parse(JSON.stringify(this.hierarchyItem)), this.isCategory).then(confirmation => {
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

  /**
   * Handles logic for submitting the name
   */
  onNameSubmit() {
    // check to see if name is valid
    if (this.hierarchyItem.name !== '') {
      // If the prefix was the name, set it to the new name
      if(this.hierAsCategory && this.previousName === this.hierAsCategory.prefix){
        this.hierAsCategory.prefix = this.hierarchyItem.name;
      }
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

      let catAttrs = this.hierAsCategory.attributes
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
    this.hierAsCategory.prefix = prefix.value;
    this.textEditFields.prefix = false;
    this.checkDirty();
  }

  addAttribute(){
    this.dialog.open(AttributeBuilderDialogComponent, {width: '360px'})
    .beforeClosed().subscribe(result => {
      if(result.wasValid){
        if(!this.hierAsCategory.attributes){
          this.hierAsCategory.attributes = [];
        }
        this.hierAsCategory.attributes.push(result.data);
        this.update();
      }
    });

    /*
    let attrs = this.hierAsCategory.attributes;
    if(attrs){
      attrs.push({"name": "New Attribute"}); // Type can be blank, it will just be set to 'text' upon load
    }
    else {
      attrs = [{"name" : "New Attribute"}];
    }
    this.hierAsCategory.attributes = attrs;
    this.localAttributes.push({name: "New Attribute", type: 'text', opened: true});
    // this.addAttributeSuffix(newID); I believe this is more unexpected than helpful

    this.checkDirty();
    */
  }

  addAttributeSuffix(newID: string = 'parent'){
    // Add parent attributes before opening
    let suffixAttributes: CategoryAttribute[];

    // First add ancestor attributes
    if(this.inheritedAttributes){
      suffixAttributes = [];
      this.inheritedAttributes.forEach(categoryAndAtt => {
        suffixAttributes.push(categoryAndAtt.attribute);
      });
    }

    // Then decide how to add the rest of the attributes
    if(this.hierAsCategory.attributes){
      if(suffixAttributes){
        suffixAttributes = suffixAttributes.concat(this.hierAsCategory.attributes);
      }
      else {
        suffixAttributes = this.hierAsCategory.attributes;
      }
    }

    this.dialog.open(AddAttributeSuffixDialogComponent, {width: '360px', data: { attributes: suffixAttributes, usedAttributes: []}})
    .beforeClosed().subscribe(result => {
      if(result && result.wasValid){
        console.log(result.data.type);

        if(result.data.data){
          if(this.hierAsCategory.titleFormat){
            this.hierAsCategory.titleFormat.push({type: result.data.type, data: result.data.data});
          }
          else {
            this.hierAsCategory.titleFormat = [{type: result.data.type, data: result.data.data}];
          }
        }
        else {
          if(this.hierAsCategory.titleFormat){
            this.hierAsCategory.titleFormat.push({type: result.data.type});
          }
          else {
            this.hierAsCategory.titleFormat = [{type: result.data.type}];
          }
        }

        this.update();
      }
    });

    /*
    if(this.hierAsCategory.suffixStructure){
      this.hierAsCategory.suffixStructure.push({beforeText: ' ', attributeID: newID, afterText: ''})
    }
    else {
      this.hierAsCategory.suffixStructure = [{beforeText: ' ', attributeID: newID, afterText: ''}];
    }
    this.checkDirty();
    */
  }

  deleteAttributeSuffix(index: number){
    if(confirm("Are you sure you want to delete this suffix element?\nThis will not edit the current items - that's for the future.\nBut this will make the titles misaligned and may cause problems in the future.")){
      console.log(this.hierAsCategory.titleFormat.splice(index, 1));
      this.update();
    }
  }

  setAttributeType(name: string, type: string){
    let attrs = this.hierAsCategory.attributes;
    for(let attr in attrs){
      if(attrs[attr]['name'] === name){
        attrs[attr]['type'] = type;
      }
    }
    this.checkDirty();
  }

  openAttributeOptionsModal(name: string){
    let attrs = this.hierAsCategory.attributes;
    for(let attr in attrs){
      if(attrs[attr].name === name){
        
        this.dialog.open(AttributeBuilderDialogComponent, {
          width: '360px',
          data: {attribute: attrs[attr], step:  'options', finishStep: true},
        })
        .beforeClosed().subscribe(result => {
          if(result.wasValid){
            attrs[attr] = result.data;
            this.update();
          }
        });
      }
    }
  }

  undoChanges() {
    let itemToRevert = this.hierarchyItem;
    this.hierarchyItem = JSON.parse(JSON.stringify(this.previousItem)); // Copy so then the original stays original
    
    if(this.hierarchyItem.parent !== itemToRevert.parent){
      if(this.isCategory){
        this.adminService.updateCategoryPosition(this.workspaceID, this.hierarchyItem.parent, this.hierarchyItem.ID, itemToRevert.parent);
      } else {
        this.adminService.updateLocationPosition(this.workspaceID, this.hierarchyItem.parent, this.hierarchyItem.ID, itemToRevert.parent);
      }
    }

    this.saveItem();
    this.setDirty(false);
  }

  async deleteAttribute(name: string){
    if (confirm('Are you sure you want to delete the attribute?\nThis cannot be undone.')) {
      let attrs = this.hierAsCategory.attributes;
      for(let attr in attrs){
        if(attrs[attr]["name"] === name){
          this.hierAsCategory.attributes.splice(Number.parseInt(attr));
          this.localAttributes = this.localAttributes.filter(elem => elem.name !== name);
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
      data: {workspaceID: this.workspaceID, hierarchy: this.isCategory ? 'categories' : 'locations', singleSelection: true, id: this.hierarchyItem.ID, parents: [this.hierarchyItem.parent]}
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result && result[0] && this.hierarchyItem.parent !== result[0]){
        this.hierarchyItem.parent = result[0];
        if(this.isCategory){
          this.adminService.updateCategoryPosition(this.workspaceID, result[0], this.hierarchyItem.ID, oldLocation)
          let sub = this.searchService.getCategory(this.workspaceID, this.hierarchyItem.parent).subscribe(cat => {
            this.adminService.addToRecent(cat);
            sub.unsubscribe();
          });
        } else {
          this.adminService.updateLocationPosition(this.workspaceID, result[0], this.hierarchyItem.ID, oldLocation)
          let sub = this.searchService.getLocation(this.workspaceID, this.hierarchyItem.parent).subscribe(loc => {
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
        this.adminService.removeCategory(this.workspaceID, this.hierarchyItem).then(() => {
          this.snack.open('Category Successfully Deleted', "OK", {duration: 3000, panelClass: ['mat-toolbar']});
          this.router.navigate(['/w/' + this.workspaceID + '/search/categories/' + this.hierarchyItem.parent]);
        }).catch(err => {
          this.snack.open('Category Deletion Failed', "OK", {duration: 3000, panelClass: ['mat-warn']});
        });
      } else {
        this.adminService.removeLocation(this.workspaceID, this.hierarchyItem).then(() => {
          this.snack.open('Location Successfully Deleted', "OK", {duration: 3000, panelClass: ['mat-toolbar']});
          this.router.navigate(['/w/' + this.workspaceID + '/search/locations/' + this.hierarchyItem.parent]);
        }).catch(err => {
          this.snack.open('Location Deletion Failed', "OK", {duration: 3000, panelClass: ['mat-warn']});
        });
      }
      
    }
  }

  clearName(){
    this.hierarchyItem.name = '';
  }

  drop(event: CdkDragDrop<string[]>) {
    console.log(this.hierAsCategory.titleFormat);
    moveItemInArray(this.hierAsCategory.titleFormat, event.previousIndex, event.currentIndex);
    console.log(this.hierAsCategory.titleFormat);
    this.update();
  }

  updateShelfID(){
    let previousShelfID = (this.hierarchyItem as HierarchyLocation).shelfID;
    (this.hierarchyItem as HierarchyLocation).shelfID = this.searchService.convertNumberToThreeDigitString(this.shelfID);
    this.adminService.setShelfID(this.workspaceID, this.hierarchyItem.ID, (this.hierarchyItem as HierarchyLocation).shelfID, previousShelfID).subscribe(result => {
      if(result === 'valid' || result.startsWith("Zero")){
        this.usedID = null;
        this.update();
      }
      else {
        this.usedID = (this.hierarchyItem as HierarchyLocation).shelfID;
        (this.hierarchyItem as HierarchyLocation).shelfID = previousShelfID;
        this.shelfID = Number.parseInt(previousShelfID);
      }
    });
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
