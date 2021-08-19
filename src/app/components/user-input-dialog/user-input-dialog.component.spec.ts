import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserInputDialogComponent } from './user-input-dialog.component';

describe('UserInputDialogComponent', () => {
  let component: UserInputDialogComponent;
  let fixture: ComponentFixture<UserInputDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserInputDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserInputDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
