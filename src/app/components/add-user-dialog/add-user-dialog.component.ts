import { Component, Inject } from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-add-user-dialog',
  templateUrl: './add-user-dialog.component.html',
  styleUrls: ['./add-user-dialog.component.css']
})
export class AddUserDialogComponent {
  firstName = new FormControl('', [Validators.required]);
  lastName = new FormControl('', [Validators.required]);
  email = new FormControl('', [Validators.required, Validators.email]);
  addForm = this.formBuilder.group({firstName: this.firstName, lastName: this.lastName, email:this.email});

  constructor(
    public dialogRef: MatDialogRef<AddUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {firstName: string, lastName: string, email: string},
    private formBuilder: FormBuilder
  ) { }

  ngOnInit() {
  }

  /**Cancels the operation, does not send email */
  onCancel(){
    this.dialogRef.close(null);
  }

  /**Submits the email for sending */
  onSubmit(){
    this.data = {firstName: this.addForm.value.firstName,
                  lastName: this.addForm.value.lastName,
                  email: this.addForm.value.email};
    this.dialogRef.close(this.data);
  }

}
