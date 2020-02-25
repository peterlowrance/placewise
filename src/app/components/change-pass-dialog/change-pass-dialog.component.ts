import { Component, Inject } from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn, FormGroupDirective, NgForm} from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { ErrorStateMatcher } from '@angular/material';

/**
 * Custom validators adapted from
 * https://itnext.io/materror-cross-field-validators-in-angular-material-7-97053b2ed0cf 
*/
class CrossFieldErrorMatcher implements ErrorStateMatcher{
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return control.dirty && form.invalid;
  }
}

@Component({
  selector: 'app-change-pass-dialog',
  templateUrl: './change-pass-dialog.component.html',
  styleUrls: ['./change-pass-dialog.component.css']
})
export class ChangePassDialogComponent {
  oldPass = new FormControl('', [Validators.required]);
  newPass = new FormControl('', [Validators.required]);
  newPassConfirm = new FormControl('', [Validators.required]);
  changeForm = this.formBuilder.group({oldPass: this.oldPass, newPass: this.newPass, newPassConfirm: this.newPassConfirm}, {validator: this.passwordsEqualValidator});
  crossMatch = new CrossFieldErrorMatcher();

  constructor(
    public dialogRef: MatDialogRef<ChangePassDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {oldPass: string, newPass: string, newPassConfirm: string},
    private formBuilder: FormBuilder
  ) 
  {}

  /**
   * Equivalence validator
   * Adapted from: https://stackoverflow.com/questions/44449673/custom-validator-on-reactive-form-for-password-and-confirm-password-matching-get
   */
  passwordsEqualValidator(control: FormGroup){
    return control.value.newPass !== control.value.newPassConfirm ? {notEqual: true} : null;
  }

  /**Cancels the operation, does not send email */
  onCancel(){
    this.dialogRef.close(null);
  }

  /**Submits the email for sending */
  onSubmit(){
    this.data = {oldPass: this.changeForm.value.oldPass,
                  newPass: this.changeForm.value.newPass,
                  newPassConfirm: this.changeForm.value.newPassConfirm};
    this.dialogRef.close(this.data);
  }

}
