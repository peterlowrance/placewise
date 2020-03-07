import { Component, OnInit } from '@angular/core';
import { SearchService } from 'src/app/services/search.service';
import { AdminService } from 'src/app/services/admin.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ImageService } from 'src/app/services/image.service';
import { SentReport } from 'src/app/models/SentReport';

@Component({
  selector: 'app-admin-report',
  templateUrl: './admin-report.component.html',
  styleUrls: ['./admin-report.component.css']
})
export class AdminReportComponent implements OnInit {
  reports: SentReport[];
  constructor(
    private searchService: SearchService,
    private adminService: AdminService,
    private router: Router,
    private route: ActivatedRoute,
    private imageService: ImageService) { }

  ngOnInit() {
    this.adminService.getReports().subscribe(x => this.reports = x);
  }

}
