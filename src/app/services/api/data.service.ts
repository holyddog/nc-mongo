import 'rxjs/add/operator/toPromise';

import { Observable, Subscription } from 'rxjs/Rx';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment, Config } from '../../../environments/environment';

import { StorageService } from '../shared/storage.service';

@Injectable()
export class DataService {

    constructor(private http: HttpClient, private storage: StorageService) { }

    private authorizationHeader(): any {
        let token: string = this.storage.get('access_token');
        return { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) };
    }

    findByKey(key: any, collection: string, pk: string): Promise<any> {
        return this.http.get(Config.ServiceUrl + '/data/' + key + '?collection=' + collection + '&pk=' + pk).toPromise();
    }

    uploadPicture(formData: FormData): Promise<any> {
        return this.http.post(Config.ServiceUrl + '/upload/pictures', formData)
            .toPromise();
    }
}
