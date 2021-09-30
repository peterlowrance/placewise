import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QRCodeCategoryDialogComponent } from './qrcode-category-dialog.component';

describe('QRCodeCategoryDialogComponent', () => {
  let component: QRCodeCategoryDialogComponent;
  let fixture: ComponentFixture<QRCodeCategoryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QRCodeCategoryDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QRCodeCategoryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
