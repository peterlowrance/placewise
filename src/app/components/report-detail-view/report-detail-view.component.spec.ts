import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportDetailViewComponent } from './report-detail-view.component';

describe('ReportDetailViewComponent', () => {
  let component: ReportDetailViewComponent;
  let fixture: ComponentFixture<ReportDetailViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReportDetailViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportDetailViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
