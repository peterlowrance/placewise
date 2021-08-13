import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReportStructure, ReportStructureWrapper } from 'src/app/models/ReportStructure';
import { ReportService } from 'src/app/services/report.service';

@Component({
  selector: 'app-report-templates',
  templateUrl: './report-templates.component.html',
  styleUrls: ['./report-templates.component.css']
})
export class ReportTemplatesComponent implements OnInit {

  constructor(
    private router: Router,
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

}
