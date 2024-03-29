import { HttpClient } from '@angular/common/http';
import { ComponentFactoryResolver, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';
import { firestore } from 'firebase';
import { BehaviorSubject, Observer, of } from 'rxjs';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { Item } from '../models/Item';
import { HierarchyLocation } from '../models/Location';
import { ReportStructure, ReportStructureTemplates, ReportStructureWrapper } from '../models/ReportStructure';
import { SentReport } from '../models/SentReport';
import { AuthService } from './auth.service';
import { SearchService } from './search.service';

// Not the best place to put this, but don't want the circular dependency with admin service
export const adServe = 'https://placewise-d040e.appspot.com/';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private reportSubscription: Subscription;
  private reportStructure: BehaviorSubject<ReportStructureWrapper[]> = new BehaviorSubject([]);

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private afs: AngularFirestore, 
    private searchService: SearchService,
    ) {
      
      // If the report subscription exists, unsubscribe
      if(this.reportSubscription){
        this.reportSubscription.unsubscribe();
      }
    }

  loadReportStructure(){

  }


  placeReport(workspaceID: string, itemID: string, backupName: string, text: string, reportedTo: string[], locationID: string, type: string, urgentTitle?: string) {
    console.log(type);
    return new Promise((resolve, reject) => {
      this.auth.getAuth().subscribe(auth => {
        auth.getIdTokenResult().then(
          token => {
            if(urgentTitle){
              console.log({
                idToken: token,
                item: itemID,
                location: locationID,
                message: text,
                reportTo: reportedTo,
                type: type,
                urgentSubject: urgentTitle,
                workspace: workspaceID,
                backupName: backupName
              });
  
              // with token remove user by pinging server with token and email
              this.http.post(`${adServe}/createReport`, {
                idToken: token,
                item: itemID,
                location: locationID,
                message: text,
                reportTo: reportedTo,
                type: type,
                urgentSubject: urgentTitle,
                workspace: workspaceID,
                backupName: backupName
              }).toPromise().then(
                () => resolve(`Report sent!`),
                (err) => reject(err.error)
              );
            }
            else {
              console.log({
                idToken: token,
                item: itemID,
                location: locationID,
                message: text,
                reportTo: reportedTo,
                type: type,
                workspace: workspaceID,
                backupName: backupName
              });
  
              // with token remove user by pinging server with token and email
              this.http.post(`${adServe}/createReport`, {
                idToken: token,
                item: itemID,
                location: locationID,
                message: text,
                reportTo: reportedTo,
                type: type,
                workspace: workspaceID,
                backupName: backupName
              }).toPromise().then(
                () => resolve(`Report sent!`),
                (err) => reject(err.error)
              );
            }
          }
        );
      });
    });
  }

  getReport(workspaceID: string, id: string) {
    return this.afs.doc<SentReport>('/Workspaces/' + workspaceID + '/Reports/' + id).snapshotChanges().pipe(map(a => {
      const data = a.payload.data() as SentReport;
      if (!data) {
        return;
      }
      data.ID = a.payload.id;
      return data;
    }));
  }

  getReports(workspaceID: string): Observable<SentReport[]> {
    return this.afs.collection<SentReport>('/Workspaces/' + workspaceID + '/Reports').snapshotChanges().pipe(
      map(a => {
        return a.map(g => {
            const data = g.payload.doc.data() as SentReport;
            data.ID = g.payload.doc.id;
            return data;
          }
        );
      }));
  }

  lastWorkspaceID: string = '';
  // Preloads at the beginning, knows the workspaceID through navbar
  getReportTemplates(workspaceID: string): Observable<ReportStructureWrapper[]> {
    if(this.lastWorkspaceID === workspaceID){
      return this.reportStructure.asObservable();
    }
    if(this.reportSubscription){
      this.reportSubscription.unsubscribe();
    }

    this.reportSubscription = this.afs.doc<ReportStructureTemplates>('/Workspaces/' + workspaceID + '/StructureData/ReportStructure').snapshotChanges().subscribe(structure => {
      let templates = structure.payload.data();
      let reportsWithWrapper: ReportStructureWrapper[] = [];

      for(let template in templates){
        reportsWithWrapper.push({type: template, reportStructure: templates[template]})
      }
      reportsWithWrapper.sort((a, b) => a.reportStructure.order - b.reportStructure.order)

      this.reportStructure.next(reportsWithWrapper);
    });
    return this.reportStructure.asObservable(); //needs different approach, maybe loading it here for the first time?
  }

  async getReportsAvailableHere(workspaceID: string, item: Item): Promise<ReportStructureWrapper[]> {
    let availableReports: ReportStructureWrapper[] = [];
    let reportStructure = this.reportStructure.value;

    // 1: Go through and see what valid reports there are

    for(let report of reportStructure){

      // If the report has no speific locations, it's available everywhere, so add
      if(!report.reportStructure.locations){
        availableReports.push({type: report.type, reportStructure: report.reportStructure, validLocationIDs: item.locations});
        continue;
      }

      // First build out the basic structure
      let reportWithValidLocations: ReportStructureWrapper = {type: report.type, reportStructure: report.reportStructure, validLocationIDs: []};

      // Look through the hierarchy of this location and its ancestors to see if we can find a hit
      for(let locationID of item.locations){

        // Then add valid locations we find
        for(let loopLocationID of await this.searchService.getParentsOf(workspaceID, locationID, 'location')){
          if(report.reportStructure.locations[loopLocationID]){
  
            // If there are no users for this location, add it
            if(!report.reportStructure.locations[loopLocationID].users || report.reportStructure.locations[loopLocationID].users.length === 0){
              // Push original location because that's the valid (child) location for that report
              reportWithValidLocations.validLocationIDs.push(locationID); 
              break;
            }
  
            // If we're in the user list, add it
            else if(report.reportStructure.locations[loopLocationID].users.indexOf(this.auth.userInfo.value.id) > -1){
              reportWithValidLocations.validLocationIDs.push(locationID);
              break;
            }
            // If not, break the loop as the most specific location didn't have us, so we're not able to rpeort here
            else {
              break;
            }
          }
        }
      }

      // If we found some locations to report to, add this report to the available reports
      if(reportWithValidLocations.validLocationIDs.length > 0){
        availableReports.push(reportWithValidLocations);
      }
    }

    this.searchService.getWorkspaceInfo(workspaceID).subscribe(workspaceInfo => {
      // Include custom report at all times
      availableReports.push(this.getCustomReportTemplate(item.locations, workspaceInfo.defaultUsersForReports, availableReports.length + 1));
    })

    // 2: Of those valid reports, which have too many reports recently?

    let currentTimestamp = Date.now();

    for(let report of availableReports){
      if(report.reportStructure.maximumReportAmount){  // Quick check on if it has a limit

        // Check for each location in a report type. If there is none per location, that means it's valid for all the item's locations
        for(let locationID of report.validLocationIDs){
          let amount = 0;

          for(let itemReport of item.reports ?? []){
            // We can assume these are sorted correctly with the most recent at the front,
            // so if the time is older we don't need to check farther
            if(currentTimestamp - itemReport.timestamp > (report.reportStructure.maximumReportTimeframe * 3600000)){
              break;
            }
            else {
              if(itemReport.type === report.type && itemReport.location === locationID){
                // It's a match, and the report is within our time limit
                amount++;

                // To make it a little faster, stop the loop when we know we've already hit the limit
                if(amount >= report.reportStructure.maximumReportAmount){
                  break;
                }
              }
            }
          }

          // If the limit is reached, add the location as one we can't report to for this type of report
          if(amount >= report.reportStructure.maximumReportAmount){
            if(report.alreadyReportedLocations){
              report.alreadyReportedLocations.push(locationID);
            }
            else {
              report.alreadyReportedLocations = [locationID];
            }
          }
        }
      }
    }

    console.log(availableReports);

    return availableReports;
  }

  updateTemplate(workspaceID: string, template: ReportStructure, type: string){
    this.afs.doc('/Workspaces/' + workspaceID + '/StructureData/ReportStructure').update({[type] : template});
  }

  async addTemplate(workspaceID: string, id: string): Promise<boolean> {
    await this.afs.doc('/Workspaces/' + workspaceID + '/StructureData/ReportStructure').update({
      [id] : {
        name: id,
        description: "Default Description",
        color: "#c8c8c8",
        maximumReportTimeframe: 24,
        maximumReportAmount: 1,
        userInput: [{
          description: "Describe the problem briefly.",
          name: "What is the problem?",
          type: "text"
        }],
        reportTextFormat: [{
          data: "What is the problem?",
          type: "input"
        }]
      }
    });

    return true;
  }

  async deleteTemplate(workspaceID: string, id: string): Promise<boolean> {
    await this.afs.doc('/Workspaces/' + workspaceID + '/StructureData/ReportStructure').update({
      [id]: firestore.FieldValue.delete()
    });

    return true;
  }

  // Hardcoded custom template
  getCustomReportTemplate(validLocationIDs, reportToUsers, order): ReportStructureWrapper {
    return {
      type: 'custom',
      validLocationIDs: validLocationIDs,
      reportStructure: {
        name: "Custom Report",
        description: "Give a message to any admin that you'd like.",
        color: '#E8EFFF',
        maximumReportAmount: 3,
        maximumReportTimeframe: 24,
        userInput: [{
          name: "Report Details",
          description: "What is the problem?",
          type: 'text'
        }],
        reportToUsers: reportToUsers,
        reportTextFormat: [
          { type: 'input', data: 'Report Details' },
          { type: 'text', data: "\n\nThis was made with a custom report."}
        ],
        order: order
      }
    }
  }

}
