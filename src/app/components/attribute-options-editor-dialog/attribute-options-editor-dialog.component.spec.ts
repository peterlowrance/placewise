import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttributeOptionsEditorDialogComponent } from './attribute-options-editor-dialog.component';

describe('AttributeOptionsEditorComponent', () => {
  let component: AttributeOptionsEditorDialogComponent;
  let fixture: ComponentFixture<AttributeOptionsEditorDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AttributeOptionsEditorDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttributeOptionsEditorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
