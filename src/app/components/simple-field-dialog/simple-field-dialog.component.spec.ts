import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SimpleFieldDialogComponent } from './simple-field-dialog.component';

describe('SimpleFieldDialogComponent', () => {
  let component: SimpleFieldDialogComponent;
  let fixture: ComponentFixture<SimpleFieldDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SimpleFieldDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SimpleFieldDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
