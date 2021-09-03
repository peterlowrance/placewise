import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { of } from 'rxjs';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Item } from '../models/Item';
import { ItemTrackingPacket } from '../models/ItemTrackingPacket';
import { ItemTrackingTransfer } from '../models/ItemTrackingTransfer';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {

  constructor(
    private afs: AngularFirestore
  ) { }

  // The most recent tracking will be stored on the ID 
  getTrackingPacket(workspaceID: string, trackingPacketID: string): Observable<ItemTrackingPacket>{
    if (!trackingPacketID) {
      return of(null);
    }

    return this.afs.doc<ItemTrackingPacket>('/Workspaces/' + workspaceID + '/ItemTracking/' + trackingPacketID).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as ItemTrackingPacket;
      if(data){
        data.ID = a.payload.id;
        return data;
      }
      else {
        return null;
      }
    }));
  }

  updateTracking(workspaceID: string, info: ItemTrackingTransfer, item: Item): Promise<string> {
    return new Promise<string>( async resolve => {
      if(item.trackingID){
        this.afs.doc<ItemTrackingPacket>('/Workspaces/' + workspaceID + '/ItemTracking/' + item.trackingID).get().subscribe(trackingPacket => {
          if(trackingPacket.exists){
            let packetData = trackingPacket.data() as ItemTrackingPacket;

            // If the packet is full, split into two packets, the trailing one having 100 and the new one with 20
            if(packetData.data.length >= 120){
              
            }

            // Otherwise add the info to the beginning of the packet
            else {
              packetData.data.unshift(info);
            }
          }
        });
      }
    });
  }
}
