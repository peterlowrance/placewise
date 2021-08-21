import { Component, Input, OnInit, SimpleChange } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {HierarchyItem} from 'src/app/models/HierarchyItem';
import { SearchService } from 'src/app/services/search.service';

interface TreeNode {
  name: string;
  imageUrl: string;
  children: TreeNode[];
  ID: string;
}

@Component({
  selector: 'app-ancestor-view',
  templateUrl: './ancestor-view.component.html',
  styleUrls: ['./ancestor-view.component.css']
})
export class AncestorViewComponent implements OnInit {
  @Input() parentsOf: HierarchyItem;
  @Input() displayText: string = "How to find...";
  @Input() parentsToDisplay: HierarchyItem[]; // This is if we already ahve the data loaded

  constructor(private searchService: SearchService, private route: ActivatedRoute) { }

  workspaceID: string;

  ngOnInit(){
    this.workspaceID = this.route.snapshot.paramMap.get("workspaceID");
  }

  onExpandPanel(){
    if(!this.parentsToDisplay){
      this.searchService.getAncestorsByChain(this.workspaceID, this.parentsOf.ID, this.parentsOf.type).then(data => {
        this.parentsToDisplay = data;
      })
    }
  }

}
