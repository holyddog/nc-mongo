import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { ViewService } from '../../services/shared/view.service';

declare var Ext: any;

@Component({
    selector: 'app-page',
    templateUrl: './page.component.html',
    styleUrls: ['./page.component.css']
})
export class PageComponent implements OnInit {
    queryParams: any;

    constructor(public view: ViewService, private route: ActivatedRoute) { }

    ngOnInit() {
        this.route.queryParams.forEach((params: Params) => {
            this.queryParams = params;
        });

        this.route.params.forEach((params: Params) => {
            if (params['id']) {
                this.view.setForm({
                    id: +params['id'],
                    params: this.queryParams
                });

                // setTimeout(() => {
                //     this.view.addDialog({
                //         id: 201
                //     });
                //     console.log(Ext.ComponentManager.count);

                //     // setTimeout(() => {
                //     //     this.view.closeForm();
                //     //     console.log(Ext.ComponentManager.count);
                //     // }, 3000);
                // }, 1000);
            }
            // [{
            //     id: 200,
            //     params: {
            //         id: 20,
            //         item_id: 200
            //     }
            // }, {
            //     id: 201,
            //     params: {
            //         id: 21,
            //         item_id: 201
            //     }
            // }]
        });
    }

}
