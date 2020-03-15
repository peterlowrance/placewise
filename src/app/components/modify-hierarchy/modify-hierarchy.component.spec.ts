import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifyHierarchyComponent } from './modify-hierarchy.component';

describe('ModifyHierarchyComponent', () => {
  let component: ModifyHierarchyComponent;
  let fixture: ComponentFixture<ModifyHierarchyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModifyHierarchyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModifyHierarchyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
