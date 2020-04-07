import { TestBed, async } from '@angular/core/testing';
import {SentReport} from '../models/SentReport';
import { AdminService } from './admin.service';

import * as MOCKDB from '../models/MockDB'
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import * as AuthTest from '../services/auth.mock.service';
import { BehaviorSubject, of } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/storage';
import { HttpClient } from '@angular/common/http';

let storageMock = {
  ref: jest.fn((refUrl: string) => {
  })
}

const FirestoreStub = {
  collection: (name: string) => ({
    doc: (_id: string) => ({
      valueChanges: () => new BehaviorSubject({foo: 'bar'}),
      set: (_d: any) => new Promise((resolve, _reject) => resolve()),
    }),
  })
};

const HttpClientStub = {
  post: (url: string, body: any) => of(null)
};



describe('AdminService', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AngularFireStorage, useValue: storageMock},
        { provide: AngularFirestore, useValue: FirestoreStub}, 
        { provide: HttpClient, useValue: HttpClientStub},
        { provide: AuthService,useClass: AuthTest.AuthMockService
        }]
    })
      .compileComponents();
  }));

  it('should be created', () => {
    const service: AdminService = TestBed.get(AdminService);
    expect(service).toBeTruthy();
  });

  /*it('should place a report', async () => {
    const service: AdminService = TestBed.get(AdminService);
    var repID;
    var report;
    await service.placeReport(MOCKDB.REPORTS[0].item,MOCKDB.REPORTS[0].desc).then(x => repID = x);
    await service.getReport(repID).subscribe(x => expect(x.desc).toBe(MOCKDB.REPORTS[0].desc));
  });*/

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
    reports = service.clearReports(reports);
    expect(reports.length).toBe(0);
  }
  

)});
