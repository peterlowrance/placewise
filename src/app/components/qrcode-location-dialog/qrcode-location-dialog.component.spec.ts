import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QRCodeLocationDialogComponent } from './qrcode-location-dialog.component';

describe('QRCodeLocationDialogComponent', () => {
  let component: QRCodeLocationDialogComponent;
  let fixture: ComponentFixture<QRCodeLocationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QRCodeLocationDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QRCodeLocationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
