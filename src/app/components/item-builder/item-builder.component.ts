import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Category } from 'src/app/models/Category';
import { Item } from 'src/app/models/Item';
import { SearchService } from 'src/app/services/search.service';
import { ModifyHierarchyDialogComponent } from '../modify-hierarchy-dialog/modify-hierarchy-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import { AdminService } from 'src/app/services/admin.service';

@Component({
  selector: 'app-item-builder',
  templateUrl: './item-builder.component.html',
  styleUrls: ['./item-builder.component.css']
})
export class ItemBuilderComponent implements OnInit {

  constructor(
    private searchService: SearchService,
    public dialog: MatDialog,
    private adminService: AdminService,
    private route: ActivatedRoute
    ) { }

    id: string;                    // item id
    step = 0;                      // What step are we at in filling in data
    item: Item;                    // Item being setup
    category: Category;            // Category of the item
    categoryAncestors: Category[]; // All of the Category's parents

  ngOnInit() {
    // retrieve id
    this.id = this.route.snapshot.paramMap.get('id');

    this.searchService.getItem(this.id).subscribe(item => {
      if (!item) {
        return;
      }
      this.item = item;

      this.searchService.getCategory(item.category).subscribe(category => {
        this.category = category;
      });
    })
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

          if(newCategory.prefix){ // Add the prefix if it's not there, make sure to remove old
            if(this.item.name === "(New - Enter the Item Info first.)"){
              this.item.name = newCategory.prefix;
              this.item.fullTitle = this.item.name + this.buildAttributeString();
            }
            else if(!this.item.name.startsWith(newCategory.prefix)){
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
  
          this.searchService.getAncestorsOf(newCategory).subscribe(categoryAncestors => this.categoryAncestors = categoryAncestors[0]);
          localSub.unsubscribe(); // Don't want this screwing with us later
          this.adminService.updateItem(this.item, oldCategory, null); // TODO: Not good placement, seperate from normal saving routine
        }
      });
    }
  }

  // YIKES REPEATED CODE
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

}
