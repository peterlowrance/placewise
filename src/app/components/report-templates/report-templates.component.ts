import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ReportStructure, ReportStructureWrapper } from 'src/app/models/ReportStructure';
import { ReportService } from 'src/app/services/report.service';
import { AttributeBuilderDialogComponent } from '../attribute-builder-dialog/attribute-builder-dialog.component';
import { SimpleFieldDialogComponent } from '../simple-field-dialog/simple-field-dialog.component';

@Component({
  selector: 'app-report-templates',
  templateUrl: './report-templates.component.html',
  styleUrls: ['./report-templates.component.css']
})
export class ReportTemplatesComponent implements OnInit {

  constructor(
    private router: Router,
    public dialog: MatDialog,
    private reportService: ReportService
    ) { }


  reportTemplates: ReportStructureWrapper[];


  ngOnInit(): void {

    this.reportService.getReportTemplates().subscribe(result => {
      this.reportTemplates = [];

      for(let type in result){
        this.reportTemplates.push({type, reportStructure: result[type]});
      }
    });

  }

  editTemplate(type: string){
    this.router.navigate(['/reports/templates/' + type]);
  }

  addTemplate(){
    this.dialog.open(SimpleFieldDialogComponent, {
      width: '300px',
      data: {fieldName: 'Template ID:', description: 'Enter an ancronym or small word that describes the report. This will be used to distinguish these reports from the others, and hence you can only set this up once!'}
    }).beforeClosed().subscribe(result => {
      if(result && result.wasValid){
        // Make sure there's no reports that already have that ID
        if(this.reportTemplates.filter(template => template.type === result.value).length === 0){
          this.reportService.addTemplate(result.value).then(confirm => {
            if(confirm){
              this.router.navigate(['/reports/templates/' + result.value]);
            }
          });
        }
      }
    });
  }

}
