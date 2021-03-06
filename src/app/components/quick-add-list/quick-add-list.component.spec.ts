import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { QuickAddListComponent } from './quick-add-list.component';

describe('QuickAddListComponent', () => {
  let component: QuickAddListComponent;
  let fixture: ComponentFixture<QuickAddListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ QuickAddListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuickAddListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
