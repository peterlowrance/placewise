import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportFormatPieceDialogComponent } from './report-format-piece-dialog.component';

describe('ReportFormatPieceDialogComponent', () => {
  let component: ReportFormatPieceDialogComponent;
  let fixture: ComponentFixture<ReportFormatPieceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportFormatPieceDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportFormatPieceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
