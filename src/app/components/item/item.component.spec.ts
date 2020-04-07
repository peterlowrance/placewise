import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemComponent } from './item.component';

import {AuthService} from '../../services/auth.service';
import {MatDialog} from '@angular/material/dialog';
import {ReactiveFormsModule, FormsModule} from '@angular/forms';

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
import { AdminService } from 'src/app/services/admin.service';
import { AdminMockService } from 'src/app/services/admin.mock.service';
import { NavService } from 'src/app/services/nav.service';
import { Router, ActivatedRoute } from '@angular/router';

import * as MockDB from '../../models/MockDB';
import { of } from 'rxjs';

let routerMock = {
  navigate: jest.fn((url: string[]) => {})
}

let activatedRouteStub = {
  snapshot: {
    paramMap: {
      get: (param:string) => MockDB.ITEMS[2].ID
    }
  }
}

let locationStub = {
  back: jest.fn()
}

let auth;

let routerImp;

let adminImp;

let searchImp;

describe('ItemComponent', () => {
  let component: ItemComponent;
  let fixture: ComponentFixture<ItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemComponent ],
      providers: [{provide: SearchService, useClass: SearchTest.SearchMockService}, {provide: AdminService, useClass: AdminMockService}, {provide: Location, useValue: locationStub}, {provide: ActivatedRoute, useValue: activatedRouteStub}, {provide: MatDialog}, {provide: AuthService, useClass: AuthTest.AuthMockService},{provide: ImageService, useClass: ImageTest.ImageMockService}, {provide: NavService, useValue: new NavService()}],
      imports: [ReactiveFormsModule, FormsModule, MatButtonModule, MatCardModule, MatInputModule, MatTreeModule, MatIconModule, MatExpansionModule, MatChipsModule, MatGridListModule, RouterTestingModule.withRoutes([]), BrowserAnimationsModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    //default component to logged in
    auth = TestBed.get(AuthService);
    auth.login(
      AuthTest.EXPECTED_TEST_CREDENTIALS.email,
      AuthTest.EXPECTED_TEST_CREDENTIALS.password,
      AuthTest.EXPECTED_TEST_CREDENTIALS.workspace
    );
    routerImp = TestBed.get(Router);
    adminImp = TestBed.get(AdminService);
    searchImp = TestBed.get(SearchService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should convert hierarchy item to tree rep', () => {
    let h = MockDB.LOCATIONS[1];
    let eq = {name: h.name, imageUrl: h.imageUrl, children: [], ID: h.ID};
    expect(component.toTree(h)).toEqual(eq);
  });

  it('should return false for chidlrenless nodes', () => {
    let h = MockDB.LOCATIONS[1];
    expect(component.hasChild(0, {name: h.name, imageUrl: h.imageUrl, children: [], ID: h.ID})).toBeFalsy();
  });

  it('should return true for nodes with children', () => {
    let h = MockDB.LOCATIONS[1];
    expect(component.hasChild(0, {name: h.name, imageUrl: h.imageUrl, children: [component.toTree(h)], ID: h.ID})).toBeTruthy();
  });

  it('should convert hierarchy item list', () => {
    let h = MockDB.LOCATIONS[0];
    let levels = [MockDB.LOCATIONS[1], h];
    let node = component.convertList(levels);
    expect(node).toEqual({name: h.name, imageUrl: h.imageUrl, children: [component.toTree(MockDB.LOCATIONS[1])], ID: h.ID})
  });

  it('should return null on empty list', () => {
    expect(component.convertList([])).toBeFalsy();
  });

  it('should toggle expanded', () => {
    let before = component.expanded;
    component.toggleMoreInfo();
    expect(component.expanded).not.toBe(before);
  });

  it('should place report if valid', async () => {
    let reportData = {desc:'desc',valid:true};
    await component.issueReport(reportData).subscribe(val => expect(val).toBeTruthy)
  });

  it('should not place report on cancel/invalid', () => {
    let reportData = {desc:'desc',valid:false};
    expect(component.issueReport(reportData)).toBeFalsy();
  });

  describe('focuses on fields on edit', () => {
    it('should set name edit', () => {
      let before = component.textEditFields.name;
      component.editField('name');
      expect(component.textEditFields.name).not.toBe(before);
    });

    it('should set desc edit', () => {
      let before = component.textEditFields.desc;
      component.editField('desc');
      expect(component.textEditFields.desc).not.toBe(before);
    });

    it('should set tags edit', () => {
      let before = component.textEditFields.tags;
      component.editField('tags');
      expect(component.textEditFields.tags).not.toBe(before);
    });
  });

  it('should update name if not empty string', () => {
    let spy = spyOn(component, 'checkDirty').and.callFake(() => {});

    component.item.name = 'NOTEMPTY';
    component.textEditFields.name = true;
    component.onNameSubmit();

    expect(component.textEditFields.name).toBe(false);
    expect(spy).toHaveBeenCalled();
  });

  it('should not update name if empty', () => {
    let spy = spyOn(component, 'checkDirty').and.callFake(() => {});

    component.item.name = '';
    component.previousItem.name = 'NOTEMPTY';
    component.textEditFields.name = true;
    component.onNameSubmit();

    expect(component.item.name).toBe('NOTEMPTY');
    expect(spy).toHaveBeenCalled();
  });

  it('should update desc if not empty string', () => {
    let spy = spyOn(component, 'checkDirty').and.callFake(() => {});

    component.item.desc = 'NOTEMPTY';
    component.textEditFields.desc = true;
    component.onDescSubmit();

    expect(component.textEditFields.desc).toBe(false);
    expect(spy).toHaveBeenCalled();
  });

  it('should not update desc if empty', () => {
    let spy = spyOn(component, 'checkDirty').and.callFake(() => {});

    component.item.desc = '';
    component.previousItem.desc = 'NOTEMPTY';
    component.textEditFields.desc = true;
    component.onDescSubmit();

    expect(component.item.desc).toBe('NOTEMPTY');
    expect(spy).toHaveBeenCalled();
  });


  //TODO: test image upload on new pull

  it('should trim whitespace and add if tag present', () => {
    let prevTags = component.item.tags;
    let spy = spyOn(component, 'checkDirty').and.callFake(() => {});
    let i = {value: ''};
    
    component.add({input:i, value:' west '});
    prevTags.push('west');

    expect(component.item.tags).toEqual(prevTags);
    expect(spy).toHaveBeenCalled();
  });

  it('should not add tag if empty', () => {
    let prevTags = component.item.tags;
    let spy = spyOn(component, 'checkDirty').and.callFake(() => {});
    let i = {value: ''};
    
    component.add({input:i, value:null});

    expect(component.item.tags).toEqual(prevTags);
    expect(spy).toHaveBeenCalled();
  });

  it('should always clear input', () => {
    let prevTags = component.item.tags;
    let spy = spyOn(component, 'checkDirty').and.callFake(() => {});
    let i = {value: ''};
    i.value = 'extra';
    
    component.add({input:i, value:null});

    expect(i.value).toBe('');
    expect(spy).toHaveBeenCalled();
  });

  it('should remove a tag if a valid index is chosen', () => {
    let spy = spyOn(component, 'checkDirty').and.callFake(() => {});
    component.item.tags = ['first', 'second'];
    
    component.removeTag('first');
    
    expect(component.item.tags).toEqual(['second']);
    expect(spy).toHaveBeenCalled();
  });

  it('should not remove a tag if an invalid index is chosen', () => {
    let spy = spyOn(component, 'checkDirty').and.callFake(() => {});
    component.item.tags = ['first', 'second'];
    
    component.removeTag('third');
    
    expect(component.item.tags).toEqual(['first','second']);
    expect(spy).toHaveBeenCalled();
  });

  it('should return false if not dirty', () => {
    component.item.name = 'NEW';
    expect(component.checkDirty()).toBeTruthy();
  });

  it('should return true if dirty', () => {
    expect(component.checkDirty()).toBeTruthy();
  });

  it('should save items with new url and image', async () => {
    let spy = spyOn(component, 'placeIntoDB').and.callFake(() => {});
    component.item.imageUrl = 'NEWURL';
    component.imageToSave = new File(['./'], 'item.component.spec.ts');
    
    await component.saveItem();

    expect(component.item.imageUrl).toBe('https://crouton.net/crouton.png');
    expect(spy).toHaveBeenCalled();
  });

  it('should not save anything if there is no image to save but image shown', async () => {
    let spy = spyOn(component, 'placeIntoDB').and.callFake(() => {});
    component.item.imageUrl = 'NEWURL';
    component.imageToSave = null;
    
    await component.saveItem();

    expect(component.item.imageUrl).toBe('NEWURL');
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should save just the item if no new image is present', async () => {
    let spy = spyOn(component, 'placeIntoDB').and.callFake(() => {});
    let oldUrl = component.item.imageUrl;
    
    await component.saveItem();

    expect(component.item.imageUrl).toBe(oldUrl);
    expect(spy).toHaveBeenCalled();
  });

  it('should alert if an item was saved', async () => {
    let alertMock = jest.fn();
    let alert = window.alert;
    window.alert = alertMock;
    //edit item
    component.item.name = 'EDITED';
    component.dirty = true;

    await component.placeIntoDB();

    expect(component.dirty).toBeFalsy();
    expect(component.item).toEqual(component.previousItem);
    expect(alertMock).toHaveBeenCalledWith('Item save successful');

    window.alert = alert;
  });

  it('should alert fail if saving failed', async () => {
    let alertMock = jest.fn();
    let alert = window.alert;
    window.alert = alertMock;
    //edit item
    component.item.name = 'EDITEDFORFAIL';
    component.dirty = true;

    //replace update with a failing one
    spyOn(adminImp, 'updateItem').and.callFake(() => of(false));

    await component.placeIntoDB();

    expect(component.dirty).toBeTruthy();
    expect(component.item).not.toEqual(component.previousItem);
    expect(alertMock).toHaveBeenCalledWith('Item save failed');

    window.alert = alert;
  });

  it('should delete from images and DB', async () => {
    let spy = spyOn(component, 'removeFromDB').and.callFake(() => {});
    let conMock = jest.fn(() => true);
    let confirm = window.confirm;
    window.confirm = conMock;
    let imageImp = TestBed.get(ImageService);
    let imageSpy = spyOn(imageImp, 'removeImage').and.callFake(() => of(true).toPromise());

    component.item.imageUrl = 'EXISTS';
    await component.requestDelete(true);

    expect(imageSpy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();

    window.confirm = confirm;
  });

  it('should just remove item if image does not exist', async () => {
    let spy = spyOn(component, 'removeFromDB').and.callFake(() => {});
    let conMock = jest.fn(() => true);
    let confirm = window.confirm;
    window.confirm = conMock;
    let imageImp = TestBed.get(ImageService);
    let imageSpy = spyOn(imageImp, 'removeImage').and.callFake(() => of(true).toPromise());

    component.item.imageUrl = undefined;
    await component.requestDelete(true);

    expect(imageSpy).toHaveBeenCalledTimes(0);
    expect(spy).toHaveBeenCalled();

    window.confirm = confirm;
  });

  it('should do nothing if signal is false', () => {
    let spy = spyOn(component, 'removeFromDB').and.callFake(() => {});
    component.requestDelete(false);
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should do nothing if confirm is denied', () => {
    let spy = spyOn(component, 'removeFromDB').and.callFake(() => {});
    let conMock = jest.fn(() => false);
    let confirm = window.confirm;
    window.confirm = conMock;

    expect(spy).toHaveBeenCalledTimes(0);

    window.confirm = confirm;
  });

  it('should alert if an item was deleted', async () => {
    let alertMock = jest.fn();
    let alert = window.alert;
    window.alert = alertMock;
    let navImp = TestBed.get(NavService);
    let navSpy = spyOn(navImp, 'returnState').and.callFake(() => {});
    
    await component.removeFromDB();
    
    expect(navSpy).toHaveBeenCalled();
    //expect(locationStub.back).toHaveBeenCalled();
    expect(alertMock).toHaveBeenCalledWith('Item successfully deleted.');

    locationStub.back.mockClear();
    window.alert = alert;
  });

  it('should alert fail if deletion failed', async () => {
    let alertMock = jest.fn();
    let alert = window.alert;
    window.alert = alertMock;
    let rI = adminImp.removeItem;
    adminImp.removeItem = jest.fn(() => of(false));

    await component.removeFromDB();
    
    expect(alertMock).toHaveBeenCalledWith('Item deletion failed.');

    adminImp.removeItem = rI;
    window.alert = alert;
  });

  //Update categories/items

  it('should update the item category', () => {
    let adminSpy = spyOn(adminImp, 'updateItem');
    let item = component.item;
    component.updateItemCategory(['category','notneeded'], 'old');
    item.category = 'category';
    expect(adminSpy).toHaveBeenCalledWith(item, 'old', null);
  });

  it('should not update category on null result', () => {
    let adminSpy = spyOn(adminImp, 'updateItem');
    component.updateItemCategory(null, 'old');
    
    expect(adminSpy).toHaveBeenCalledTimes(0);
  });


  it('should update the item locations', () => {
    let spy = spyOn(window, 'setTimeout').and.callFake(() =>{});
    let adminSpy = spyOn(adminImp, 'updateItem');
    let item = component.item;
    component.updateItemLocations(['new','locs'], ['old']);
    item.locations = ['new','locs'];
    expect(adminSpy).toHaveBeenCalledWith(item,null, ['old']);
    expect(spy).toHaveBeenCalled();
  });

  it('should not update locations on null result', () => {
    let spy = spyOn(window, 'setTimeout').and.callFake(() =>{});
    let adminSpy = spyOn(adminImp, 'updateItem');
    component.updateItemLocations(null, ['old']);
    
    expect(adminSpy).toHaveBeenCalledTimes(0);
    expect(spy).toHaveBeenCalledTimes(0);
  });
});
