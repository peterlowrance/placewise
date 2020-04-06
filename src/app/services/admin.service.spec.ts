import { TestBed } from '@angular/core/testing';
import {SentReport} from '../models/SentReport';
import { AdminService } from './admin.service';

import * as MOCKDB from '../models/MockDB'

describe('AdminService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AdminService = TestBed.get(AdminService);
    expect(service).toBeTruthy();
  });

  it('should place a report', async () => {
    const service: AdminService = TestBed.get(AdminService);
    var repID;
    var report;
    await service.placeReport(MOCKDB.REPORTS[0].item,MOCKDB.REPORTS[0].desc).then(x => repID = x);
    await service.getReport(repID).subscribe(x => expect(x.desc).toBe(MOCKDB.REPORTS[0].desc));
  });

  it('should clear all reports', async () => {
    const service: AdminService = TestBed.get(AdminService);
    spyOn(service, 'deleteReport').and.returnValue(null);
    var reports: SentReport[] = [
      {
          item: '999',
          desc: 'This is problematic',
          user: "111",
          ID: '000',
          trueItem: null,
          userName: ""
      },
      {
          item: '998',
          desc: 'Send help',
          user: "112",
          ID: '001',
          trueItem: null,
          userName: ""
      },
      {
          item: '998',
          desc: 'The item can see into my soul',
          user: "113",
          ID: '002',
          trueItem: null,
          userName: ""
      }
      ]
    service.clearReports(reports);
    expect(reports.length).toBe(0);
  }
  
  
)});
