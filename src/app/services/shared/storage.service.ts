import 'rxjs/add/operator/toPromise';

import { Inject, Injectable } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { Config } from '../../../environments/environment';

@Injectable()
export class StorageService {

    set(key: string, data: any): void {
        key = Config.StoragePrefix + key;
        let value: any = data;
        if (typeof data == 'object') {
            value = JSON.stringify(data);
        }
        localStorage.setItem(key, value);
    }

    get(key: string) {
        key = Config.StoragePrefix + key;
        let data = localStorage.getItem(key);
        if (data) {
            let value: any = data;
            try {
                value = JSON.parse(data);
            }
            catch (e) {
            }
            return value;
        }
        return null;
    }

    remove(key: string) {
        key = Config.StoragePrefix + key;
        localStorage.removeItem(key);
    }
}