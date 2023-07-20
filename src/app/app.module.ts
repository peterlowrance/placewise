import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

// Imports for material design modules
import { CommonModule } from '@angular/common';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatTableModule} from '@angular/material/table';
import {MatAutocompleteModule} from '@angular/material/autocomplete'; 
import {MatButtonToggleModule} from '@angular/material/button-toggle';
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
import {DragDropModule} from '@angular/cdk/drag-drop';
import {MatTabsModule} from '@angular/material/tabs';

import {SmdFabSpeedDialModule} from 'node_modules/angular-speed-dial';
// Imports for all Placewise modules
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NavbarComponent} from './components/navbar/navbar.component';
import {SearchComponent} from './components/search/search.component';
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
import { ItemBuilderModalComponent } from './components/item-builder-modal/item-builder-modal.component';
import { AttributeOptionsEditorDialogComponent } from './components/attribute-options-editor-dialog/attribute-options-editor-dialog.component';
import { SimpleFieldDialogComponent } from './components/simple-field-dialog/simple-field-dialog.component';
import { QuickAddListComponent } from './components/quick-add-list/quick-add-list.component';
import { AttributeBuilderDialogComponent } from './components/attribute-builder-dialog/attribute-builder-dialog.component';
import { AddAttributeSuffixDialogComponent } from './components/add-attribute-suffix-dialog/add-attribute-suffix-dialog.component';
import { HierarchyItemGridComponent } from './components/hierarchy-item-grid/hierarchy-item-grid.component';
import { TextSearchComponent } from './components/text-search/text-search.component';
import { ReportTemplatesComponent } from './components/report-templates/report-templates.component';
import { ReportSelectComponent } from './components/report-select/report-select.component';
import { ReportTemplateEditComponent } from './components/report-template-edit/report-template-edit.component';
import { UserInputDialogComponent } from './components/user-input-dialog/user-input-dialog.component';
import { ColorPaletteDialogComponent } from './components/color-palette-dialog/color-palette-dialog.component';
import { ReportFormatPieceDialogComponent } from './components/report-format-piece-dialog/report-format-piece-dialog.component';
import { QRCodeItemDialogComponent } from './components/qrcode-item-dialog/qrcode-item-dialog.component';
import { QRCodeModule } from 'angularx-qrcode';
import { QRCodeLocationDialogComponent } from './components/qrcode-location-dialog/qrcode-location-dialog.component';
import { QRCodeCategoryDialogComponent } from './components/qrcode-category-dialog/qrcode-category-dialog.component';
import { TransferStockDialogComponent } from './components/transfer-stock-dialog/transfer-stock-dialog.component';
import { NgxMasonryModule } from 'ngx-masonry';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { QRScannerDialogComponent } from './components/qrscanner-dialog/qrscanner-dialog.component';
import { ReportListComponent } from './components/report-list/report-list.component';
import { PrintQueueComponent } from './components/print-queue/print-queue.component';
import { BinSelectDialogComponent } from './components/bin-select-dialog/bin-select-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    SearchComponent,
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
    ItemBuilderModalComponent,
    AttributeOptionsEditorDialogComponent,
    SimpleFieldDialogComponent,
    QuickAddListComponent,
    AttributeBuilderDialogComponent,
    AddAttributeSuffixDialogComponent,
    HierarchyItemGridComponent,
    TextSearchComponent,
    ReportTemplatesComponent,
    ReportSelectComponent,
    ReportTemplateEditComponent,
    UserInputDialogComponent,
    ColorPaletteDialogComponent,
    ReportFormatPieceDialogComponent,
    QRCodeItemDialogComponent,
    QRCodeLocationDialogComponent,
    QRCodeCategoryDialogComponent,
    TransferStockDialogComponent,
    QRScannerDialogComponent,
    ReportListComponent,
    PrintQueueComponent,
    BinSelectDialogComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    MatToolbarModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    SmdFabSpeedDialModule,
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
    MatCheckboxModule,
    MatRadioModule,
    MatTableModule,
    HttpClientModule,
    TextFieldModule,
    DragDropModule,
    QRCodeModule,
    NgxMasonryModule,
    ZXingScannerModule,
    MatTabsModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [
    AttributeBuilderDialogComponent,
    AddAttributeSuffixDialogComponent, 
    SimpleFieldDialogComponent, 
    AttributeOptionsEditorDialogComponent, 
    ItemBuilderModalComponent, 
    ReportDialogComponent, 
    EditHierarchyDialogComponent, 
    ResetPassDialogComponent, 
    ChangePassDialogComponent, 
    ModifyHierarchyDialogComponent, 
    ReportDetailViewComponent, 
    AddUserDialogComponent, 
    ConfirmComponent]
})
export class AppModule { }
