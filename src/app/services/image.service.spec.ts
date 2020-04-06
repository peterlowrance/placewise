import {async, TestBed} from '@angular/core/testing';

import { ImageService } from './image.service';
import {AngularFireStorage} from '@angular/fire/storage';
import {AuthService} from './auth.service';
import * as AuthTest from './auth.mock.service';
import {HomeComponent} from '../components/home/home.component';

const FireStorageStub = {
  ref: (url: string) => {
  }
}



describe('ImageService', () => {

  beforeEach(async(() =>
    TestBed.configureTestingModule({

      providers: [
        { provide: AngularFireStorage, useValue: FireStorageStub},
        { provide: AuthService, useClass: AuthTest.AuthMockService}
      ]

    })
  ));


  it('should be created', () => {
    const service: ImageService = TestBed.get(ImageService);
    expect(service).toBeTruthy();
  });

  it('workspace id prepend', () => {
    const service = TestBed.get(ImageService);
    let spy = spyOn(TestBed.get(AngularFireStorage), 'ref');
    service.putImage(null, 'hacker');
    expect(spy).toHaveBeenCalledWith('000111000/hacker')
  })
});
