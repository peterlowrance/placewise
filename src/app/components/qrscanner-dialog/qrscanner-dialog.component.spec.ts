import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QRScannerDialogComponent } from './qrscanner-dialog.component';

describe('QRScannerDialogComponent', () => {
  let component: QRScannerDialogComponent;
  let fixture: ComponentFixture<QRScannerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QRScannerDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QRScannerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
