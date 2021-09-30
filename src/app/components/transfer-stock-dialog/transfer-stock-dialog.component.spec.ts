import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoveStockDialogComponent } from './transfer-stock-dialog.component';

describe('MoveStockDialogComponent', () => {
  let component: MoveStockDialogComponent;
  let fixture: ComponentFixture<MoveStockDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MoveStockDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MoveStockDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
