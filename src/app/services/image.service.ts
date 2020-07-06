import { Injectable } from '@angular/core';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import {HttpHeaders, HttpClient, HttpResponse, HttpRequest} from '@angular/common/http';
import { AuthService } from './auth.service';
import {AngularFirestore} from '@angular/fire/firestore';
import {EMPTY, Observable, of} from 'rxjs';


const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

const adServe = 'https://placewise-d040e.appspot.com/';


@Injectable({
  providedIn: 'root'
})

export class ImageService {

  constructor(private afsg: AngularFireStorage, private auth: AuthService, private http: HttpClient) { }

  async putImage(imageURL: string, itemID: string): Promise<string> {
    // Send it to Firestorage
    //const ref = this.afsg.ref(this.auth.workspace.id + '/' + itemID);
    //return new Promise((resolve, reject) => {
    //   canvas.toBlob(async function (blob) {
    //     console.log("WAT: " + blob);
    //     await ref.put(blob);
    //     ref.getDownloadURL().toPromise().then(link => { 
    //       console.log(link);
    //       resolve(link);
    //     })
    //   })
    // });

    // return new Promise((resolve, reject) => {
    //   this.auth.getAuth().subscribe(
    //     auth => {
    //       // if auth is null, reject
    //       if (auth === null) { reject('Auth token could not be retrieved. Perhaps you are logged out?'); }
    //       // logged in, get goin'
    //       auth.getIdTokenResult().then(
    //         idToken => {

    //           let formData = new FormData();
    //           var veri;
    //           formData.append('Accept', 'application/json');
    //           formData.append('idToken' , idToken.token);
    //           formData.append('Content-Type', 'multipart/form-data');
    //           formData.append('file', file);

    //           this.http.post(`${adServe}/setImage`, formData)
    //           .subscribe(data => {
    //             console.log( data['_body']);
    //             veri = data['_body'];
    //             veri = veri.replace(/\\/g, "");
    //             veri = JSON.parse(veri);
    //             console.log(veri);
    //           });

    //           // // with token add user by pinging server with token and email
    //           // this.http.post(`${adServe}/setImage`, {idToken, itemID, file}, httpOptions).toPromise().then(
    //           //   () => console.log('YEET: '),
    //           //   err => reject(err.error)
    //           //   );
    //       },
    //       // reject getIDToken
    //       (err) => reject(err)
    //       );
    //     }
    //   );
    // });

    //get blob ref
    const ref = this.afsg.ref(this.auth.workspace.id + '/' + itemID);
    //put
    await ref.put(this.dataURLtoBlob(imageURL));
    //return new link
    return ref.getDownloadURL().toPromise();
  }

  removeImage(itemID: string): Promise<any> {
    if (itemID === '../../../assets/notFound.png') {
      return;
    }
    //get ref
    const ref = this.afsg.ref(this.auth.workspace.id + '/' + itemID);
    //erase
    return ref.delete().toPromise();
  }

  // Crops and shrinks image to conserve size and fit better in the UI
  resizeImage(imageURL: string): Promise<string> {
    return new Promise((resolve, reject) => {

      //    STEP 0: Init image
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext("2d");
      var img = new Image();
      let maxImageHeight = 600, imageQualityForMaxSize = 0.7, minImageHeight = 300;
      img.onload = function() {

        //    STEP 1: CROP to ratio between 4:3 to 1:1, whatever is closer to the image
        var cutx = 0, cuty = 0;

        // Determine where to cut, if need be
        if(img.height > img.width) { // Taller than 1:1
            cuty = (img.height - img.width) / 2;
        }
        else if(img.width * 3 / 4 > img.height) { // Longer than 4:3
            cutx = (img.width - (img.height * 4 / 3)) / 2;
        }

        // Size canvas for cutting
        canvas.width = img.width - (cutx * 2) + 1; // Tends to be one short
        canvas.height = img.height - (cuty * 2);

        //    STEP 2: Shrink so that it's not taller than 1000 pixels
        if(canvas.height > maxImageHeight){
          canvas.width = maxImageHeight * canvas.width / canvas.height;
          canvas.height = maxImageHeight;
        }

        //    STEP 3: Render
        ctx.drawImage(img, cutx, cuty, img.width - (cutx * 2), img.height - (cuty * 2), 0, 0, canvas.width, canvas.height);

        //    STEP 4: Determine quality of image. If the image is rather small, keep as much quality as possible.
        var quality = imageQualityForMaxSize;
        var difference = maxImageHeight - canvas.height;
        let possibleDifference = maxImageHeight - minImageHeight;
        if(difference > possibleDifference){
          quality = 1.0;
        }
        else if(difference > 1){
          quality = quality + (difference/possibleDifference/(1-imageQualityForMaxSize)); // meaning: difference / 700 (possible difference of pixels) / 0.4 (rest of quality available)
        }

        const str = canvas.toDataURL('image/jpeg', quality);
        resolve(str);
      }
      img.src = imageURL;
    })
  }

  // Got off stackoverflow
  dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
  }
}
