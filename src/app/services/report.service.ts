import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { Item } from '../models/Item';
import { HierarchyLocation } from '../models/Location';
import { ReportStructure, ReportStructureFirebaseCollection, ReportStructureWrapper } from '../models/ReportStructure';
import { SentReport } from '../models/SentReport';
import { AuthService } from './auth.service';

const adServe = 'https://placewise-d040e.appspot.com/';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  reportSubscription: Subscription;
  reportStructure: ReportStructureFirebaseCollection;

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private afs: AngularFirestore, 
    ) {
      
      this.auth.getWorkspace().subscribe(result => {
        if(result.id){
          // If the report subscription exists, unsubscribe
          if(this.reportSubscription){
            this.reportSubscription.unsubscribe();
          }

          // Get the report data now that we have the workspace ID
          this.reportSubscription = this.afs.doc<ReportStructureFirebaseCollection>('/Workspaces/' + this.auth.workspace.id + '/StructureData/ReportStructure').snapshotChanges().subscribe(structure => {
            this.reportStructure = structure.payload.data();
          });
        }
      })
    }


  placeReport(itemID: string, text: string, reportedTo: string[], locationID: string, type: string) {
    return new Promise((resolve, reject) => {
      this.auth.getAuth().subscribe(auth => {
        auth.getIdTokenResult().then(
          token => {
            // with token remove user by pinging server with token and email
            this.http.post(`${adServe}/createReport`, {
              idToken: token,
              item: itemID,
              location: locationID,
              message: text,
              reportTo: reportedTo,
              type: type
            }).toPromise().then(
              () => resolve(`Report sent!`),
              (err) => reject(err.error)
            );
          }
        );
      });
    });
  }

  getReport(id: string) {
    return this.afs.doc<SentReport>('/Workspaces/' + this.auth.workspace.id + '/Reports/' + id).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as SentReport;
      if (!data) {
        return;
      }
      data.ID = a.payload.id;
      return data;
    }));
  }

  getReports(): Observable<SentReport[]> {
    return this.afs.collection<SentReport>('/Workspaces/' + this.auth.workspace.id + '/Reports').snapshotChanges().pipe(
      map(a => {
        return a.map(g => {
            const data = g.payload.doc.data() as SentReport;
            data.ID = g.payload.doc.id;
            return data;
          }
        );
      }));
  }

  async getReportsAvailableHere(item: Item): Promise<ReportStructureWrapper[]> {
    let availableReports: ReportStructureWrapper[] = [];

    for(let report in this.reportStructure){
      // If the report has no speific locations, it's available everywhere, so add
      if(!this.reportStructure[report].locations){
        availableReports.push({abbreviation: report, reportStructure: this.reportStructure[report]});
        continue;
      }

      // Look through the hierarchy of this location and its ancestors to see if we can find a hit
      for(let locationID of item.locations){
        // First build out the basic structure
        let reportWithValidLocations: ReportStructureWrapper = {abbreviation: report, reportStructure: this.reportStructure[report], validLocationIDs: []};

        // Then add valid locations we find
        for(let loopLocationID = locationID; loopLocationID;){
          if(this.reportStructure[report].locations[loopLocationID]){
  
            // If there are no users for this location, add it
            if(!this.reportStructure[report].locations[loopLocationID].users){
              // Push original location because that's the valid (child) location for that report
              reportWithValidLocations.validLocationIDs.push(locationID); 
              break;
            }
  
            // If we're in the user list, add it
            else if(this.reportStructure[report].locations[loopLocationID].users.indexOf(this.auth.userInfo.id) > -1){
              reportWithValidLocations.validLocationIDs.push(locationID);
              break;
            }
            // If not, break the loop as the most specific location didn't have us, so we're not able to rpeort here
            else {
              break;
            }
          }
  
          // Cycle to the next parent
          let location = (await this.afs.doc('/Workspaces/' + this.auth.workspace.id + '/Locations/' + loopLocationID).get().toPromise()).data() as HierarchyLocation;
          loopLocationID = location.parent;
        }

        // If we found some locations to report to, add this report to the available reports
        if(reportWithValidLocations.validLocationIDs.length > 0){
          availableReports.push(reportWithValidLocations);
        }
      }
    }

    return availableReports;
  }

}
