import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { SharedModule } from './shared.module';

import { AppComponent, AppTemplateComponent } from './components/app.component';

import { AuthenService } from './services/api/authen.service';
import { AuthenGuardService } from './services/api/authen-guard.service';
import { FormService } from './services/api/form.service';
import { DataService } from './services/api/data.service';

import { StorageService } from './services/shared/storage.service';
import { MenuService } from './services/shared/menu.service';
import { TranslateService } from './services/shared/translate.service';
import { ViewService } from './services/shared/view.service';
import { ExtService } from './services/shared/ext.service';

import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { FormComponent } from './components/form/form.component';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        SharedModule,
        RouterModule.forRoot([
            {
                path: '',
                component: AppTemplateComponent,
                canActivate: [AuthenGuardService],
                children: [{
                    path: 'dashboard',
                    component: DashboardComponent
                }, {
                    path: 'form/:id',
                    component: FormComponent
                }, {
                    path: 'form/:id/:key',
                    component: FormComponent
                }, {
                    path: 'sub-form/:id',
                    component: FormComponent
                }, {
                    path: 'sub-form/:id/:key',
                    component: FormComponent
                }]
            },
            {
                path: 'login',
                component: LoginComponent
            }
        ], {
            onSameUrlNavigation: 'reload'
        })
    ],
    declarations: [
        AppComponent,
        AppTemplateComponent,
        LoginComponent,
        DashboardComponent,
        FormComponent
    ],
    providers: [
        AuthenService,
        AuthenGuardService,
        FormService,
        DataService,
        StorageService,
        MenuService,
        TranslateService,
        ViewService,
        ExtService
    ],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
