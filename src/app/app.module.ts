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
    SettingsComponent,
    ResetPassDialogComponent
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
    MatSnackBarModule,
    MatDividerModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [ReportDialogComponent, ResetPassDialogComponent]
})
export class AppModule { }
