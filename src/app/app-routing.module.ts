import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

//Guards
import {AuthGuard} from './guards/auth.guard'

// TODO: import routes to all components here
import {HomeComponent} from './components/home/home.component';
import {LoginComponent} from './components/login/login.component';
import {ItemComponent} from './components/item/item.component';
import {NotFoundComponent} from './components/not-found/not-found.component';
import {SettingsComponent} from './components/settings/settings.component'
import { AdminReportComponent } from './components/admin-report/admin-report.component';
import {ModifyHierarchyComponent} from "./components/modify-hierarchy/modify-hierarchy.component";
import { ModerateUsersComponent } from './components/moderate-users/moderate-users.component';
import { HierarchyItemComponent } from './components/hierarchy-item/hierarchy-item.component';
import { TextSearchComponent } from './components/text-search/text-search.component';
import { ReportTemplatesComponent } from './components/report-templates/report-templates.component';
import { ReportTemplateEditComponent } from './components/report-template-edit/report-template-edit.component';

const routes: Routes = [
  {path: 'w/:workspaceID/search/:selectedHierarchy/:id', component: HomeComponent, canActivate: [AuthGuard]},
  {path: 'w/:workspaceID/textSearch', component: TextSearchComponent, canActivate: [AuthGuard]},
  {path: 'login', component: LoginComponent},
  {path: 'w/:workspaceID/item/:id', component: ItemComponent, canActivate: [AuthGuard]},
  {path: 'settings', component: SettingsComponent, canActivate: [AuthGuard]},
  {path: 'w/:workspaceID/reports', component: AdminReportComponent, canActivate: [AuthGuard]},
  {path: 'w/:workspaceID/reports/templates', component: ReportTemplatesComponent, canActivate: [AuthGuard]},
  {path: 'w/:workspaceID/reports/templates/:type', component: ReportTemplateEditComponent, canActivate: [AuthGuard]},
  //{path: '/w/:workspace/modify/:selectedHierarchy', component: ReportTemplateEditComponent, canActivate: [AuthGuard]},
  {path: 'w/:workspaceID/users', component: ModerateUsersComponent, canActivate: [AuthGuard]},
  {path: 'w/:workspaceID/hierarchyItem/:selectedHierarchy/:id', component: HierarchyItemComponent, canActivate: [AuthGuard]},
  {path: '', redirectTo: '/search/locations/root', pathMatch: 'full'},
  {path: '', redirectTo:'/login', pathMatch:'full'},

  // QR Code Reroutes
  {path: 'w/:workspaceID/i/:id', redirectTo: 'w/:workspaceID/item/:id', pathMatch: 'full'},
  {path: 'w/:workspaceID/hi/c/:id', redirectTo: 'w/:workspaceID/hierarchyItem/categories/:id', pathMatch: 'full'},
  {path: 'w/:workspaceID/hi/l/:id', redirectTo: 'w/:workspaceID/hierarchyItem/locations/:id', pathMatch: 'full'},
  {path: 'w/:workspaceID/s/c/:id', redirectTo: 'w/:workspaceID/search/categories/:id', pathMatch: 'full'},
  {path: 'w/:workspaceID/s/l/:id', redirectTo: 'w/:workspaceID/search/locations/:id', pathMatch: 'full'},

  {path: '**', component: NotFoundComponent}
];

@NgModule({
  providers: [AuthGuard],
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
