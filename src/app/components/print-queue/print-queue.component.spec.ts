import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintQueueComponent } from './print-queue.component';

describe('PrintQueueComponent', () => {
  let component: PrintQueueComponent;
  let fixture: ComponentFixture<PrintQueueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrintQueueComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrintQueueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
