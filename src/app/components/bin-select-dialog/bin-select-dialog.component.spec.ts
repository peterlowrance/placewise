import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BinSelectDialogComponent } from './bin-select-dialog.component';

describe('BinSelectDialogComponent', () => {
  let component: BinSelectDialogComponent;
  let fixture: ComponentFixture<BinSelectDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BinSelectDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BinSelectDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
