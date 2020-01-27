import { Component } from '@angular/core';
import { SearchInterfaceService } from './services/search-interface.service';
import { MockSearchService } from './services/mock-search.service';
import { AdminInterfaceService } from './services/admin-interface.service';
import { MockAdminService } from './services/mock-admin.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [{provide: SearchInterfaceService, useClass: MockSearchService},{provide: AdminInterfaceService, useClass: MockAdminService}]
})
export class AppComponent {
  title = 'placewise';
}
