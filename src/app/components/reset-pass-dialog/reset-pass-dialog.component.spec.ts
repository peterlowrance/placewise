import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import {MatInputModule} from '@angular/material/input'
import {MatButtonModule} from '@angular/material/button'
import {MatDialogModule, MatDialog} from '@angular/material/dialog'
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ResetPassDialogComponent } from './reset-pass-dialog.component';
import { NgModule, Component } from '@angular/core';

import {AppModule} from '../../app.module';
import { OverlayContainer } from '@angular/cdk/overlay';

/**Dummy launcher module for the dialog */
// Noop component is only a workaround to trigger change detection
@Component({
  template: ''
})
class NoopComponent {}

const TEST_DIRECTIVES = [
  ResetPassDialogComponent,
  NoopComponent
];

@NgModule({
  imports: [MatDialogModule, MatInputModule, MatButtonModule, FormsModule, ReactiveFormsModule],
  exports: TEST_DIRECTIVES,
  declarations: TEST_DIRECTIVES,
  entryComponents: [
    ResetPassDialogComponent
  ],
})
class DialogTestModule { }


describe('ResetPassDialogComponent', () => {
  let component: ResetPassDialogComponent;
  let fixture: ComponentFixture<ResetPassDialogComponent>;

  let dialog: MatDialog;
  let overlayContainerElement: HTMLElement;
  let noop: ComponentFixture<NoopComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ResetPassDialogComponent, MatDialog ],
      imports: [DialogTestModule],
      providers: [ 
        { provide: OverlayContainer, useFactory: () => {
        overlayContainerElement = document.createElement('div');
        return { getContainerElement: () => overlayContainerElement };
      }}]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    dialog = TestBed.get(MatDialog);
    noop = TestBed.createComponent(NoopComponent);
  });

  it('should create', () => {
    const email:string = '';
    dialog.open(ResetPassDialogComponent, {width: '60%'})

    noop.detectChanges(); // Updates the dialog in the overlay

    const h2 = overlayContainerElement.querySelector('#mat-dialog-title-0');
  const button = overlayContainerElement.querySelector('button');

  expect(h2.textContent).toBe('User cannot be saved without an email');
  expect(button.textContent).toBe('Close');
  });
});
