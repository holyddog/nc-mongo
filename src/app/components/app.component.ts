import { Component, OnInit, HostListener } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';

import { MenuService } from '../services/shared/menu.service';
import { TranslateService } from '../services/shared/translate.service';
import { ViewService } from '../services/shared/view.service';
import { FormService } from '../services/api/form.service';

import { AuthenService } from '../services/api/authen.service';
import { AppService } from '../services/shared/app.service';

import { Config } from '../../environments/environment';

declare var $: any;
declare var Ext: any;

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {
    constructor(private authen: AuthenService, private translate: TranslateService) {
    }

    ngOnInit(): void {
        this.authen.load();
        this.translate.use('th');
    }
}

@Component({
    selector: 'app-template',
    templateUrl: 'app-template.component.html',
    styleUrls: ['app.component.css']
})
export class AppTemplateComponent implements OnInit {
    menus: any[] = [];

    constructor(private location: Location, private router: Router, private title: Title, public app: AppService, private menu: MenuService, private view: ViewService, public authen: AuthenService, private formService: FormService) {
        router.events.subscribe((val) => {
            if (val instanceof NavigationEnd) {                
                // this.view.clearComponent();

                this.view.title = Config.AppName;
                
                // this.menu.hideMenu(this.location.path());
            }
        });
    }

    ngOnInit(): void {
        this.title.setTitle(Config.AppName);
        this.view.title = Config.AppName;
        this.menu.name = this.location.path();

        this.app.showLoading();
        this.formService.findMenu()
            .then(data => {
                this.app.hideLoading();
                this.menus = data;
            });
    }

    onActivate(): void {
    }

    navigate(menu: any): void {
        this.menu.hideMenu(menu.link);
    }

    logOut(): void {
        this.authen.logOut();
        this.router.navigate(["/login"]);
    }

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        Ext.CacheComponents.map(c => {
            c.items.map(i => {
                i.updateLayout();
                if (i.xtype == 'grid') {
                    i.setWidth('auto');
                }
            });
            if (c.tbar) {
                c.tbar.updateLayout();
            }
        }); 
    }
}