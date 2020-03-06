import {Component, OnInit} from '@angular/core';
import {HierarchyItem} from "../../models/HierarchyItem";
import {NestedTreeControl} from "@angular/cdk/tree";
import {SearchService} from "../../services/search.service";
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-modify-hierarchy',
  templateUrl: './modify-hierarchy.component.html',
  styleUrls: ['./modify-hierarchy.component.css']
})
export class ModifyHierarchyComponent implements OnInit {
  treeControl = new NestedTreeControl<HierarchyItem>(node => this.searchService.getDescendantsOfRoot(node.ID, false));
  dataSource = new MatTreeNestedDataSource<HierarchyItem>();

  constructor(private searchService: SearchService, private route: ActivatedRoute) {
  }

  ngOnInit() {
    const isCategory = this.route.snapshot.paramMap.get('selectedHierarchy') === 'categories';
    this.searchService.getDescendantsOfRoot('root', isCategory).subscribe(items => this.dataSource.data = items);
  }

  hasChild = (_: number, node: HierarchyItem) => !!node.children && node.children.length > 0;
}
