import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { FormService } from '../../services/api/form.service';
import { DataService } from '../../services/api/data.service';

import { Config } from '../../../environments/environment';
import { TranslateService } from '../../services/shared/translate.service';
import { AuthenService } from '../../services/api/authen.service';

declare var Ext: any;

@Component({
    selector: 'app-form',
    templateUrl: './form.component.html',
    styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {
    loading: boolean = false;
    combSeq: number = 1;
    formId: number;
    collection: string;
    pk: string;
    hasKey: boolean = false;
    queryParams: any = {};
    formData: any[] = null;
    remoteData: any[] = [];
    ds: any[] = [];
    dsData: any = {};
    center: any = ["@OUTLET_ID"];

    constructor(private router: Router, private route: ActivatedRoute, private authen: AuthenService, private translate: TranslateService, private formService: FormService, private dataService: DataService) {
    }

    ngOnInit() {
        this.route.queryParams.forEach((params: Params) => {
            this.queryParams = params;
        });

        this.route.params.forEach((params: Params) => {
            this.formId = params['id'];

            if (this.formId) {
                this.loading = true;
                this.formService.findById(this.formId)
                    .then(data => {
                        if (!data.error) {
                            let pk: any[] = data.pk;
                            if (pk) {
                                var checkCount = 0;
                                for (let i in this.queryParams) {
                                    if (pk.indexOf(i) > -1 && this.queryParams[i]) {
                                        checkCount++;
                                    }
                                }
                                if (checkCount == pk.length) {
                                    this.hasKey = true;
                                }
                            }

                            this.ds = data.ds;

                            this.prepare(data.data);
                            this.render()
                                .then(() => {
                                    return this.fetchDataSource();
                                })
                                .then(() => {
                                    return this.fetchRemoteData();
                                })
                                .then(() => {
                                    var ds = this.dsData;
                                    for (let c of Ext.CacheComponents) {
                                        if (c.mapping) {
                                            var value;
                                            var dsName = c.mapping.substring(0, c.mapping.indexOf('.'));
                                            if (ds[dsName]) {
                                                eval('value = ds.' + c.mapping + '');
    
                                                if (value) {
                                                    c.setValue(value);
                                                }
                                            }
                                        }
                                    }

                                    this.loading = false;
                                    if (data.tbar) {
                                        let tbar: any[] = [];
                                        let lang: string = this.translate._currentLang;
                                        for (let b of data.tbar) {
                                            if (!b.icon) {
                                                if (b.action.type == 'save') {
                                                    b.icon = 'fa-save';
                                                }
                                            }

                                            var button = Ext.create('Ext.Button', {
                                                text: (typeof b.text == 'object') ? b.text[lang] : this.translate.instant(b.text),
                                                scale: 'medium',
                                                cls: 'ext-secondary',
                                                iconCls: 'fas ' + b.icon + ' fa-1x',
                                                handler: function () {
                                                    if (this.action.type == 'link') {
                                                        this.angular.router.navigate([this.action.path]);
                                                    }
                                                    else if (this.action.type == 'save') {
                                                        this.setDisabled(true);
                                                        this.angular.save(this.action.data).then(resultData => {
                                                            this.setDisabled(false);
                                                            if (resultData && !this.angular.key) {
                                                                this.angular.router.navigate([this.angular.router.url, resultData.id]);
                                                            }
                                                        });
                                                    }
                                                }
                                            });
                                            button.action = b.action;
                                            button.angular = this;
                                            tbar.push(button);
                                        }
                                        this.setToolbarButtons(tbar);
                                    }

                                    if (this.hasKey) {
                                        setTimeout(() => {
                                            // this.dataService.findByKey(this.key, this.collection, this.pk)
                                            //     .then(resultData => {
                                            //         for (let d in resultData) {
                                            //             var cmp = Ext.ComponentQuery.query('[name=' + d + ']');
                                            //             if (cmp && cmp.length) {
                                            //                 var value = resultData[d];

                                            //                 if (cmp[0].dataMapping) {
                                            //                     let mappings: string[] = cmp[0].dataMapping.split('.');
                                            //                     if (mappings.length > 1) {
                                            //                         for (var i = 1; i < mappings.length; i++) {
                                            //                             value = value[mappings[i]];
                                            //                         }
                                            //                     }
                                            //                 }

                                            //                 cmp[0].setValue(value);
                                            //             }
                                            //         }
                                            //     });
                                        }, 0);
                                    }
                                });
                        }
                        else {
                            this.formData = null;
                            this.remoteData = [];
                            this.ds = [];
                            this.loading = false;
                        }
                    })
                    .catch(data => {
                        this.formData = null;
                        this.remoteData = [];
                        this.ds = [];
                        this.loading = false;
                    });
            }
        });
    }
    
    getCenterParam(name: string): any {        
        if (name == '@OUTLET_ID') {
            return this.authen.user.outlet_id;
        }
        return null;
    }

    fetchDataSource(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.ds && this.ds.length > 0) {
                let fetch = (index: number) => {
                    if (index < this.ds.length) {                        
                        var ds = this.ds[index];
                        var config = ds.api || ds.mongo || ds.sql;

                        var params = {};
                        var valid = true;
                        if (config.params) {
                            for (var p in config.params) {
                                var pValue = config.params[p];
                                if (pValue.toString().startsWith('@params')) {
                                    var name = pValue.replace('@params.', '');
                                    params[p] = this.queryParams[name];
                                }
                                else if (this.center.indexOf(pValue) > -1) {
                                    params[p] = this.getCenterParam(pValue);
                                }
                                else if (pValue.toString().startsWith('@')) {
                                    let value: any = "";
                                    var o = Ext.getCmp(Ext.query('[name="' + pValue.substring(1) + '"]')[0].dataset.componentid);
                                    if (o && (o.getValue() != undefined || o.getValue() != null)) {
                                        value = o.getValue();
                                    }
                                    params[p] = value;
                                }
                                else {
                                    params[p] = pValue;
                                }

                                if (valid) {
                                    if (!params[p] || (params[p] && params[p] == "") || params[p].toString().startsWith('@')) {
                                        valid = false;                                    
                                    }
                                }
                            }
                        }

                        if (valid) {
                            this.getData(config, params)
                                .then(resultData => {
                                    this.dsData[ds.name] = resultData;
                                    fetch(index + 1);
                                })
                                .catch(err => {
                                    fetch(index + 1);
                                });
                        }
                        else {
                            fetch(index + 1);
                        }
                    }
                    else {
                        this.ds = [];
                        resolve();
                    }
                };
                fetch(0);
            }
            else {
                this.ds = [];
                resolve();                
            }
        });
    }

    setToolbarButtons(buttons: any[]): void {
        Ext.create('Ext.Panel', {
            id: 'ext-command_bar',
            layout: {
                type: 'hbox',
                pack: 'end'
            },
            cls: 'ext-layout',
            border: false,
            renderTo: Ext.get('command_bar'),
            defaults: {
                margin: '0 0 0 10'
            },
            items: buttons
        });
    }

    save(fields: any[]): Promise<any> {
        this.loading = true;
        return new Promise<any>((resolve, reject) => {
            let data: any = [];
            var fetchRows = (rows: any[]) => {
                if (!rows) {
                    return;
                }

                for (let r of rows) {
                    if (r.cols) {
                        for (let c of r.cols) {
                            let name: string = c.config.name;
                            if (true && name) {
                                // if (c.save) {
                                if ((c.insertOnly != true && c.updateOnly != true) || (c.insertOnly == true && !this.hasKey) || (c.updateOnly == true && this.hasKey)) {
                                    var cmp = Ext.ComponentQuery.query('[name=' + name + ']');
                                    if (cmp && cmp.length) {
                                        var cmpValue = cmp[0].getValue();
                                        if (cmp[0].json && cmpValue) {
                                            cmpValue = JSON.parse(cmpValue);
                                        }
                                        let value: any = {
                                            field: name,
                                            value: cmpValue
                                        };
                                        if (['currency', 'date'].indexOf(c.type) > -1) {
                                            value.type = c.type;
                                        }
                                        if (c.sysDate == true) {
                                            value.sysDate = true;
                                        }
                                        data.push(value);
                                    }
                                }
                            }
                        }
                    }
                }
            };

            let fields: any[] = [];
            for (let i of this.formData) {
                if (i.container) {
                    for (let con of i.container) {
                        if (con.rows && con.rows.length > 0) {
                            fetchRows(con.rows);
                        }
                        else if (con.fieldset) {
                            fetchRows(con.fieldset.rows);
                        }
                        else if (con.tab && con.tab.items && con.tab.items.length > 0) {
                            for (let t of con.tab.items) {
                                if (t.container) {
                                    for (let tcon of t.container) {
                                        if (tcon.rows && tcon.rows.length) {
                                            fetchRows(tcon.rows);
                                        }
                                        else if (tcon.fieldset) {
                                            fetchRows(tcon.fieldset.rows);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // let data: any = [];
            // for (let f of fields) {
            //     let name: string = f.form;
            //     let field: string = (f.db)? f.db: f.form;
            //     var cmp = Ext.ComponentQuery.query('[name=' + name + ']');
            //     if (cmp && cmp.length) {
            //         let value: any = {
            //             field: field,
            //             value: cmp[0].getValue()
            //         };
            //         if (f.type == 'currency') {
            //             value.type = f.type;
            //         }
            //         data.push(value);
            //     }
            // }

            console.log(data);
            this.loading = false;
            return Promise.resolve();

            var savePromise;
            // if (this.hasKey) {
            //     var filter = {};
            //     filter[this.pk] = +this.hasKey;
            //     savePromise = this.formService.update({
            //         collection: this.collection,
            //         filter: filter,
            //         data: data
            //     });
            // }
            // else {
            //     savePromise = this.formService.insert({
            //         collection: this.collection,
            //         pk: this.pk,
            //         data: data
            //     });
            // }

            savePromise.then(resultData => {
                this.loading = false;
                Ext.MessageBox.alert(this.translate.instant('alert'), this.translate.instant('save_success'), () => {
                    resolve(resultData);
                });
            });
        });
    }

    prepare(data: any[]): void {
        var fetchSeqs = (rows: any[]) => {
            if (!rows) {
                return;
            }

            for (let r of rows) {
                if (r.cols) {
                    for (let c of r.cols) {
                        if (!c.config) {
                            c.config = {};
                        }
                        if (c.filter) {
                            if (c.type == 'button') {
                                // c.cls = 'text-center';
                                c.config.text = this.translate.instant('search');
                            }

                            if (!c.config.ariaAttributes) {
                                c.config.ariaAttributes = {};
                            }
                            Object.assign(c.config.ariaAttributes, {
                                filter: c.filter
                            });
                        }
                        c.id = this.formId + '_' + ('0000' + (this.combSeq++)).slice(-4);
                    }
                }
            }
        };

        let fields: any[] = [];
        for (let i of data) {
            if (i.container) {
                for (let con of i.container) {
                    if (con.rows && con.rows.length > 0) {
                        fetchSeqs(con.rows);
                    }
                    else if (con.fieldset) {
                        fetchSeqs(con.fieldset.rows);
                    }
                    else if (con.tab && con.tab.items && con.tab.items.length > 0) {
                        if (!con.tab.tabIndex) {
                            con.tab.tabIndex = 0;
                        }
                        con.tab.tabChange = (index: number) => {
                            con.tab.tabIndex = index;
                        }

                        for (let t of con.tab.items) {
                            if (t.container) {
                                for (let tcon of t.container) {
                                    if (tcon.rows && tcon.rows.length) {
                                        fetchSeqs(tcon.rows);
                                    }
                                    else if (tcon.fieldset) {
                                        fetchSeqs(tcon.fieldset.rows);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        this.formData = data;
    }

    render(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            setTimeout(() => {
                if (!this.formData)
                    return;

                var fetchRows = (rows: any[]) => {
                    if (!rows) {
                        return;
                    }

                    for (let r of rows) {
                        if (r.cols) {
                            for (let c of r.cols) {
                                if (!c.config) {
                                    c.config = {};
                                }

                                let config: any = c.config;
                                config.renderTo = Ext.get(c.id);
                                config.labelWidth = 140;

                                let cmp: any = this.component(c);

                                if (cmp.xtype) {
                                    cmp.data = {};

                                    if (c.filter && c.find) {
                                        cmp.data.find = c.find;
                                    }
                                    if (c.paging && c.paging.find) {
                                        cmp.data.find = c.paging.find;
                                    }
                                    if (c.json == true) {
                                        cmp.json = true;
                                    }
                                    if (c.mapping) {
                                        cmp.mapping = c.mapping;
                                    }

                                    if ((cmp.xtype == 'combo' || cmp.xtype == 'grid') && c.data) {
                                        if (c.links) {
                                            cmp.links = c.links;
                                        }

                                        if (c.data.api) {
                                            cmp.api = c.data.api;
                                            this.remoteData.push(cmp.id);
                                        }
                                        else if (c.data.mongo) {
                                            cmp.mongo = c.data.mongo;
                                            this.remoteData.push(cmp.id);
                                        }
                                    }

                                    if (c.mapping) {
                                        cmp.dataMapping = c.mapping;
                                    }
                                    Ext.CacheComponents.push(cmp);
                                }
                            }
                        }
                    }
                };

                let fields: any[] = [];
                for (let i of this.formData) {
                    if (i.container) {
                        for (let con of i.container) {
                            if (con.rows && con.rows.length > 0) {
                                fetchRows(con.rows);
                            }
                            else if (con.fieldset) {
                                fetchRows(con.fieldset.rows);
                            }
                            else if (con.tab && con.tab.items && con.tab.items.length > 0) {
                                for (let t of con.tab.items) {
                                    if (t.container) {
                                        for (let tcon of t.container) {
                                            if (tcon.rows && tcon.rows.length) {
                                                fetchRows(tcon.rows);
                                            }
                                            else if (tcon.fieldset) {
                                                fetchRows(tcon.fieldset.rows);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                resolve();
            }, 0);
        });
    }

    getData(config: any, params: any): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.dataService.fetchData(config, params)
                .then(data => {
                    var resultData = data;
                    if (config.mapping) {
                        let mappings: string[] = config.mapping.split('.');
                        if (mappings.length > 0) {
                            for (var i = 0; i < mappings.length; i++) {
                                resultData = resultData[mappings[i]];
                            }
                        }
                    }
                    resolve(resultData);
                })
                .catch(err => {
                    resolve();
                });
        });
    }

    fetchRemoteData(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.remoteData.length > 0) {
                let fetch = (index: number) => {
                    if (index < this.remoteData.length) {
                        let remoteCmp: any = Ext.getCmp(this.remoteData[index]);                        
                        var config = remoteCmp.api || remoteCmp.mongo || remoteCmp.sql;

                        var params = {};
                        var valid = true;
                        if (config.params) {
                            var ds = this.dsData;
                            for (var p in config.params) {
                                var pValue = config.params[p];                                
                                if (this.center.indexOf(pValue) > -1) {
                                    params[p] = this.getCenterParam(pValue);
                                }
                                else if (pValue.toString().startsWith('@')) {
                                    let value: any = "";
                                    var c = Ext.query('[name="' + pValue.substring(1) + '"]');
                                    if (c.length) {
                                        var o = Ext.getCmp(c[0].dataset.componentid);
                                        if (o.mapping) {
                                            var dsName = o.mapping.substring(0, o.mapping.indexOf('.'));
                                            if (ds[dsName]) {
                                                eval('value = ds.' + o.mapping + '');
                                            }
                                        }
                                        params[p] = value;
                                    }
                                    else {
                                        params[p] = pValue;
                                    }
                                }
                                else {
                                    params[p] = pValue;
                                }

                                if (valid) {
                                    if (!params[p] || (params[p] && params[p] == "") || params[p].toString().startsWith('@')) {
                                        valid = false;                                    
                                    }
                                }
                            }
                        }

                        if (valid) {
                            this.getData(config, params)
                                .then(resultData => {
                                    remoteCmp.getStore().loadData(resultData);
                                    fetch(index + 1);
                                })
                                .catch(err => {
                                    fetch(index + 1);
                                });
                        }
                        else {
                            fetch(index + 1);
                        }
                    }
                    else {
                        this.remoteData = [];
                        resolve();
                    }
                };
                fetch(0);
            }
            else {
                this.remoteData = [];
                resolve();
            }
        });
    }

    grid(c: any, config: any): any {
        let columns: any[] = [];
        let fields: any[] = [];
        let docks: any[] = [];

        if (c.type == 'grid') {
            for (let col of c.columns) {
                if (col.type == 'action') {
                    col.config.width = 40 * col.config.items.length;
                    col.config.align = 'center';
                    columns.push(Ext.create('Ext.grid.column.Action', col.config));
                }
                else {
                    if (col.mapping) {
                        col.config.ariaAttributes = {
                            mapping: col.mapping
                        };
                        col.config.renderer = function (value, metaData, record, rowIndex, colIndex) {
                            if (value) {
                                var column = this.getColumns()[colIndex];
                                var mappings = column.ariaAttributes.mapping.split('.');
                                if (mappings.length > 1) {
                                    for (var i = 1; i < mappings.length; i++) {
                                        value = value[mappings[i]];
                                    }
                                }
                            }
                            return value;
                        }
                    }
                    columns.push(Ext.create('Ext.grid.column.Column', col.config));
                }

                if (col.config.dataIndex) {
                    fields.push(col.config.dataIndex);
                }
            }
        }
        else if (c.type == 'list') {
            config.cls = 'ext-list';
            config.listeners = {
                cellclick: function (o, td, cellIndex, record, tr, rowIndex, e) {
                    var link;
                    if (e.target.tagName == 'A') {
                        link = e.target;
                    }
                    else if (e.target.tagName == 'I') {
                        link = e.target.parentElement;
                    }

                    if (link && link.getAttribute('routerLink')) {
                        var linkPath = link.getAttribute('routerLink');
                        var query = link.getAttribute('queryParams');
                        var queryParams = {}
                        if (query) {
                            eval('queryParams = ' + query);
                        }
                        o.ownerGrid.angular.router.navigate([linkPath], { queryParams: queryParams });
                    }
                }
            };
            var column = Ext.create('Ext.grid.column.Column', {
                cellWrap: true,
                flex: 1,
                dataIndex: '_data',
                renderer: function (value, metaData, record) {
                    metaData.innerCls = 'p-0';
                    var angular = this.ownerGrid.angular;
                    var template = this.ownerGrid.tpl;
                    if (typeof this.ownerGrid.tpl == 'object') {
                        var tplElement = document.createElement('div');
                        var fetch = function (it, parent) {
                            var template = document.createElement('div');
                            if (it.type == 'image') {
                                it.cls = 'width-100 width-sm-s d-flex h-center';
                            }
                            template.setAttribute('class', it.cls + ' p-1');
                            parent.appendChild(template);
                            if (it.dataIndex) {
                                if (it.type == 'image') {
                                    //<img onload=\"setTimeout(() => {window.dispatchEvent(new Event('resize'));window.dispatchEvent(new Event('resize'));},0)\" class=\"mw-100\" style=\"max-height:120px\" src=\"{['http://27.254.138.120:3203/files/'+values.pic]}\"
                                    var img = document.createElement('img');
                                    img.setAttribute('class', 'mw-100');
                                    img.setAttribute('style', 'max-height:120px');
                                    var imgPath = ('/' + record.get(it.dataIndex).replace('//', '/'));
                                    img.setAttribute('src', Config.ImageUrl + imgPath);
                                    template.appendChild(img);
                                }
                                else {
                                    var rValue = record.get(it.dataIndex);
                                    if (it.type == 'datetime') {
                                        rValue = Ext.Date.format(new Date(rValue), 'd/m/Y H:i');
                                    }
                                    template.innerHTML = rValue;
                                }
                            }
                            else if (it.tpl) {
                                template.innerHTML = it.tpl;
                            }
                            else if (it.items) {
                                for (var i = 0; i < it.items.length; i++) {
                                    fetch(it.items[i], template);
                                }
                            }
                        };
                        fetch(this.ownerGrid.tpl, tplElement);
                        tplElement.children[0].classList.add('p-1');
                        template = tplElement.innerHTML;
                    }
                    // `<div class="d-sm-flex p-2">
                    //     <div class="mr-0 mr-sm-3 width-100 width-sm-s d-flex h-center"><img onload="setTimeout(() => {window.dispatchEvent(new Event('resize'));window.dispatchEvent(new Event('resize'));},0)" class="mw-100" style="max-height:120px" src="{['http://27.254.138.120:3203/files/'+values.pic]}" /></div>
                    //     <div class="flex mt-2 mt-sm-0">
                    //         <div class="m-text mb-2"><a href="/sub-form/100003">{item_name}</a></div>
                    //         <div class="d-flex">
                    //             <div class="flex">x {cap_amt}</div>
                    //             <div class="flex">{price}</div>
                    //             <div class="flex">{[this.toDateTime(values.create_date)]}</div>
                    //         </div>
                    //     </div>
                    //     <div class="mt-2 mt-sm-0 ml-0 ml-sm-3 text-right"><a routerLink="/form/101" queryParams="{ id: {item_id} }"><i class="fas fa-edit fa-1x mr-2"></i>{[this.translate('edit')]}</a></div>
                    // </div>`;
                    var tpl = new Ext.XTemplate(
                        template,
                        {
                            translate: function (text) {
                                return angular.translate.instant(text);
                            },
                            toFileUrl: function (path) { return Config.FileUrl + path; },
                            toDate: function (date) {
                                return Ext.Date.format(new Date(date), 'd/m/Y');
                            },
                            toDateTime: function (date) {
                                return Ext.Date.format(new Date(date), 'd/m/Y H:i');
                            },
                            getLink: function (formId, key) {
                                return '/sub-form/' + formId + '?id=' + key;
                            }
                        }
                    );
                    return tpl.apply(record.data);
                }
            });
            columns.push(column);
        }

        let storeConfig: any = {
            fields: fields
        };
        if (c.data && c.data.length > 0) {
            storeConfig.data = c.data;
        }

        let store;
        if (c.paging && c.type == 'grid') {
            let proxy: any = {
                type: 'ajax',
                url: Config.ServiceUrl + '/data?page=1&size=' + Config.PageSize,
                paramsAsJson: true,
                actionMethods: {
                    create: 'POST',
                    read: 'POST',
                    update: 'POST',
                    destroy: 'POST'
                },
                extraParams: {
                    collection: c.paging.collection,
                    find: c.paging.find
                },
                reader: {
                    type: 'json',
                    rootProperty: 'data',
                    totalProperty: 'total'
                }
            };

            // if (options.authen) {
            //     proxy.headers = { 'Authorization': 'Bearer ' + this.storage.get('access_token') };
            // }

            store = Ext.create('Ext.data.JsonStore', {
                pageSize: Config.PageSize,
                autoLoad: true,
                proxy: proxy,
                // ref: refValue,
                listeners: {
                    load: function () {
                        setTimeout(() => {
                            window.dispatchEvent(new Event('resize'));
                        }, 0);
                    }
                }
            });
            docks.push({
                xtype: 'pagingtoolbar',
                cls: 'ext-paging',
                store: store,
                dock: 'bottom',
                displayInfo: true,
                beforePageText: '',
                afterPageText: '/ {0}',
                displayMsg: this.translate.instant('total_page_display'),
                emptyMsg: this.translate.instant('total_page_empty'),
                listeners: {
                    beforechange: function (self, page) {
                        self.ownerCt.getStore().getProxy().setUrl(Config.ServiceUrl + '/data?page=' + page + '&size=10');
                    }
                }
            });
        }
        else if (c.paging && c.type == 'list') {
            let proxy: any = {
                type: 'ajax',
                url: Config.ServiceUrl + '/data?page=1&size=' + Config.PageSize,
                paramsAsJson: true,
                actionMethods: {
                    create: 'POST',
                    read: 'POST',
                    update: 'POST',
                    destroy: 'POST'
                },
                extraParams: {
                    collection: c.paging.collection,
                    find: c.paging.find
                },
                reader: {
                    type: 'json',
                    rootProperty: 'data',
                    totalProperty: 'total'
                }
            };

            store = Ext.create('Ext.data.JsonStore', {
                pageSize: Config.PageSize,
                autoLoad: true,
                proxy: proxy
            });
            store.currentPage = 1;

            config.buttonAlign = 'center';
            config.buttons = [
                {
                    xtype: 'button',
                    text: this.translate.instant('load_more'),
                    margin: '10 0 0',
                    width: '100%',
                    scale: 'medium',
                    cls: 'ext-grey',
                    iconCls: 'fas fa-arrow-down fa-1x',
                    store: store,
                    handler: function () {
                        this.store.currentPage++;
                        this.store.getProxy().setUrl(Config.ServiceUrl + '/data?page=' + (this.store.currentPage) + '&size=' + Config.PageSize);
                        this.store.load({ addRecords: true });
                    }
                }
            ];
        }
        else {
            store = Ext.create('Ext.data.Store', storeConfig);
        }

        if (c.name) {
            Object.assign(config.ariaAttributes, {
                name: c.name
            });
        }

        let data: any = {
            minHeight: (c.type == 'grid') ? 300 : 170,
            sortableColumns: false,
            enableColumnHide: false,
            enableColumnMove: false,
            enableColumnResize: false,
            hideHeaders: c.type == 'list',
            columns: columns,
            dockedItems: docks,
            store: store
        };
        return Ext.create('Ext.grid.Panel', Object.assign(data, config));
    }

    createPicBox(imagePath): any {
        return Ext.create('Ext.Component', {
            width: 118,
            height: 118,
            cls: 'pic-box d-flex v-center h-center',
            html: `<img src="${imagePath}" /><i class="fas fa-times fa-1x"></i>`,
            autoEl: {
                tag: 'div'
            },
            listeners: {
                render: function (c) {
                    c.getEl().dom.querySelector('i').addEventListener('click', function (e) {
                        var owner = c.ownerLayout.owner;
                        owner.remove(c);
                        owner.setRefValue();
                    });
                }
            }
        });
    }

    component(c: any): any {
        var clearTrigger = (config) => {
            Object.assign(config, {
                triggers: {
                    clear: {
                        cls: 'x-form-clear-trigger',
                        handler: function () {
                            this.reset();
                        }
                    }
                }
            })
        };

        let config: any = c.config;
        if (!config.ariaAttributes) {
            config.ariaAttributes = {};
        }

        switch (c.type) {
            case 'text': {
                return Ext.create('Ext.form.field.Text', config);
                // break;
            }
            case 'date': {
                config.format = 'd/m/Y';
                config.fieldStyle = 'text-align: center;';
                clearTrigger(config);
                return Ext.create('Ext.form.field.Date', config);
                // break;
            }
            case 'combobox': {
                let data: any = {
                    // forceSelection: true,
                    editable: false,
                    triggerAction: 'all',
                    queryMode: 'local'
                };
                if (c.data) {
                    data.store = Ext.create('Ext.data.Store', {
                        data: c.data
                    });
                }
                clearTrigger(config);

                // if (c.data && c.data.api.links) {

                // }
                config.listeners = {
                    change: (combo, value) => {
                        if (combo.links && this.loading == false) {
                            for (var i = 0; i < combo.links.length; i++) {
                                var linkCombo = Ext.getCmp(Ext.query('[name="' + combo.links[i] + '"]')[0].dataset.componentid);
                                if (linkCombo) {
                                    linkCombo.setValue(null);
                                    linkCombo.getStore().loadData([]);

                                    var dataConfig = linkCombo.api || linkCombo.mongo || linkCombo.sql;
                                    var params = {};
                                    if (dataConfig.params) {
                                        for (var p in dataConfig.params) {
                                            var pValue = dataConfig.params[p];
                                            if (pValue.toString().startsWith('@')) {
                                                let value: any = "";
                                                var c = Ext.query('[name="' + pValue.substring(1) + '"]');
                                                if (c.length) {
                                                    var o = Ext.getCmp(c[0].dataset.componentid);
                                                    if (o && (o.getValue() != undefined || o.getValue() != null)) {
                                                        value = o.getValue();
                                                    }
                                                }
                                                params[p] = value;
                                            }
                                            else {
                                                params[p] = pValue;
                                            }
                                        }
                                    }

                                    this.getData(dataConfig, params)
                                        .then(resultData => {
                                            if (resultData)
                                                linkCombo.getStore().loadData(resultData);
                                        });
                                }
                            }
                        }
                    }
                }

                return Ext.create('Ext.form.field.ComboBox', Object.assign(data, config));
                // break;
            }
            case 'checkbox': {
                return Ext.create('Ext.form.field.Checkbox', config);
                // break;
            }
            case 'checkboxgroup': {
                return Ext.create('Ext.form.FieldContainer', config);
                // break;
            }
            case 'radiogroup': {
                return Ext.create('Ext.form.FieldContainer', config);
                // break;
            }
            case 'textarea': {
                config.grow = true;
                return Ext.create('Ext.form.field.TextArea', config);
                // break;
            }
            case 'number': {
                config.hideTrigger = true;
                config.keyNavEnabled = false;
                config.mouseWheelEnabled = false;
                config.fieldStyle = 'text-align: right;';
                config.allowThousandSeparator = false;
                return Ext.create('Ext.form.field.Number', config);
                // break;
            }
            case 'currency': {
                config.hideTrigger = true;
                config.keyNavEnabled = false;
                config.mouseWheelEnabled = false;
                config.fieldStyle = 'text-align: right;';
                config.allowThousandSeparator = true;
                return Ext.create('Ext.form.field.Number', config);
                // break;
            }
            case 'display': {
                return Ext.create('Ext.form.field.Display', config);
                // break;
            }
            case 'button': {
                config.scale = 'medium';
                config.cls = 'ext-primary';

                if (c.filter) {
                    config.handler = function () {
                        var filterRef = this.ariaAttributes.filter;
                        var grid = Ext.getCmp(Ext.query('[name="' + filterRef + '"]')[0].id);
                        var store = grid.getStore();//grid.dockedItems.get(1).getStore();

                        var find;
                        eval('find = ' + grid.data.find);

                        var filterParams;
                        Ext.query('[filter="' + filterRef + '"]').forEach(e => {
                            let cmp: any = Ext.getCmp(e.dataset.componentid);
                            if (cmp && cmp.name) {
                                let value: any = cmp.getValue();
                                if (value) {
                                    if (!filterParams) {
                                        filterParams = find;
                                    }

                                    let cmpFind: string = cmp.data.find;
                                    if (!cmpFind) {
                                        cmpFind = "{{value}}";
                                    }
                                    cmpFind = cmpFind.replace('{{value}}', value);
                                    let exp: string = `{ ${cmp.name}: ${cmpFind} }`;
                                    var query;
                                    eval('query = ' + exp);

                                    Object.assign(filterParams, query);
                                }
                            }
                        });

                        //Object.assign(find, { qty: { $gt: 50 } })
                        if (filterParams) {
                            store.proxy.extraParams.find = JSON.stringify(filterParams);
                        }
                        else {
                            store.proxy.extraParams.find = JSON.stringify(find);
                        }
                        store.proxy.setUrl(Config.ServiceUrl + '/data?page=1&size=10');

                        store.loadPage(1);
                        store.load();
                    };
                    var renderTo = config.renderTo;
                    config.renderTo = '';
                    config.iconCls = 'fas fa-search fa-1x';
                    return Ext.create('Ext.form.FieldContainer', {
                        renderTo: renderTo,
                        cls: 'd-flex h-center',
                        defaults: {
                            margin: '0 5 0 5'
                        },
                        items: [
                            Ext.create('Ext.Button', config),
                            Ext.create('Ext.Button', {
                                scale: 'medium',
                                cls: 'ext-grey',
                                iconCls: 'fas fa-redo-alt fa-1x',
                                ariaAttributes: config.ariaAttributes,
                                text: this.translate.instant('clear'),
                                handler: function () {
                                    var filterRef = this.ariaAttributes.filter;
                                    Ext.query('[filter="' + filterRef + '"]').forEach(e => {
                                        let cmp: any = Ext.getCmp(e.dataset.componentid);
                                        if (cmp && cmp.name) {
                                            cmp.setValue(null);
                                        }
                                    });
                                }
                            })
                        ]
                    });
                }
                else {
                    return Ext.create('Ext.Button', config);
                }
                // break;
            }
            case 'file': {
                var fileUpload = Ext.create('Ext.form.field.File', {
                    cls: 'ext-file-upload',
                    buttonConfig: {
                        text: this.translate.instant('select_photo'),
                        cls: 'ext-grey',
                        scale: 'medium'
                    },
                    msgTarget: 'side',
                    buttonOnly: true,
                    listeners: {
                        render: function (s) {
                            s.fileInputEl.set({ multiple: 'multiple' });
                        },
                        change: function (s) {
                            var files = s.fileInputEl.dom.files;
                            var data = new FormData();

                            Ext.each(files, function (f) {
                                data.append('pictures', f);
                            });

                            if (!s.api) {
                                this.angular.dataService.uploadPicture(data)
                                    .then(data => {
                                        for (let i of data) {
                                            let picBox: any = this.createPicBox(Config.FileUrl + i);
                                            picBox.value = i;
                                            s.ownerCt.items.add(picBox);
                                        }
                                        s.ownerCt.updateLayout();
                                        s.ownerCt.setRefValue();
                                    });
                            }
                            else {
                                this.angular.dataService.uploadPictureAPI(s.api, data)
                                    .then(data => {
                                        var value = data;
                                        if (s.api.mapping) {
                                            let mappings: string[] = s.api.mapping.split('.');
                                            if (mappings.length > 0) {
                                                for (var i = 0; i < mappings.length; i++) {
                                                    value = value[mappings[i]];
                                                }
                                            }
                                        }

                                        var imagePath = s.imagePath;
                                        var dataValue;
                                        if (s.objectValue) {
                                            dataValue = Object.assign({}, s.objectValue);
                                            for (let i in dataValue) {
                                                dataValue[i] = value[dataValue[i].substring(1)];
                                                imagePath = imagePath.replace('{{' + i + '}}', dataValue[i]);
                                            }
                                        }

                                        let picBox: any = s.angular.createPicBox(imagePath);
                                        picBox.value = dataValue;
                                        s.ownerCt.items.add(picBox);
                                        s.ownerCt.updateLayout();
                                        s.ownerCt.setRefValue();
                                    });
                            }
                        }
                    }
                });
                fileUpload.angular = this;
                if (c.api) {
                    fileUpload.api = c.api;
                }
                if (c.value) {
                    fileUpload.objectValue = c.value;
                }
                if (c.imagePath) {
                    fileUpload.imagePath = c.imagePath;
                }
                config.items = [
                    fileUpload
                ];
                var cmp = Ext.create('Ext.form.FieldContainer', config);
                cmp.uploadField = fileUpload;
                cmp.getValue = function () {
                    let values: string[] = null;
                    for (var i = 1; i < this.items.length; i++) {
                        if (!values) {
                            values = [];
                        }
                        values.push(this.items.get(i).value);
                    }
                    return values;
                };
                cmp.setValue = function (values) {
                    var s = this.uploadField;
                    for (let pic of values) {
                        // var imagePath = s.imagePath;
                        // var dataValue;
                        // if (s.objectValue) {
                        //     dataValue = Object.assign({}, s.objectValue);
                        //     for (let d in dataValue) {
                        //         dataValue[d] = pic[dataValue[d].substring(1)];
                        //         imagePath = imagePath.replace('{{' + d + '}}', dataValue[d]);
                        //         console.log(d, dataValue);
                        //     }
                        // }
                        var imagePath = s.imagePath;
                        var dataValue = Object.assign({}, s.objectValue);
                        for (let d in dataValue) {
                            dataValue[d] = pic[d];
                            imagePath = imagePath.replace('{{' + d + '}}', dataValue[d]);
                        }
                        var picBox = s.angular.createPicBox(imagePath);
                        picBox.value = dataValue;
                        this.items.add(picBox);
                    }
                    this.updateLayout();
                    this.setRefValue();
                }
                if (c.ref) {
                    cmp.ref = c.ref;
                    cmp.setRefValue = function () {
                        var cmp = Ext.ComponentQuery.query('[name=' + this.ref + ']');
                        if (cmp && cmp.length > 0) {
                            if (this.items.length > 1) {
                                var value = this.items.get(1).value;
                                if (cmp[0].json) {
                                    value = JSON.stringify(value);
                                }
                                cmp[0].setValue(value);
                            }
                            else {
                                cmp[0].setValue(null);
                            }
                        }
                    };
                }
                return cmp;
            }
            case 'grid': {
                return this.grid(c, config);
                // break;
            }
            case 'list': {
                var cmp = this.grid(c, config);
                cmp.tpl = c.tpl;
                cmp.angular = this;

                cmp.getStore().grid = cmp;
                cmp.getStore().addListener('load', function (store, data) {
                    var docked = this.grid.getDockedComponent(1);
                    if (data.length < Config.PageSize) {
                        docked.hide();
                    }
                    else {
                        docked.show();
                    }
                    setTimeout(() => {
                        window.dispatchEvent(new Event('resize'));
                    }, 0);
                });
                return cmp;
                // break;
            }
            case 'hidden': {
                return Ext.create('Ext.form.field.Hidden', config);
                // break;
            }
        }
    }
}