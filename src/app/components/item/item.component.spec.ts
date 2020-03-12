import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemComponent } from './item.component';

import {AuthService} from '../../services/auth.service';
import {MatDialog} from '@angular/material/dialog';
import {ReactiveFormsModule} from '@angular/forms';

//Imports for material design modules
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatTreeModule} from '@angular/material/tree';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatChipsModule} from '@angular/material/chips';
import {MatGridListModule} from '@angular/material/grid-list';

//Mocks
import * as AuthTest from '../../services/auth.mock.service';
import {RouterTestingModule} from '@angular/router/testing';
import * as ImageTest from '../../services/image.mock.service';
import * as SearchTest from '../../services/search.mock.service';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ImageService } from 'src/app/services/image.service';
import { SearchService } from 'src/app/services/search.service';

let navMock = {
  navigate: jest.fn((url: string[]) => {})
}

let snackMock = {
  open: jest.fn((message: string, button: string, options: {duration: number}) => {})
}

const mockRoute = new RouterTestingModule();

let snackImp;

let navImp;

describe('ItemComponent', () => {
  let component: ItemComponent;
  let fixture: ComponentFixture<ItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemComponent ],
      providers: [{provide: SearchService, useClass: SearchTest.SearchMockService}, {provide: MatDialog}, {provide: ImageService, useClass: ImageTest.ImageMockService}],
      imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatInputModule, MatTreeModule, MatIconModule, MatExpansionModule, MatChipsModule, MatGridListModule, RouterTestingModule.withRoutes([]), BrowserAnimationsModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
