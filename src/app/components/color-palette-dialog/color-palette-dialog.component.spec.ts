import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColorPaletteDialogComponent } from './color-palette-dialog.component';

describe('ColorPaletteDialogComponent', () => {
  let component: ColorPaletteDialogComponent;
  let fixture: ComponentFixture<ColorPaletteDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ColorPaletteDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ColorPaletteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
