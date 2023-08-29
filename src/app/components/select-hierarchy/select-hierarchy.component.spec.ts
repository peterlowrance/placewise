import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectHierarchyComponent } from './select-hierarchy.component';

describe('SelectHierarchyComponent', () => {
  let component: SelectHierarchyComponent;
  let fixture: ComponentFixture<SelectHierarchyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectHierarchyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectHierarchyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
