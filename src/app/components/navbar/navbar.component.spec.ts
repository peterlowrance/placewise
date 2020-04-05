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

let routerMock = {
  navigate: jest.fn((url: string[]) => {}),
  events: of(new NavigationEnd(1, '1', ''))
}

let locMock = {
  back: jest.fn()
}

let navImp: NavService;

let routerImp;

let locImp;

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NavbarComponent ],
      providers: [ {provide: Location, useValue: locMock}, {provide: NavService, useValue: new NavService()}, {provide: AuthService, useClass: AuthTest.AuthMockService}],
      imports: [MatButtonModule, MatIconModule, MatToolbarModule, RouterTestingModule.withRoutes([]), BrowserAnimationsModule]
      //[{path:'/item/', component: NotFoundComponent}, {path:'/login', component: NotFoundComponent}, {path:'/settings', component: NotFoundComponent}]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    locImp = TestBed.get(Location);
    navImp = TestBed.get(NavService);
    routerImp = TestBed.get(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return location for all existing prompts', () => {
    component.locationString = 'there/is/item/inHere';
    expect(component.checkLocation()).toBe('item');
    component.locationString = '/login';
    expect(component.checkLocation()).toBe('login');
    component.locationString = '/settings';
    expect(component.checkLocation()).toBe('settings');
    component.locationString = '/modify/categories';
    expect(component.checkLocation()).toBe('modifyCategories');
    component.locationString = '/modify/locations';
    expect(component.checkLocation()).toBe('modifyLocations');
    component.locationString = '/users';
    expect(component.checkLocation()).toBe('moderateUsers');
    component.locationString = '/reports';
    expect(component.checkLocation()).toBe('reports');
    component.locationString = '/anythingElse';
    expect(component.checkLocation()).toBe('/');
  });

  it('to go back', () =>{
    component.goBack();
    expect(locImp.back).toHaveBeenCalled();
  });

  it('to return in hierarchy', async () => {
    navImp.getReturnState().toPromise().then((val) => {
      return expect(val).toBeTruthy();
    },
    () => fail());
    component.returnInHierarchy();
    expect(locImp.back).toHaveBeenCalled();
  });

  // it('should go home from search', async () => {
  //   let forget = jest.fn();
  //   let nav = jest.fn((name:string) => {return of(null).toPromise()});
  //   let originalForget = navImp.forgetParent;
  //   let originalNav = routerImp.navigate;
  //   navImp.forgetParent = forget;
  //   routerImp.navigate = nav;

  //   component.searchType = 'TYPE';
  //   spyOnProperty(routerImp, 'url', 'get').and.returnValue('...search...')
  //   await component.goHome();
  //   expect(forget).toHaveBeenCalled();
  //   expect(nav).toHaveBeenCalledTimes(2);

  //   routerImp.navigate = originalNav;
  //   navImp.forgetParent = originalForget;
  // });

  it('should delete ping', async () => {
    let sendM = jest.fn();
    let sendNM = jest.fn();
    let originalM = navImp.setDelete;
    let originalNM = navImp.resetDelete;
    navImp.setDelete = sendM;
    navImp.resetDelete = sendNM;
    component.delete();
    expect(sendM).toHaveBeenCalled();
    expect(sendNM).toHaveBeenCalled();
    navImp.setDelete = originalM;
    navImp.resetDelete = originalNM;
  });
});
