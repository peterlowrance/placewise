import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as Fuse from 'fuse.js';
import { Category } from 'src/app/models/Category';
import { HierarchyItem } from 'src/app/models/HierarchyItem';
import { Item } from 'src/app/models/Item';
import { HierarchyLocation } from 'src/app/models/Location';
import { SearchService } from 'src/app/services/search.service';

@Component({
  selector: 'app-text-search',
  templateUrl: './text-search.component.html',
  styleUrls: ['./text-search.component.css']
})
export class TextSearchComponent implements OnInit {
  control = new FormControl();
  notEnoughChars: Boolean = true;
  isLoading: Boolean = false;
  searchType: string = 'items';

  workspaceID: string;
  items: Item[];
  categories: Category[];
  locations: HierarchyLocation[];

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
    private router: Router,
    private route: ActivatedRoute,
    private searchService: SearchService
    ) { }

  ngOnInit(): void {
    this.workspaceID = this.route.snapshot.paramMap.get('workspaceID');
  }

  clearSearchBar(){
    this.control.setValue('');
  }

  goTo(event: HierarchyItem){
    if(event.type === 'item'){
      this.router.navigate(['/w/' + this.workspaceID + '/item/', event.ID]);
    }
    else if (event.type === 'location'){
      this.router.navigate(['/w/' + this.workspaceID + '/search/locations/', event.ID]);
    }
    else if(event.type === 'category'){
      this.router.navigate(['/w/' + this.workspaceID + '/search/categories/', event.ID]);
    }
  }

  // Note: this is only fired when it actually changes
  toggleSearchType(event){
    this.items = null;
    this.categories = null;
    this.locations = null;

    this.searchType = event.value;
    this.searchTextChange(this.control.value);
  }

  searchTextChange(event) {
    if (!event || event.length < 3) {
      // Reset the view to the normal things in the current root
      this.items = null;
      this.categories = null;
      this.locations = null;
      this.notEnoughChars = true;
      this.isLoading = false;
      return;
    } else { // Otherwise, get all descendant hierarchy items and items and fuzzy match them
      this.isLoading = true;
      this.notEnoughChars = false;

      if(this.searchType === 'categories'){
        this.searchService.getAllCategories(this.workspaceID).subscribe(categories => {
          const categorySearcher = new Fuse(categories, this.hierarchySearchOptions);
          this.categories = categorySearcher.search(event);
          this.isLoading = false;
        })
      }
      else if(this.searchType === 'locations'){
        this.searchService.getAllLocations(this.workspaceID).subscribe(locations => {
          const locationSearcher = new Fuse(locations, this.hierarchySearchOptions);
          this.locations = locationSearcher.search(event);
          this.isLoading = false;
        })
      }
      else {
        this.searchService.getAllItems(this.workspaceID).subscribe(items => {
          const itemSearcher = new Fuse(items, this.itemSearchOptions);
          this.items = itemSearcher.search(event);
          this.isLoading = false;
        })
      }
      /*
      this.isLoading = true;
      this.notEnoughChars = false;
      this.searchService.getAllDescendantHierarchyItems("root", true).subscribe(hierarchyItems => {
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
      */
    }
  }

}
