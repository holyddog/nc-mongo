import { Component, OnInit } from '@angular/core';

import { AuthenService } from '../../services/api/authen.service';

declare var Ext: any;

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    showDialog: boolean = false;

    products: any[] = [{
        name: "Item 1",
        price: 200,
        pic: "http://localhost:3000/files/items/1/1.jpg"
    }, {
        name: "Eaque proident lacinia officia cupiditate rhoncus? Minus gravida",
        price: 2500,
        pic: "http://localhost:3000/files/items/2/1.jpg"
    }, {
        name: "Item 3",
        price: 300,
        pic: "http://localhost:3000/files/items/3/1.jpg"
    }, {
        name: "Item 4",
        price: 100,
        pic: "http://localhost:3000/files/items/4/1.jpg"
    }]

    constructor(private authenService: AuthenService) { }

    ngOnInit() {

    }

    openCateogory(): void {
        this.showDialog = true;
    }

    closeCategory(): void {
        this.showDialog = false;
    }
}
