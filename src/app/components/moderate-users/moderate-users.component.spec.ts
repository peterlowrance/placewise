import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModerateUsersComponent } from './moderate-users.component';

describe('ModerateUsersComponent', () => {
  let component: ModerateUsersComponent;
  let fixture: ComponentFixture<ModerateUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModerateUsersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModerateUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
