import { Component, Inject } from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators, AbstractControl} from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-change-pass-dialog',
  templateUrl: './change-pass-dialog.component.html',
  styleUrls: ['./change-pass-dialog.component.css']
})
export class ChangePassDialogComponent {
  oldPass = new FormControl('', [Validators.required]);
  newPass = new FormControl('', [Validators.required]);
  resetForm = this.formBuilder.group({oldPass: this.oldPass, newPass: this.newPass}, {validators: this.passwordsEqual});

  constructor(
    public dialogRef: MatDialogRef<ChangePassDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
    private formBuilder: FormBuilder
  ) 
  {}

  /**
   * Equivalence validator
   * Adapted from: https://stackoverflow.com/questions/44449673/custom-validator-on-reactive-form-for-password-and-confirm-password-matching-get
   */
  passwordsEqual(control: AbstractControl){
    if(control.value.oldPass !== control.value.newPass){
      return {invalid: true};
    }
  }

  /**Cancels the operation, does not send email */
  onCancel(){
    this.dialogRef.close(false);
  }

  /**Submits the email for sending */
  onSubmit(){
    this.dialogRef.close(true);
  }

  /**Tells errors in the email field */
  errorsPassEqual(){
    return this.oldPass.hasError('required') ? "Old password is required" :
        this.newPass.hasError('required') ? 
        "New password is required" :
        "Old and New passwords must match"
    }

}
