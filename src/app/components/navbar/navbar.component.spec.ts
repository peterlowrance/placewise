import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarComponent } from './navbar.component';

import {AuthService} from '../../services/auth.service';
import {Router, NavigationEnd} from '@angular/router';
import {NavService} from '../../services/nav.service';
import {Location} from '@angular/common';

import {NotFoundComponent} from '../not-found/not-found.component';

//Imports for material design modules
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon'
import {MatToolbarModule} from '@angular/material/toolbar';

//Mocks
import * as AuthTest from '../../services/auth.mock.service';
import {RouterTestingModule} from '@angular/router/testing';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

let navMock = {
  navigate: jest.fn((url: string[]) => {}),
  events: of(new NavigationEnd(1, '1', ''))
}

let routeMock = {
  back: jest.fn()
}


let navImp;

let routeImp;

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NavbarComponent ],
      providers: [{provide: NavService, useValue: new NavService()}, {provide: AuthService, useClass: AuthTest.AuthMockService}],
      imports: [MatButtonModule, MatIconModule, MatToolbarModule, RouterTestingModule.withRoutes([]), BrowserAnimationsModule]
      //[{path:'/item/', component: NotFoundComponent}, {path:'/login', component: NotFoundComponent}, {path:'/settings', component: NotFoundComponent}]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
