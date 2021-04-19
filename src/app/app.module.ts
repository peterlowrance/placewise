import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

// Imports for material design modules
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatAutocompleteModule, MatButtonToggleModule, MatTableModule} from '@angular/material';
import {MatInputModule} from '@angular/material/input';
import {MatDialogModule} from '@angular/material/dialog';
import {MatTreeModule} from '@angular/material/tree';
import {MatListModule} from '@angular/material/list';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDividerModule} from '@angular/material/divider';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatMenuModule} from '@angular/material/menu';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatBadgeModule} from '@angular/material/badge';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSelectModule} from '@angular/material/select';
import {TextFieldModule} from '@angular/cdk/text-field';

import {SmdFabSpeedDialModule} from 'node_modules/angular-speed-dial';
// Imports for all Placewise modules
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NavbarComponent} from './components/navbar/navbar.component';
import {HomeComponent} from './components/home/home.component';
import {LoginComponent} from './components/login/login.component';
import {ItemComponent} from './components/item/item.component';
import {NotFoundComponent} from './components/not-found/not-found.component';
import {ReportDialogComponent} from './components/report-dialog/report-dialog.component';
import {AngularFireModule} from '@angular/fire';
import {environment} from '../environments/environment';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {SettingsComponent} from './components/settings/settings.component';
import {ResetPassDialogComponent} from './components/reset-pass-dialog/reset-pass-dialog.component';
import {ChangePassDialogComponent} from './components/change-pass-dialog/change-pass-dialog.component';
import {AngularFireStorageModule} from '@angular/fire/storage';
import {ReportDetailViewComponent} from './components/report-detail-view/report-detail-view.component';
import {AdminReportComponent} from './components/admin-report/admin-report.component';
import {ModifyHierarchyComponent} from './components/modify-hierarchy/modify-hierarchy.component';
import {EditHierarchyDialogComponent} from './components/edit-hierarchy-dialog/edit-hierarchy-dialog.component';
import {ModifyHierarchyDialogComponent} from './components/modify-hierarchy-dialog/modify-hierarchy-dialog.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatRadioModule} from '@angular/material/radio';
import {ModerateUsersComponent} from './components/moderate-users/moderate-users.component';
import {HttpClientModule} from '@angular/common/http';
import {AddUserDialogComponent} from './components/add-user-dialog/add-user-dialog.component';
import { ConfirmComponent } from './components/confirm/confirm.component';
import { AncestorViewComponent } from './components/ancestor-view/ancestor-view.component';
import { HierarchyItemComponent } from './components/hierarchy-item/hierarchy-item.component';
import { UserSelectComponent } from './components/user-select/user-select.component';
import { ItemBuilderComponent } from './components/item-builder/item-builder.component';
import { ItemBuilderModalComponent } from './components/item-builder-modal/item-builder-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    LoginComponent,
    ItemComponent,
    NotFoundComponent,
    ReportDialogComponent,
    AdminReportComponent,
    SettingsComponent,
    ModifyHierarchyComponent,
    EditHierarchyDialogComponent,
    ResetPassDialogComponent,
    ChangePassDialogComponent,
    ReportDetailViewComponent,
    ModifyHierarchyDialogComponent,
    ModerateUsersComponent,
    AddUserDialogComponent,
    ConfirmComponent,
    AncestorViewComponent,
    HierarchyItemComponent,
    UserSelectComponent,
    ItemBuilderComponent,
    ItemBuilderModalComponent
  ],
  imports: [
    BrowserModule,
    MatToolbarModule,
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
    MatBadgeModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatTableModule,
    MatAutocompleteModule,
    AngularFireModule.initializeApp(environment.firebase, 'clientpanel'),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireStorageModule,
    MatSnackBarModule,
    MatDividerModule,
    MatProgressBarModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    SmdFabSpeedDialModule,
    MatCheckboxModule,
    MatRadioModule,
    MatTableModule,
    HttpClientModule,
    TextFieldModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [ItemBuilderModalComponent, ReportDialogComponent, EditHierarchyDialogComponent, ResetPassDialogComponent, ChangePassDialogComponent, ModifyHierarchyDialogComponent, ReportDetailViewComponent, AddUserDialogComponent, ConfirmComponent]
})
export class AppModule { }
