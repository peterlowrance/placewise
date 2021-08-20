import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportTemplatesComponent } from './report-templates.component';

describe('ReportTemplatesComponent', () => {
  let component: ReportTemplatesComponent;
  let fixture: ComponentFixture<ReportTemplatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportTemplatesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
