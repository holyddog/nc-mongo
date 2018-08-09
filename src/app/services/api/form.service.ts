import 'rxjs/add/operator/toPromise';

import { Observable, Subscription } from 'rxjs/Rx';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment, Config } from '../../../environments/environment';

import { StorageService } from '../shared/storage.service';

@Injectable()
export class FormService {

    constructor(private http: HttpClient, private storage: StorageService) { }

    private authorizationHeader(): any {
        let token: string = this.storage.get('access_token');
        return { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) };
    }

    findById(id: string): Promise<any> {
        return this.http.get(Config.ServiceUrl + '/forms/' + id).toPromise();
    }

    findMenu(): Promise<any> {
        return this.http.get(Config.ServiceUrl + '/menu').toPromise();
    }

    insert(data: any): Promise<any> {
        return this.http.post(Config.ServiceUrl + '/forms', data).toPromise();
    }

    update(data: any): Promise<any> {
        return this.http.put(Config.ServiceUrl + '/forms', data).toPromise();
    }
}
