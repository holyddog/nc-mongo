import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { TranslateService } from '../../services/shared/translate.service';
import { StorageService } from '../../services/shared/storage.service';

import { AuthenService } from '../../services/api/authen.service';
import { ViewService } from '../../services/shared/view.service';
import { AppService } from 'app/services/shared/app.service';
import { Config } from 'environments/environment';

declare var Ext: any;

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    host: { class: 'fill-dock d-flex v-center h-center flex-column' }
})
export class LoginComponent implements OnInit {
    config: any = Config;
    year: number = new Date().getFullYear();

    constructor(private app: AppService, private view: ViewService, public authenService: AuthenService) { }

    ngOnInit() {
        this.app.showLoading();
        this.authenService.verifyWorkspace()
            .then(() => {
                this.app.hideLoading();

                this.view.setForm({
                    id: 'login'
                });
            })
            .catch(data => {
                this.app.hideLoading();

                if (data && data.error) {
                    this.view.alert(data.error.message);
                }
                else {
                    this.view.alert('Unknown error.');
                }
            });
    }
}
