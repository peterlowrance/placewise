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


const routes: Routes = [
  {path: '', component: HomeComponent, canActivate: []},
  {path: 'login', component: LoginComponent},
  {path: 'item/:id', component: ItemComponent, canActivate: [AuthGuard]},
  {path: 'settings', component: SettingsComponent, canActivate: [AuthGuard]},
  {path: '**', component: NotFoundComponent}
];

@NgModule({
  providers: [AuthGuard],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
