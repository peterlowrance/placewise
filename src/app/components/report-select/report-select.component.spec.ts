import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportSelectComponent } from './report-select.component';

describe('ReportSelectComponent', () => {
  let component: ReportSelectComponent;
  let fixture: ComponentFixture<ReportSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportSelectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
