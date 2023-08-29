import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { HierarchyItem } from 'src/app/models/HierarchyItem';
import { AdminService } from 'src/app/services/admin.service';
import { SearchService } from 'src/app/services/search.service';

@Component({
  selector: 'app-select-hierarchy',
  templateUrl: './select-hierarchy.component.html',
  styleUrls: ['./select-hierarchy.component.css']
})
export class SelectHierarchyComponent implements OnInit {
  @Input() workspaceID: string;
  @Input() type: string;
  @Output() selectedHierarchy = new EventEmitter<HierarchyItem>();

  hierarchyItems: HierarchyItem[] = [];
  currentHierarchyName: string;
  currentHierarchyID: string = 'root';
  hierarchyItemBreadcrumb: HierarchyItem[] = [];

  recentHierarchyItems: HierarchyItem[] = [];

  hierarchySubscription: Subscription;

  constructor(
    private searchService: SearchService,
    private adminService: AdminService
    ) { }

  ngOnInit(): void {
    this.hierarchySubscription = this.searchService.getDescendantsOfRoot(this.workspaceID, 'root', this.type === 'category').subscribe(descendants => {
      this.hierarchyItems = descendants;
    });

    if(this.type === 'category'){
      this.recentHierarchyItems = this.adminService.getRecentCategories();
    }
    else {
      this.recentHierarchyItems = this.adminService.getRecentLocations();
    }
  }

  goToHierarchy(root?: HierarchyItem, goingBack?: boolean){
    this.hierarchyItems = [];
    this.hierarchySubscription.unsubscribe();

    if(root) {
      this.currentHierarchyName = root.name;
      this.currentHierarchyID = root.ID;
    }
    else {
      this.currentHierarchyID = 'root';
    }

    if(!goingBack){
      this.hierarchyItemBreadcrumb.push(root);
    }

    this.hierarchySubscription = this.searchService.getDescendantsOfRoot(this.workspaceID, root ? root.ID : 'root', this.type === 'category').subscribe(descendants => {
      this.hierarchyItems = descendants;
    });
  }

  goBack(){
    if(this.hierarchyItemBreadcrumb.length === 0){
      if(this.currentHierarchyID !== 'root'){
        this.goToHierarchy(null);
      }
    }
    else {
      this.hierarchyItemBreadcrumb.pop();
      console.log(this.hierarchyItemBreadcrumb);
      this.goToHierarchy(this.hierarchyItemBreadcrumb[this.hierarchyItemBreadcrumb.length - 1], true);
    }
  }

  exit(wasCanceled?: boolean){
    if(wasCanceled){
      this.selectedHierarchy.next(null);
    }
    else {
      this.selectedHierarchy.next(this.hierarchyItemBreadcrumb[this.hierarchyItemBreadcrumb.length - 1]);
    }
  }

}
