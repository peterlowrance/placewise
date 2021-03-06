import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AncestorViewComponent } from './ancestor-view.component';

describe('AncestorViewComponent', () => {
  let component: AncestorViewComponent;
  let fixture: ComponentFixture<AncestorViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AncestorViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AncestorViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
