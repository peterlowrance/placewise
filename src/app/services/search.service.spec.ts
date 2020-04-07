import {async, TestBed} from '@angular/core/testing';

import { SearchService } from './search.service';
import {AngularFireStorage} from "@angular/fire/storage";
import {AngularFirestore} from "@angular/fire/firestore";
import {HttpClient} from "@angular/common/http";
import {AuthService} from "./auth.service";
import * as AuthTest from "./auth.mock.service";
import {BehaviorSubject, of} from "rxjs";

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

describe('SearchService', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AngularFireStorage, useValue: storageMock},
        { provide: AngularFirestore, useValue: FirestoreStub},
        { provide: HttpClient, useValue: HttpClientStub},
        { provide: AuthService, useClass: AuthTest.AuthMockService
        }]
    })
      .compileComponents();
  }));

  it('should be created', () => {
    const service: SearchService = TestBed.get(SearchService);
    expect(service).toBeTruthy();
  });
});
