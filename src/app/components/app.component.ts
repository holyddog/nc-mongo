import { Component, OnInit, HostListener } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';

import { StorageService } from '../services/shared/storage.service';
import { MenuService } from '../services/shared/menu.service';
import { TranslateService } from '../services/shared/translate.service';
import { ViewService } from '../services/shared/view.service';

import { AuthenService } from '../services/api/authen.service';

import { environment, Config } from '../../environments/environment';

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
    menus: any[] = [{
        link: "/dashboard",
        name: "dashboard",
        icon: "fa-tachometer-alt",
        roles: ["admin"]
    }, {
        link: "/form/100001",
        name: "form_1",
        icon: "fa-inbox",
        roles: ["admin"]
    }, {
        name: "form_group",
        icon: "fa-chart-bar",
        roles: ["admin"],
        link: "/group",
        children: [{
            link: "/sub-form/100002",
            name: "form_2",
            roles: ["admin"]
        }, {
            link: "/sub-form/100003",
            name: "form_3",
            roles: ["admin"]
        }, {
            link: "/sub-form/100004",
            name: "form_4",
            roles: ["admin"]
        }]
    }];

    constructor(private location: Location, private router: Router, private title: Title, private menu: MenuService, private view: ViewService, public authen: AuthenService) {
        router.events.subscribe((val) => {
            if (val instanceof NavigationEnd) {
                Ext.CacheComponents.map(c => {
                    c.destroy();
                });            
                Ext.CacheComponents = [];   

                var cmdBar = Ext.getCmp('ext-command_bar');
                if (cmdBar)
                    cmdBar.destroy();
                // console.log(this.location.path());
                // this.menu.hideMenu(this.location.path());
            }
        });
    }

    ngOnInit(): void {
        this.title.setTitle(Config.AppName);
        this.view.title = Config.AppName;
        this.menu.name = this.location.path();
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
            c.updateLayout();
        });  
    }
}