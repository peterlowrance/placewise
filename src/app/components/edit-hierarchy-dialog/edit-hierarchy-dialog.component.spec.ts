import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditHierarchyDialogComponent } from './edit-hierarchy-dialog.component';

describe('EditHierarchyDialogComponent', () => {
  let component: EditHierarchyDialogComponent;
  let fixture: ComponentFixture<EditHierarchyDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditHierarchyDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditHierarchyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
