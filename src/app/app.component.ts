import { Component } from '@angular/core';
import { SearchInterfaceService } from './services/search-interface.service';
import { AdminInterfaceService } from './services/admin-interface.service';
import { SearchService } from './services/search.service';
import { AdminService } from './services/admin.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [{provide: SearchInterfaceService, useClass: SearchService},{provide: AdminInterfaceService, useClass: AdminService}]
})
export class AppComponent {
  title = 'placewise';
}
