import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { TranslateService } from '../../services/shared/translate.service';
import { StorageService } from '../../services/shared/storage.service';

import { AuthenService } from '../../services/api/authen.service';
import { ViewService } from '../../services/shared/view.service';

declare var Ext: any;

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    host: { class: 'fill-dock d-flex v-center h-center' }
})
export class LoginComponent implements OnInit {
    loading: boolean = false;

    constructor(private router: Router, private view: ViewService, private route: ActivatedRoute, private translate: TranslateService, private storage: StorageService, private authenService: AuthenService) { }

    ngOnInit() {        
        this.view.setForm({
            id: 'login'
        });
    }

    logIn(): void {
        this.loading = true;
        setTimeout(() => {
            this.loading = false;

            this.authenService.user = {
                "id": 188,
                "email": "holyddog@gmail.com",
                "name": "Chanon Trising",
                "role": "admin",
                "outlet_id": 381,
                "outlet_name": "Lak Si"
            };
            this.storage.set('user', this.authenService.user);
            this.storage.set('access_token', "8GC=CDDDCAKBF4C");
            this.router.navigate(['/']);
        }, 0);
    }
}
