import { Component, OnInit } from '@angular/core';

import { AuthenService } from '../../services/api/authen.service';

declare var Ext: any;

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

    constructor(private authenService: AuthenService) { }

    ngOnInit() {

    }
}
