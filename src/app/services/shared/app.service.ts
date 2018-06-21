import 'rxjs/add/operator/toPromise';

import { Injectable } from '@angular/core';

@Injectable()
export class AppService {
    loading: boolean = false;

    constructor() { }

    showLoading(): void {
        this.loading = true;
    }

    hideLoading(): void {
        this.loading = false;
    }
}