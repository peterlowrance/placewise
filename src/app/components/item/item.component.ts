import { Component, OnInit } from '@angular/core';
import { SearchService } from 'src/app/services/search.service';
import { Item } from 'src/app/models/Item';
import { Router, ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.css']
})
export class ItemComponent implements OnInit {
  id: string; //item id
  item: Item; //item returned by id
  loading: boolean = true;  //whether the page is actively loading

  expanded: boolean = false;  //is the more info panel expanded


  constructor(private searchService: SearchService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    //retrieve id
    this.id = this.route.params['id'];

    //get the item from the id
    this.searchService.getItem(this.id).subscribe(item => this.item = item);
    
  }

  toggleMoreInfo(){
    this.expanded = !this.expanded;
  }

}
