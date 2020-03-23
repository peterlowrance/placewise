import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

//Imports for material design modules
import {MatToolbar} from '@angular/material/toolbar'
import {MatExpansionModule} from '@angular/material/expansion'
import {MatChipsModule} from '@angular/material/chips'
import {MatIconModule} from '@angular/material/icon'
import {MatGridListModule} from '@angular/material/grid-list'
import {MatButtonModule} from '@angular/material/button'
import {MatCardModule} from '@angular/material/card'
import {MatAutocompleteModule, MatButtonToggleModule} from '@angular/material';
import {MatInputModule} from '@angular/material/input'
import {MatDialogModule} from '@angular/material/dialog'
import {MatTreeModule} from '@angular/material/tree'
import {MatListModule, MatList} from '@angular/material/list'
import {MatSnackBarModule} from '@angular/material/snack-bar'
import {MatDividerModule} from '@angular/material/divider'

import {SmdFabSpeedDialModule} from 'node_modules/angular-speed-dial'

//Imports for all Placewise modules
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { ItemComponent } from './components/item/item.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { ReportDialogComponent } from './components/report-dialog/report-dialog.component';
import {AngularFireModule} from '@angular/fire';
import {environment} from '../environments/environment';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {AngularFireAuthModule} from '@angular/fire/auth';
import { SettingsComponent } from './components/settings/settings.component';
import { ResetPassDialogComponent } from './components/reset-pass-dialog/reset-pass-dialog.component';
import { ChangePassDialogComponent } from './components/change-pass-dialog/change-pass-dialog.component';
import {AngularFireStorageModule} from '@angular/fire/storage';
import { ReportDetailViewComponent } from './components/report-detail-view/report-detail-view.component';
import { AdminReportComponent } from './components/admin-report/admin-report.component'
import { ModifyHierarchyComponent } from './components/modify-hierarchy/modify-hierarchy.component';
import { EditHierarchyDialogComponent } from './components/edit-hierarchy-dialog/edit-hierarchy-dialog.component';
import { ModifyHierarchyDialogComponent } from './components/modify-hierarchy-dialog/modify-hierarchy-dialog.component';
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatRadioModule} from "@angular/material/radio";
import { ModerateUsersComponent } from './components/moderate-users/moderate-users.component';
import {MatTableModule} from '@angular/material/table';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    LoginComponent,
    ItemComponent,
    NotFoundComponent,
    MatToolbar,
    ReportDialogComponent,
    AdminReportComponent,
    SettingsComponent,
    ModifyHierarchyComponent,
    EditHierarchyDialogComponent,
    ResetPassDialogComponent,
    ChangePassDialogComponent,
    ReportDetailViewComponent,
    ModifyHierarchyDialogComponent,
    ModerateUsersComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatChipsModule,
    MatIconModule,
    MatGridListModule,
    MatExpansionModule,
    MatButtonModule,
    MatCardModule,
    MatButtonToggleModule,
    MatInputModule,
    MatDialogModule,
    MatTreeModule,
    MatListModule,
    MatAutocompleteModule,
    AngularFireModule.initializeApp(environment.firebase, 'clientpanel'),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireStorageModule,
    MatSnackBarModule,
    MatDividerModule,
    SmdFabSpeedDialModule,
    MatCheckboxModule,
    MatRadioModule,
    MatTableModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [ReportDialogComponent, EditHierarchyDialogComponent, ResetPassDialogComponent, ChangePassDialogComponent, ModifyHierarchyDialogComponent, ReportDetailViewComponent]
})
export class AppModule { }
