import 'rxjs/add/operator/toPromise';

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable()
export class MenuService {
    active: boolean = false;
    name: string;

    constructor(private router: Router) { }

    showMenu(): void {
        this.active = true;
    }

    hideMenu(name: string): void {
        this.active = false;

        if (name) {
            this.name = name;
        }
    }

    setName(name: string): void {
        if (this.name.indexOf(name) > -1) {
            this.name = "";
        }
        else {
            this.name = name;
        }
    }
}