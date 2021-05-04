import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAttributeSuffixDialogComponent } from './add-attribute-suffix-dialog.component';

describe('AddAttributeSuffixDialogComponent', () => {
  let component: AddAttributeSuffixDialogComponent;
  let fixture: ComponentFixture<AddAttributeSuffixDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddAttributeSuffixDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAttributeSuffixDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
