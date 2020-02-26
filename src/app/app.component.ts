import { Component } from '@angular/core';
import { SearchInterfaceService } from './services/search-interface.service';
import { SearchService } from './services/search.service';
import { AdminService } from './services/admin.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [{provide: SearchInterfaceService, useClass: SearchService}]})
export class AppComponent {
  title = 'placewise';
}
