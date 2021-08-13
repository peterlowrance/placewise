import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportTemplateUserInputDialogComponent } from './report-template-user-input-dialog.component';

describe('ReportTemplateUserInputDialogComponent', () => {
  let component: ReportTemplateUserInputDialogComponent;
  let fixture: ComponentFixture<ReportTemplateUserInputDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportTemplateUserInputDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportTemplateUserInputDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
