import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemBuilderModalComponent } from './item-builder-modal.component';

describe('ItemBuilderModalComponent', () => {
  let component: ItemBuilderModalComponent;
  let fixture: ComponentFixture<ItemBuilderModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemBuilderModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemBuilderModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
