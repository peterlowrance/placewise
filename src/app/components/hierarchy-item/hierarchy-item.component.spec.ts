import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HierarchyItemComponent } from './hierarchy-item.component';

describe('HierarchyItemComponent', () => {
  let component: HierarchyItemComponent;
  let fixture: ComponentFixture<HierarchyItemComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HierarchyItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HierarchyItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
