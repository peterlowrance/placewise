import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HierarchyItemGridComponent } from './hierarchy-item-grid.component';

describe('HierarchyItemGridDisplayComponent', () => {
  let component: HierarchyItemGridComponent;
  let fixture: ComponentFixture<HierarchyItemGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HierarchyItemGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HierarchyItemGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
