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

    hideMenu(name: string = null): void {
        this.active = false;

        if (name) {
            this.name = name;
        }
    }

    setName(name: string): void {
        if (!name) {
            name = "/x";
        }
        name = name.substring(name.lastIndexOf('/') + 1);
        if (this.name == name) {
            this.name = "";
        }
        else {
            this.name = name;
        }
    }

    match(name: string, link: string): boolean {
        if (!link) {
            link = "/x";
        }
        return name == link.substring(link.lastIndexOf('/') + 1)
    }
}