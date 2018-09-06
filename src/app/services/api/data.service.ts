import 'rxjs/add/operator/toPromise';

import { Observable, Subscription } from 'rxjs/Rx';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { environment, Config } from '../../../environments/environment';

import { StorageService } from '../shared/storage.service';
import { AuthenService } from './authen.service';

@Injectable()
export class DataService {

    constructor(private http: HttpClient, private storage: StorageService, private authen: AuthenService) { }

    private authorizationHeader(): any {
        let token: string = this.storage.get('access_token');
        return { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) };
    }

    fetchData(config: any, params: any = {}): Promise<any> {
        let headers = new HttpHeaders();
        if (config.headers) {
            for (let i in config.headers) {
                headers = headers.set(i, config.headers[i]);
            }
        }
        if (config.authen) {
            headers = this.authorizationHeader().headers;
        }

        if (config.url) {
            let httpParams = new HttpParams();
            if (params) {
                for (let i in params) {
                    if (!config.method || (config.method && config.method.toUpperCase() == 'GET')) {
                        httpParams = httpParams.set(i, params[i]);
                    }
                }
            }

            if (config.method && config.method.toUpperCase() == 'POST') {
                return this.http.post(config.url, params, { headers: headers }).toPromise();
            }
            else {
                return this.http.get(config.url, { headers: headers, params: httpParams }).toPromise();
            }
        }
        else if (config.query) {
            var query = config.query;
            for (let i in params) {
                if (params[i] == "") {
                    params[i] = null;
                }
                query = query.replace('{{' + i + '}}', params[i]);
            }
            var url = '/query';
            if (config.single) {
                url += '?single=1'
            }
            return this.http.post(Config.ServiceUrl + url, { query: query }, { headers: headers }).toPromise();
        }
        else {
            return Promise.resolve();
        }
    }

    insertData(config: any): Promise<any> {
        config.method = "POST";
        return this.saveData(config);
    }

    updateData(config: any): Promise<any> {
        config.method = "PUT";
        return this.saveData(config);
    }

    saveData(config: any): Promise<any> {
        let headers = new HttpHeaders();
        if (config.headers) {
            for (let i in config.headers) {
                headers = headers.set(i, config.headers[i]);
            }
        }
        if (config.authen) {
            headers = this.authorizationHeader().headers;
        }

        if (config.type == 'api') {
            if (!config.method) {
                config.method = 'POST';
            }

            if (config.method.toUpperCase() == 'PUT') {
                return this.http.put(config.url, config.params, { headers: headers }).toPromise();
            }
            else {
                return this.http.post(config.url, config.params, { headers: headers }).toPromise();
            }
        }
        else if (config.type == 'mongo') {
            let data: any = {
                collection: config.collection,
                data: config.params
            };
            if (!config.method) {
                config.method = 'POST';
            }

            if (config.pk) {                
                data.pk = config.pk;
            }

            if (config.filter) {                
                data.filter = config.filter;
            }

            if (config.multi) {
                data.multi = config.multi;
            }

            if (config.method.toUpperCase() == 'PUT') {
                return this.http.put(Config.ServiceUrl + '/forms', data).toPromise();
            }
            else {
                return this.http.post(Config.ServiceUrl + '/forms', data).toPromise();
            }
        }
        else {
            return Promise.resolve();
        }

    }

    findByKey(key: any, collection: string, pk: string): Promise<any> {
        return this.http.get(Config.ServiceUrl + '/data/' + key + '?collection=' + collection + '&pk=' + pk).toPromise();
    }

    loadScript(id: string): Promise<any> {
        return this.http.get(Config.ServiceUrl + '/js/' + id, { responseType: 'text' }).toPromise();
    }

    uploadPicture(formData: FormData): Promise<any> {
        return this.http.post(Config.ServiceUrl + '/upload/pictures', formData)
            .toPromise();
    }

    uploadExcel(formData: FormData): Promise<any> {
        return this.http.post(Config.ServiceUrl + '/read-excel', formData)
            .toPromise();
    }

    uploadPictureAPI(config: any, formData: FormData): Promise<any> {
        let headers = new HttpHeaders();
        if (config.headers) {
            for (let i in config.headers) {
                headers = headers.set(i, config.headers[i]);
            }
        }
        if (config.authen) {
            headers = this.authorizationHeader().headers;
        }
        return this.http.post(config.url, formData, { headers: headers }).toPromise();
    }
}
