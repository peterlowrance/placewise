import {async, TestBed} from '@angular/core/testing';

import { ImageService } from './image.service';
import {AngularFireStorage} from '@angular/fire/storage';
import {AuthService} from './auth.service';
import * as AuthTest from './auth.mock.service';
import {HomeComponent} from '../components/home/home.component';

let refMock = {
  put: jest.fn((file: File) => {
  }),
  getDownloadURL: jest.fn(() => 'yay!')
}

let storageMock = {
  ref: jest.fn((refUrl: string) => {
  })
}

describe('ImageService', () => {
  let service: ImageService;
  let fireStorage: AngularFireStorage;

  beforeEach(async(() =>
    TestBed.configureTestingModule({
      declarations: [ImageService],
      providers: [
        { provide: AngularFireStorage, useValue: storageMock},
        { provide: AuthService, useClass: AuthTest.AuthMockService}
        ]

    })
  ));

  beforeEach(() => {
    service = TestBed.get(ImageService);
  })

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('workspace id prepend', () => {
    let spy = spyOn(fireStorage, 'ref');
    service.putImage(null, 'hacker');
    expect(spy).toHaveBeenCalledWith('000111000/hacker')
  })
});
