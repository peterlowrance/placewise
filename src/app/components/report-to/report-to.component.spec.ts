import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportToComponent } from './report-to.component';

describe('ReportToComponent', () => {
  let component: ReportToComponent;
  let fixture: ComponentFixture<ReportToComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReportToComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportToComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
