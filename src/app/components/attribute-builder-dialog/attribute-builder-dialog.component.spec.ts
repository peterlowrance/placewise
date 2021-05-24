import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttributeBuilderDialogComponent } from './attribute-builder-dialog.component';

describe('AttributeBuilderDialogComponent', () => {
  let component: AttributeBuilderDialogComponent;
  let fixture: ComponentFixture<AttributeBuilderDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AttributeBuilderDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AttributeBuilderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
