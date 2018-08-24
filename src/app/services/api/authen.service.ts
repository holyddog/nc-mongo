import 'rxjs/add/operator/toPromise';

import { Observable, Subscription } from 'rxjs/Rx';
import { Injectable } from '@angular/core';
import { URLSearchParams } from '@angular/http';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment, Config } from '../../../environments/environment';

import { StorageService } from '../shared/storage.service';

import { UserModel } from '../../models/user.model';
import { TranslateService } from '../shared/translate.service';

@Injectable()
export class AuthenService {
    user: UserModel = null;
    url: string = null;

    constructor(private http: HttpClient, private storage: StorageService, private translate: TranslateService) { }

    private authorizationHeader(): any {
        let token: string = this.storage.get('access_token');
        return { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) };
    }

    load(): void {
        this.user = this.storage.get('user');
    }

    logIn(username: string, password: string): Promise<any> {
        return this.http.post(Config.AuthenUrl + '/hq/nc/login?langid=2', {            
            user_name: username,
            password: password,
            wsp_id: 0
        }).toPromise();
    }

    logOut(): void {
        this.user = null;
        this.storage.remove('user');
        this.storage.remove('access_token');
    }
}
