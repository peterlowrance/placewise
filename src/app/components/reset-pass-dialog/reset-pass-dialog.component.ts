import { Component, Inject } from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-reset-pass-dialog',
  templateUrl: './reset-pass-dialog.component.html',
  styleUrls: ['./reset-pass-dialog.component.css']
})
export class ResetPassDialogComponent {
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  resetForm = this.formBuilder.group({email: this.emailControl});

  constructor(
    public dialogRef: MatDialogRef<ResetPassDialogComponent>,
    private formBuilder: FormBuilder) {}

  /**Cancels the operation, does not send email */
  onCancel(){
    this.dialogRef.close(null);
  }

  /**Submits the email for sending */
  onSubmit(){
    this.dialogRef.close(this.resetForm.value.email);
  }

  /**Tells errors in the email field */
  errors(){
    return this.emailControl.hasError('required') ? "Email is required" :
        this.emailControl.hasError('email') ? 
        "Email entered is not valid" :
        "Company ID is incorrect";
  }

}
