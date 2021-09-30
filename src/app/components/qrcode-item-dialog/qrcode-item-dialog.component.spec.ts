import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QRCodeItemDialogComponent } from './qrcode-item-dialog.component';

describe('QRCodeItemDialogComponent', () => {
  let component: QRCodeItemDialogComponent;
  let fixture: ComponentFixture<QRCodeItemDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QRCodeItemDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QRCodeItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
