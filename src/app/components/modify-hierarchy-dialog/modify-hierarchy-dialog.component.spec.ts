import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModifyHierarchyDialogComponent } from './modify-hierarchy-dialog.component';

describe('ModifyHierarchyDialogComponent', () => {
  let component: ModifyHierarchyDialogComponent;
  let fixture: ComponentFixture<ModifyHierarchyDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ModifyHierarchyDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModifyHierarchyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
