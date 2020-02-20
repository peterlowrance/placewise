// adapted tree control from https://material.angular.io/components/tree/examples
import {Component, OnInit, ViewChild, ElementRef, ViewChildren} from '@angular/core';
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
import { Observable, of } from 'rxjs';
import {AuthService} from '../../services/auth.service'
import { AuthGuard } from 'src/app/guards/auth.guard';
import { FormControl, Validators, FormGroup, FormBuilder } from '@angular/forms';
import {MatChipInputEvent} from '@angular/material/chips';
import {COMMA, ENTER, SPACE} from '@angular/cdk/keycodes';

interface TreeNode{
  name: string;
  imageUrl: string;
  children: TreeNode[];
  ID: string;
}

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.css']
})
export class ItemComponent implements OnInit {
  readonly separatorKeysCodes: number[] = [ENTER, COMMA, SPACE];

  id: string; // item id
  item: Item; // item returned by id
  previousItem: Item; //previous item, before edits are made
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



  //Parent of heirarchy, does nothing now
  parent: TreeNode = {name: null, imageUrl: null, children: null, ID: null};
  //category of the item
  category: HierarchyItem;

  // tree components from material source
  treeControl = new NestedTreeControl<TreeNode>(node => node.children);

  dataSource = new MatTreeNestedDataSource<TreeNode>();

  toTree = (h: HierarchyItem) => {return {name: h.name, imageUrl: h.imageUrl, children: [], ID: h.ID}};

  hasChild = (_: number, node: TreeNode) => !!node.children && node.children.length > 0;



  role: string; //user role for editing
  dirty: boolean; //is the item edited dirty

  textEditFields:{
    name: boolean;
    desc: boolean;
    tags: boolean;
  } = {name: false, desc: false, tags: false}

  //view child refs
  //@ViewChild("name", {read: ElementRef, static: false}) nameField: ElementRef;

  // nameControl = new FormControl('', Validators.required);
  // nameForm: FormGroup;

  constructor(
    private searchService: SearchService,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private authService: AuthService,
    private formBuilder: FormBuilder
  ) {
  }

  ngOnInit() {
    // retrieve id
    this.id = this.route.snapshot.paramMap.get('id');

    // get the item from the id
    this.searchService.getItem(this.id).subscribe(item => {
      // get the item ref
      this.item = item;
      this.previousItem = JSON.parse(JSON.stringify(item)); //deep copy
      //get all locations and filter
      this.searchService.getAncestorsOfItem(item.ID).subscribe(hierarchy => {
        //need to loop over first elements, pop off, and combine any like
        //first pop off all top level locations, those are the root
        for(let h of hierarchy){
            let head = this.toTree(h.pop());
            this.parent = this.parent.ID === null ? head : this.parent;
            //go over all list and keep building node list
            this.parent.children.push(this.convertList(h));
        }

        //now collapse duplicates
        this.collapseNodes(this.parent);

        this.dataSource.data = this.parent.children;
      });

      //get the category information
      this.searchService.getCategory(item.category).subscribe(val => this.category = val);
    });

    //get user role
    this.role = this.authService.role;

    //set up admin change forms
    // this.nameForm = this.formBuilder.group({name: this.nameControl})
  }

  convertList(items: HierarchyItem[]): TreeNode {
    if(items.length === 0) return null;
    else{
      var level = this.toTree(items.pop());
      let child = this.convertList(items);

      //add if not null
      if(child) level.children.push(child);
      return level;
    }
  }

  /**
   * Collapses a single level of the node hierarchy
   * Adapted with insight from: https://stackoverflow.com/questions/16747798/delete-duplicate-elements-from-an-array
   * @param node 
   */
  collapseNodes(node: TreeNode){
    var m = {}, newarr = []
    for (var i=0; i<node.children.length; i++) {
      var v = node.children[i];
      if (!m[v.ID]) {
        m[v.ID]=v;
        newarr.push(v);
      }
      else{
        m[v.ID].children = m[v.ID].children.concat(v.children);
      }
    }
    node.children = newarr;
    for(let child of node.children){
      this.collapseNodes(child);
    }
  }

  toggleMoreInfo() {
    this.expanded = !this.expanded;
  }

  createReport() {
    // reset report data, ensure clicking out defaults to fail and no double send
    this.errorDesc = {valid: false, desc: ''};

    const dialogRef = this.dialog.open(ReportDialogComponent, {
      width: '240px',
      data: {
        valid: this.errorDesc.valid,
        desc: this.errorDesc.desc
      }
    });

    dialogRef.afterClosed().subscribe(result => {
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
        console.log(this.report);
      }
    });
  }

  /**
   * A field edit handler
   * @param field the string name of the item field to edit
   */
  editField(field: string){
    //set edit field value to enable state change, then set focus
    switch(field){
      case 'name':
        this.textEditFields.name = true;
        //focus
        //this.nameField.nativeElement.focus();
        break;
      case 'desc':
        this.textEditFields.desc = true;
        //focus

        break;
      case 'tags':
        this.textEditFields.tags = true;
        //focus

        break;
      default: break;
    }
  }

  /**
   * Handles logic for submitting the name
   */
  onNameSubmit(){
    //check to see if name is valid
    if(this.item.name !== ""){
      // this.item.name = this.nameForm.value;
      //hide control
      this.textEditFields.name = false;
    }
    else{
      this.item.name = this.previousItem.name;
      //TODO: show snackbar
    }

    //check for dirtiness
    this.checkDirty();
  }

  /**
   * Handles logic for submitting the description
   */
  onDescSubmit(){
    //check to see if name is valid
    if(this.item.desc !== ""){
      // this.item.name = this.nameForm.value;
      //hide control
      this.textEditFields.desc = false;
    }
    else{
      this.item.desc = this.previousItem.desc;
      //TODO: show snackbar
    }

    //check for dirtiness
    this.checkDirty();
  }

  /** Tag control: https://material.angular.io/components/chips/examples */

  /**
   * Adds a tag to the list
   * @param event tag input event
   */
  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our fruit
    if ((value || '').trim()) {
      this.item.tags.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    //check dirty
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

    //check dirty
    this.checkDirty();
  }

  /**
   * Checks to see if the current item is dirty (edited)
   */
  checkDirty(){
    if(this.item === this.previousItem){
      this.dirty = false;
      return false;
    }
    else{
      this.dirty = true;
      return true;
    }
  }

  /**
   * Saves the item to the database, sets not dirty, and sets previousItem
   */
  saveItem(){
    //TODO: call save in service, wait for success or display snack
    {
      this.previousItem = JSON.parse(JSON.stringify(this.item));
      this.dirty = false;
    }
  }

}
