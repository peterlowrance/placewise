import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ModifyHierarchyDialogComponent } from '../modify-hierarchy-dialog/modify-hierarchy-dialog.component';
import { SimpleFieldDialogComponent } from '../simple-field-dialog/simple-field-dialog.component';

@Component({
  selector: 'app-attribute-options-editor-dialog',
  templateUrl: './attribute-options-editor-dialog.component.html',
  styleUrls: ['./attribute-options-editor-dialog.component.css']
})
export class AttributeOptionsEditorDialogComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {values: string[]},
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<SimpleFieldDialogComponent>,
    ) { }

  localValues: string[];

  ngOnInit() {
    this.localValues = JSON.parse(JSON.stringify(this.data.values));
  }

  openAddOptionModal(){
    const dialogRef = this.dialog.open(SimpleFieldDialogComponent, {
      width: '300px',
      data: {fieldName: 'Enter new option:'}
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result.wasValid && result.changed){
        // Keep it sorted
        let added = false;
        for(let index in this.localValues){
          if(this.localValues[index] > result.value){
            this.localValues.splice(Number.parseInt(index), 0, result.value);
            added = true;
            break;
          }
        }
        if(!added){
          this.localValues.push(result.value);
        }
      }
    })
  }

  delete(value){
    for(let index in this.localValues){
      if(this.localValues[index] === value){
        this.localValues.splice(Number.parseInt(index));
      }
    }
  }

  cancel(){
    this.dialogRef.close({valid: false});
  }

  confirm(){
    this.dialogRef.close({valid: true, values: this.localValues});
  }

}
