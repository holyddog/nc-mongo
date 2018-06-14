import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { TranslateService } from '../../services/shared/translate.service';
import { StorageService } from '../../services/shared/storage.service';

import { AuthenService } from '../../services/api/authen.service';

declare var Ext: any;

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    host: { class: 'fill-dock d-flex v-center h-center' }
})
export class LoginComponent implements OnInit {
    loading: boolean = false;

    constructor(private router: Router, private route: ActivatedRoute, private translate: TranslateService, private storage: StorageService, private authenService: AuthenService) { }

    ngOnInit() {
        Ext.create('Ext.button.Button', {
            text: 'Log In',
            scale: 'medium',
            handler: this.logIn.bind(this),
            renderTo: Ext.get('button_1')
        });
    }

    logIn(): void {
        this.loading = true;
        setTimeout(() => {
            this.loading = false;

            this.authenService.user = {
                "id": 1,
                "email": "holyddog@gmail.com",
                "name": "Chanon Trising",
                "role": "admin",
                "outlet_id": 381
            };
            this.storage.set('user', this.authenService.user);
            this.storage.set('access_token', "8GC=CDDDCAKBF4C");
            this.router.navigate(['/']);
        }, 0);
    }
}
