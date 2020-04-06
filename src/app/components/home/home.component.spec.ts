import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {HomeComponent} from './home.component';

import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {ActivatedRoute, convertToParamMap, Router} from '@angular/router';
//Imports for material design modules
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatInputModule} from '@angular/material/input';
//Mocks
import * as AuthTest from '../../services/auth.mock.service';
import {RouterTestingModule} from '@angular/router/testing';
import {NavService} from '../../services/nav.service';
import {SearchService} from '../../services/search.service';
import * as SearchTest from '../../services/search.mock.service';
import {ImageService} from '../../services/image.service';
import * as ImageTest from '../../services/image.mock.service';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BehaviorSubject} from 'rxjs';
import {SmdFabSpeedDialModule} from "angular-speed-dial";
import {AngularFirestore} from "@angular/fire/firestore";
import {HttpClientModule} from "@angular/common/http";

let navMock = {
  navigate: jest.fn((url: string[]) => {
  })
}

let snackMock = {
  open: jest.fn((message: string, button: string, options: { duration: number }) => {
  })
}

const mockRoute = new RouterTestingModule();

const FirestoreStub = {
  collection: (name: string) => ({
    doc: (_id: string) => ({
      valueChanges: () => new BehaviorSubject({foo: 'bar'}),
      set: (_d: any) => new Promise((resolve, _reject) => resolve()),
    }),
  }),
};

let snackImp;

let navImp;

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HomeComponent],
      providers: [{provide: NavService, useValue: new NavService()}, {
        provide: SearchService,
        useClass: SearchTest.SearchMockService
      },
        {provide: ImageService, useClass: ImageTest.ImageMockService}, {
          provide: ActivatedRoute,
          useValue: {snapshot: {paramMap: convertToParamMap({id: 'root'})}}
        },
        {provide: AngularFirestore, useValue: FirestoreStub}, {
          provide: AuthService,
          useClass: AuthTest.AuthMockService
        }, {provide: Router, useValue: navMock}],
      imports: [HttpClientModule, SmdFabSpeedDialModule, MatInputModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatButtonToggleModule, MatGridListModule, RouterTestingModule.withRoutes([]), BrowserAnimationsModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    navImp = TestBed.get(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Resizing', () => {

    it('Basic Method Test', () => {
      component.columns = 0;
      component.determineCols(16, 1000);
      expect(component.columns).toBeCloseTo(8.928, 2);
    });

    afterEach(() => {
      component.determineCols(); // Resets it back to default column size
      navImp.navigate.mockClear();
    });

  });

  describe('Display Things', () => {
    it('should show root\'s items', async () => {
      await component.displayItems({ID: 'root', name: 'root', children: [], items: ['999']});
      expect(component.items.pop().ID).toBe('999');
    });

    it('should show no items', async () => {
      await component.displayItems({ID: 'root', name: 'root', children: [], items: ['fakeID']});
      expect(component.items.length).toBe(0);
      await component.displayItems({ID: 'root', name: 'root', children: [], items: []});
      expect(component.items.length).toBe(0);
    });

    it('should display items and categories', async () => {
      await component.displayDescendants({ID: 'root', name: 'root', children: ['554', '553'], items: ['999']}, true);
      expect(component.items.pop().ID).toBe('999');
      expect(component.hierarchyItems.map(x => x.ID)).toContain('554');
      expect(component.hierarchyItems.map(x => x.ID)).toContain('553');
    });

    it('should display items and locations', async () => {
      await component.displayDescendants({ID: 'root', name: 'root', children: ['100', '200'], items: ['999']}, false);
      expect(component.items.pop().ID).toBe('999');
      expect(component.hierarchyItems.map(x => x.ID)).toContain('100');
      expect(component.hierarchyItems.map(x => x.ID)).toContain('200');
    });
  });
});
