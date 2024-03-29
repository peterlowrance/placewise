import { TestBed, waitForAsync } from '@angular/core/testing';

import { ImageService } from './image.service';
import {AngularFireStorage} from '@angular/fire/storage';
import {AuthService} from './auth.service';
import * as AuthTest from './auth.mock.service';
import {SearchComponent} from '../components/search/search.component';
import {BehaviorSubject} from 'rxjs';


const FireStorageStub = {
  ref: (url: string) => ({
    put: (file: File) => {},
    delete: () => ({
      toPromise: () => {
        return new Promise((resolve, _reject) => resolve('Yay!'));
      }
    }),
    getDownloadURL: () => {
      return ({
        toPromise: () => {
          return new Promise((resolve, _reject) => resolve('Yay!'));
        }
      });
    }
  })
}



describe('ImageService', () => {

  beforeEach(waitForAsync(() =>
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

  it('putImage basic method test', () => {
    const service = TestBed.get(ImageService);
    return service.putImage(null, 'hacker').then( data => {
      expect(data).toBe('Yay!');
    })
  })

  it('removeImage basic method test', () => {
    const service = TestBed.get(ImageService);
    return service.removeImage( 'hacker').then( data => {
      expect(data).toBe('Yay!');
    })
  })
});
