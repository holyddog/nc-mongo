import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute, Params, NavigationEnd } from '@angular/router';

import { FormService } from '../../services/api/form.service';
import { DataService } from '../../services/api/data.service';

import { Config } from '../../../environments/environment';
import { TranslateService } from '../../services/shared/translate.service';
import { AuthenService } from '../../services/api/authen.service';
import { AppService } from '../../services/shared/app.service';
import { ViewService } from '../../services/shared/view.service';
import { StorageService } from '../../services/shared/storage.service';

declare var Ext: any;

@Component({
    selector: 'app-form',
    templateUrl: './form.component.html',
    styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {
    @Input() formId: string;
    @Input() queryParams: any;
    @Input() isDialog: boolean;
    @Input() size: any;
    @Input() parent: any;

    title: string;
    combSeq: number = 1;
    collection: string;
    pk: string;
    hasKey: boolean = false;
    hasToolbar: boolean = false;
    viewMode: boolean = false;
    formData: any[] = null;
    remoteData: any[] = [];
    saveData: any[] = [];
    resultData: any[] = [];
    ds: any[] = [];
    dsData: any = {};
    bodyHeight: number;
    formWidth: string = "100%";

    reserveKeys: string[] = ["@DATE"];
    formModes: string[] = ["add", "edit", "view"];

    hasScript: boolean = false;
    onLoad: any;
    onBeforeSave: any;
    onAfterSave: any;
    navigationSubscription;

    constructor(private router: Router, private route: ActivatedRoute, private storage: StorageService, private authen: AuthenService, private app: AppService, private translate: TranslateService, private view: ViewService, private formService: FormService, private dataService: DataService) {
        // router.events.subscribe((val) => {
        //     if (val instanceof NavigationEnd) {
        //         alert('form');
        //     }
        // });

        this.navigationSubscription = this.router.events.subscribe((e: any) => {
            // If it is a NavigationEnd event re-initalise the component
            if (e instanceof NavigationEnd) {
                this.route.queryParams.subscribe(params => {
                    // this.queryParams = params;
                    // this.loadForm();
                });
            }
        });
    }

    ngOnInit() {
        if (this.size == "sm") {
            this.formWidth = "480px";
        }
        else if (this.size == "md") {
            this.formWidth = "768px";
        }
        this.bodyHeight = window.innerHeight - 128 - 30;

        // setTimeout(() => {
        //     //item_id=327
        //     this.router.navigate(["/form/sample_form"], {
        //         queryParams: { item_id: 327 }
        //     });
        // }, 3000);

        // this.dataService.loadScript(this.formId).then(data => {
        //     var angular = this;
        //     eval(data);
        // });

        this.loadForm();
    }

    loadForm(): void {
        if (this.formId) {
            this.view.loading = true;
            this.formService.findById(this.formId)
                .then(data => {
                    if (!data.error) {
                        if (data.script == true) {
                            this.hasScript = true;

                            return new Promise<any>((resolve, reject) => {
                                this.dataService.loadScript(this.formId)
                                    .then(scriptData => {
                                        var a = this;
                                        eval(scriptData);
                                        resolve(data);
                                    })
                                    .catch(() => {
                                        resolve(data);
                                    });
                            });
                        }
                        else {
                            return Promise.resolve(data);
                        }
                    }
                    else {
                        throw {};
                    }
                })
                .then((data: any) => {
                    let pk: any[] = data.pk;
                    if (pk) {
                        var checkCount = 0;
                        for (let i in this.queryParams) {
                            if (pk.indexOf(i) > -1 && this.queryParams[i]) {
                                checkCount++;
                            }

                            if (i == 'view' && this.queryParams[i] == 1) {
                                this.viewMode = true;
                            }
                        }
                        if (checkCount == pk.length) {
                            this.hasKey = true;
                        }
                    }

                    if (data.title) {
                        if (typeof data.title == 'string') {
                            this.title = data.title;
                        }
                        else {
                            if (this.hasKey) {
                                if (this.viewMode) {
                                    this.title = data.title['view'];
                                }
                                else {
                                    this.title = data.title['edit'];
                                }
                            }
                            else {
                                this.title = data.title['add'];
                            }
                        }

                        if (!this.isDialog) {
                            this.view.setTitle(this.title, this.formId);
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
                            for (let c of this.view.getComponentItems(this.formId)) {
                                if (c.mapping) {
                                    var value;
                                    var dsName = c.mapping.substring(0, c.mapping.indexOf('.'));
                                    if (ds[dsName]) {
                                        try {
                                            eval('value = ds.' + c.mapping + '');
                                        }
                                        catch (e) {
                                            value = null;
                                        }

                                        if (value || value === 0 || value === false) {
                                            if (c.type == 'date' || c.type == 'time') {
                                                c.setValue(new Date(value));
                                            }
                                            else if (c.type == 'grid') {
                                                c.getStore().loadData(value);
                                            }
                                            else {
                                                c.setValue(value);
                                            }
                                        }
                                        else {
                                            if (c.type == 'grid') {
                                                c.getStore().fireEvent('load');
                                            }
                                        }
                                    }
                                }

                                if (typeof c.getValue == 'function' && typeof c.getValue() == 'string' && c.getValue().startsWith('@')) {
                                    var newValue = this.fetchParamsValue(c.getValue(), null);
                                    c.setValue(newValue);
                                }
                            }

                            var save = data.save;

                            this.view.loading = false;
                            if (data.tbar) {
                                this.hasToolbar = true;

                                let tbar: any[] = [];
                                let lang: string = this.translate._currentLang;
                                for (let b of data.tbar) {
                                    var cls = 'ext-secondary';
                                    if (b.action) {
                                        if (b.action.type == 'save') {
                                            if (!b.icon) {
                                                b.icon = 'fa-save';
                                            }
                                            cls = 'ext-primary';
                                        }
                                        else if (b.action.type == 'select') {
                                            if (!b.icon) {
                                                b.icon = 'fa-check';
                                            }
                                        }
                                    }

                                    if (b.cls) {
                                        cls = b.cls;
                                    }

                                    let hidden: boolean = false;
                                    if (b.visible) {
                                        hidden = !this.getVisible(b.visible);
                                        // for (let v in b.visible) {
                                        //     if (b.visible[v] == 0) {
                                        //         if (v == 'view' && this.viewMode) {
                                        //             hidden = true;
                                        //         }
                                        //     }
                                        // }
                                    }

                                    var button = Ext.create('Ext.Button', {
                                        text: (typeof b.text == 'object') ? b.text[lang] : this.translate.instant(b.text),
                                        scale: 'medium',
                                        cls: cls,
                                        iconCls: 'fas ' + b.icon + ' fa-1x',
                                        hidden: hidden,
                                        handler: function () {
                                            if (this.action.type == 'link') {
                                                let path: string = this.action.path;
                                                if (!path) {
                                                    path = '/form/' + this.action.id;
                                                }
                                                this.angular.router.navigate([path]);
                                            }
                                            else if (this.action.type == 'open') {
                                                this.angular.open(this.action);
                                            }
                                            else if (this.action.type == 'select') {
                                                if (this.action.src) {
                                                    let itemsData: any[] = [];
                                                    var selectedItems = this.angular.getCmp(this.action.src).getSelectionModel().checkItems;
                                                    for (var i in selectedItems) {
                                                        var it = selectedItems[i];
                                                        let row: any = {};
                                                        for (let m in this.action.mapping) {
                                                            var key = this.action.mapping[m].substring(1);
                                                            row[m] = it[key];
                                                        }
                                                        itemsData.push(row);
                                                    }

                                                    this.angular.getCmp(this.action.dest, this.angular.queryParams.ref).getStore().loadData(itemsData);

                                                    if (this.angular.isDialog) {
                                                        this.angular.view.closeDialog();
                                                    }
                                                    else {
                                                        this.angular.view.closeForm();
                                                    }

                                                    // let appForms: any[] = this.angular.parent.appForms;
                                                    // let parentForm: any = appForms[this.angular.view.forms.length - ((this.angular.isDialog)? 1: 2)];
                                                    // console.log(parentForm.formId);

                                                    // console.log(this.angular.queryParams['ref']);
                                                }
                                            }
                                            else if (this.action.type == 'save') {
                                                let formValid: boolean = true;
                                                let validates: string[] = ["text", "textarea", "number", "currency", "combobox", "date", "time", "password"];
                                                let fields: any = Ext.CacheComponents
                                                    .find(o => o.id == this.angular.formId)
                                                    .items
                                                    .filter(o => {
                                                        return validates.indexOf(o.type) > -1;
                                                    });

                                                let errMessage: string = "";

                                                for (let f of fields) {
                                                    if (!f.isValid()) {
                                                        formValid = false;

                                                        let strip = (html: string): string => {
                                                            var tmp = document.createElement("DIV");
                                                            tmp.innerHTML = html;
                                                            return tmp.textContent || tmp.innerText || "";
                                                        }

                                                        errMessage = 'กรุณากรอกข้อมูล "' + strip(f.fieldLabel).replace('* ', '') + '"';
                                                        break;
                                                    }
                                                }

                                                if (!formValid) {
                                                    this.angular.view.alert(errMessage);
                                                    return;
                                                }

                                                this.setDisabled(true);

                                                let finishSave = () => {
                                                    this.setDisabled(false);
                                                    this.angular.resultData = [];

                                                    this.angular.view.alert(this.angular.translate.instant('save_success')).then(() => {
                                                        if (this.angular.view.forms.length > 1) {
                                                            if (this.angular.isDialog) {
                                                                this.angular.view.closeDialog();
                                                            }
                                                            else {
                                                                this.angular.view.closeForm();
                                                            }
                                                        }
                                                        else {
                                                            if (this.action.callback && this.action.callback.id) {
                                                                this.angular.router.navigate(['/form/' + this.action.callback.id], {
                                                                    queryParams: {}
                                                                });
                                                            }
                                                        }
                                                    });
                                                };

                                                let errorList: any[] = [];
                                                let saveData = (index: number, endPoint: any): void => {
                                                    if (index < endPoint.length) {
                                                        if (endPoint[index].type == 'mongo' && this.angular.hasKey) {
                                                            endPoint[index].method = 'PUT';
                                                        }

                                                        this.angular.dataService.saveData(endPoint[index])
                                                            .then(resultData => {
                                                                this.angular.resultData.push(resultData);

                                                                if (index + 1 < endPoint.length) {
                                                                    this.angular.fetchParams(endPoint[index + 1].params, endPoint[index + 1].type);
                                                                }

                                                                saveData(index + 1, endPoint);
                                                            })
                                                            .catch(err => {
                                                                errorList.push(err);
                                                                saveData(endPoint.length, endPoint);
                                                            });

                                                        // console.log(endPoint[index]);
                                                        // saveData(index + 1, endPoint);
                                                    }
                                                    else {
                                                        this.angular.saveData = [];
                                                        if (errorList.length == 0) {
                                                            if (typeof this.angular.onAfterSave == 'function') {
                                                                new Promise<any>((resolve, reject) => {
                                                                    this.angular.onAfterSave(resolve);
                                                                })
                                                                    .then(() => {
                                                                        finishSave();
                                                                    });
                                                            }
                                                            else {
                                                                finishSave();
                                                            }
                                                        }
                                                        else {
                                                            this.setDisabled(false);
                                                            console.log(errorList);
                                                        }
                                                    }
                                                };
                                                if (!this.angular.hasKey) {
                                                    if (save.insert && save.insert.length > 0) {
                                                        this.angular.fetchSave(save.insert);

                                                        if (typeof this.angular.onBeforeSave == 'function') {
                                                            new Promise<any>((resolve, reject) => {
                                                                this.angular.onBeforeSave(resolve);
                                                            })
                                                                .then(() => {
                                                                    saveData(0, this.angular.saveData);
                                                                });
                                                        }
                                                        else {
                                                            saveData(0, this.angular.saveData);
                                                        }
                                                    }
                                                    else {
                                                        finishSave();
                                                    }
                                                }
                                                else {
                                                    if (save.update && save.update.length > 0) {
                                                        this.angular.fetchSave(save.update);

                                                        if (typeof this.angular.onBeforeSave == 'function') {
                                                            new Promise<any>((resolve, reject) => {
                                                                this.angular.onBeforeSave(resolve);
                                                            })
                                                                .then(() => {
                                                                    saveData(0, this.angular.saveData);
                                                                });
                                                        }
                                                        else {
                                                            saveData(0, this.angular.saveData);
                                                        }
                                                    }
                                                    else {
                                                        finishSave();
                                                    }
                                                }
                                            }
                                        }
                                    });
                                    button.action = b.action;
                                    button.angular = this;

                                    button.name = b.name;
                                    this.view.addComponent(this.formId, button);

                                    tbar.push(button);
                                }

                                if (!this.isDialog) {
                                    this.view.setToolbarButtons(this.formId, tbar);
                                }
                                else {
                                    this.view.setDialogToolbarButtons(this.formId, tbar);
                                }
                            }
                            else {
                                this.bodyHeight = window.innerHeight - 64 - 30;
                            }

                            if (typeof this.onLoad == 'function') {
                                this.onLoad();
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
                })
                .catch(data => {
                    this.formData = null;
                    this.remoteData = [];
                    this.ds = [];
                    this.view.loading = false;
                });
        }
    }

    ngOnDestroy() {
        // avoid memory leaks here by cleaning up after ourselves. If we  
        // don't then we will continue to run our initialiseInvites()   
        // method on every navigationEnd event.
        if (this.navigationSubscription) {
            this.navigationSubscription.unsubscribe();
        }
    }

    getFormMode(): string {
        if (this.viewMode) {
            return "view";
        }
        else {
            return this.hasKey ? "edit" : "add"
        }
    }

    open(action: any, params: any = {}): void {
        params.ref = this.formId;

        if (!action.dialog) {
            this.view.addForm({
                id: action.id,
                params: params
            });
        }
        else {
            this.view.addDialog({
                id: action.id,
                size: action.dialog.size,
                params: params
            });
        }
    }

    getCenterParam(name: string): any {
        if (name == '@USER') {
            return this.authen.user.outlet_id;
        }
        return name;
    }

    fetchDataSource(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.ds && this.ds.length > 0) {
                let fetch = (index: number) => {
                    if (index < this.ds.length) {
                        var ds = this.ds[index];
                        var config = ds.api || ds.mongo || ds.sql;

                        var valid = true;

                        if (config.aggregate) {
                            valid = this.fetchAggregate(config.aggregate);
                        }

                        let params: any = this.fetchParams(config.params || config.find, (ds.mongo) ? 'mongo' : null);
                        for (let p in params) {
                            if (valid) {
                                if (!params[p] || (params[p] && params[p] == "") || params[p].toString().startsWith('@')) {
                                    valid = false;
                                }
                            }
                        }

                        if (Ext.Object.isEmpty(params)) {
                            valid = false;
                        }

                        // if (config.params) {
                        //     for (var p in config.params) {
                        //         var pValue = config.params[p];
                        //         if (pValue.toString().startsWith('@params')) {
                        //             var name = pValue.replace('@params.', '');
                        //             params[p] = this.queryParams[name];
                        //         }
                        //         else if (this.center.indexOf(pValue) > -1) {
                        //             params[p] = this.getCenterParam(pValue);
                        //         }
                        //         else if (pValue.toString().startsWith('@')) {
                        //             let value: any = "";
                        //             var o = Ext.getCmp(Ext.query('[name="' + pValue.substring(1) + '"]')[0].dataset.componentid);
                        //             if (o && (o.getValue() != undefined || o.getValue() != null)) {
                        //                 value = o.getValue();
                        //             }
                        //             params[p] = value;
                        //         }
                        //         else {
                        //             params[p] = pValue;
                        //         }

                        //         if (valid) {
                        //             if (!params[p] || (params[p] && params[p] == "") || params[p].toString().startsWith('@')) {
                        //                 valid = false;
                        //             }
                        //         }
                        //     }
                        // }

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

    getCmp(name: string, formId: string = this.formId): any {
        for (let c of this.view.getComponentItems(formId)) {
            if (c.name == name) {
                return c;
            }
        }
        return null;
    }

    convertValue(value: any): any {
        if (!isNaN(value)) {
            return parseFloat(value);
        }
        return value;
    }

    fetchParamsValue(pValue: any, mode: string, filter: boolean = false) {
        var paramsValue = null;
        if (typeof pValue == 'object' && pValue.name) {
            var gridData = [];
            var o = this.getCmp(pValue.name.substring(1));
            if (o) {
                var store = o.getStore();
                for (var j = 0; j < store.getCount(); j++) {
                    var row = store.getAt(j);
                    var dataRow = {};
                    for (let i in pValue.data) {
                        var key = pValue.data[i].substring(1);
                        dataRow[i] = row.get(key);
                    }
                    gridData.push(dataRow);
                }

                if (gridData.length > 0) {
                    paramsValue = gridData;
                }
            }
        }
        else if (pValue.toString().startsWith('@params')) {
            var name = pValue.replace('@params.', '');
            paramsValue = isNaN(this.queryParams[name]) ? this.queryParams[name] : parseInt(this.queryParams[name]);
        }
        else if (pValue.toString().startsWith('@ds')) {
            var name = pValue.replace('@ds.', '');
            eval('paramsValue = this.dsData.' + name);
        }
        else if (pValue.toString().startsWith('@center.user')) {//(this.center.indexOf(pValue) > -1) {
            var key = pValue.toString().replace('@center.user.', '');
            paramsValue = this.authen.user[key];
        }
        else if (pValue.toString().startsWith('@center.ws')) {
            var key = pValue.toString().replace('@center.ws.', '');
            if (this.authen.ws[key] == 0 && filter) {
                paramsValue = { "$exists": true };
            }
            else {
                paramsValue = this.authen.ws[key];
            }
        }
        else if (pValue.toString().startsWith('@result')) {
            if (this.resultData.length == 0) {
                return pValue;
            }
            else {
                eval('paramsValue = ' + pValue.toString().replace('@result', 'this.resultData'));
            }
        }
        else if (pValue.toString().startsWith('@')) {
            if (this.reserveKeys.indexOf(pValue.toString()) > -1) {
                return pValue;
            }

            var name = pValue.substring(1);
            var isRaw = false;
            if (name.split('.')[0] == 'raw') {
                name = name.split('.')[1];
                isRaw = true;
            }
            var o = this.getCmp(name);
            if (o) {
                if (o.type == 'grid') {
                    if (o.saveFields) {
                        var gridData = [];
                        var store = o.getStore();
                        for (var j = 0; j < store.getCount(); j++) {
                            var row = store.getAt(j);
                            var dataRow = {};
                            for (let i in o.saveFields) {
                                var key = o.saveFields[i].substring(1);
                                dataRow[i] = row.get(key);
                            }
                            gridData.push(dataRow);
                        }

                        if (gridData.length > 0) {
                            paramsValue = gridData;
                        }
                        return paramsValue;
                    }
                    else {
                        return null;
                    }
                }

                let value: any = (isRaw && typeof o.getRawValue == 'function') ? o.getRawValue() : o.getValue();
                if (o.json && typeof value == 'string') {
                    value = JSON.parse(value);
                }
                else if (o.type == 'daterange' && value != null) {
                    if (value[0]) {
                        value[0] = Ext.Date.format(value[0], 'Y-m-d\\T00:00:00.000\\Z');
                    }
                    if (value[1]) {
                        value[1] = Ext.Date.add(value[1], Ext.Date.DAY, 1);
                        value[1] = Ext.Date.format(value[1], 'Y-m-d\\T00:00:00.000\\Z');
                    }

                    let expr: any = {
                        "$gte": value[0],
                        "$lt": value[1]
                    };
                    if (value[0] && !value[1]) {
                        expr = {
                            "$gte": value[0]
                        };
                    }
                    else if (value[1] && !value[0]) {
                        expr = {
                            "$lt": value[1]
                        };
                    }

                    value = expr;
                }
                else if (value instanceof Date) {
                    if (mode == 'mongo') {
                        if (filter) {
                            value = {
                                "$gte": Ext.Date.format(value, 'Y-m-d\\T00:00:00.000\\Z'),
                                "$lt": Ext.Date.format(Ext.Date.add(value, Ext.Date.DAY, 1), 'Y-m-d\\T00:00:00.000\\Z')
                            };
                        }
                        else {
                            value = Ext.Date.format(value, 'Y-m-d\\T00:00:00.000\\Z');
                        }
                    }
                    else if (mode == 'api') {
                        var tz = (new Date()).getTimezoneOffset() * 60000;
                        value = new Date(value.getTime() - tz).toISOString().slice(0, -1);
                    }
                }

                paramsValue = value;
            }
            else {
                paramsValue = null;
            }
        }
        else if (/!?(@\w+)/i.test(pValue.toString())) {
            var expr = pValue.toString().split(/!?(@\w+)/i).filter(o => o.indexOf('@') > -1)[0];
            if (this.fetchParamsValue(expr, 'mongo') != null) {
                paramsValue = pValue.replace(expr, this.fetchParamsValue(expr, 'mongo'));
            }
        }
        else {
            paramsValue = pValue;
        }

        if (paramsValue === "") {
            paramsValue = null;
        }
        return paramsValue;
    }

    fetchAggregate(agg: any[], filter: boolean = false): boolean {
        let valid: boolean = true;
        for (let a of agg) {
            if (a["$match"]) {
                var fetch = (data, parent = null, key = null) => {
                    if (data) {
                        for (let i in data) {
                            if (typeof data[i] == 'object') {
                                fetch(data[i], data, i);
                            } else {
                                var resValue = this.fetchParamsValue(data[i], 'mongo', filter);
                                if (resValue == null) {
                                    if (parent && parent[key])
                                        delete parent[key];
                                    else
                                        delete data[i];
                                }
                                else {
                                    data[i] = resValue;
                                }
                            }
                        }
                    }
                }
                fetch(a["$match"]);
            }
        }
        return valid;
    }

    fetchParams(pp: any, mode: string, filter: boolean = false): any {
        var data = {
            params: pp
        };

        var params = {};

        if (mode == 'mongo') {
            var fetch = (data, parent = null, key = null) => {
                if (data) {
                    for (let i in data) {
                        if (typeof data[i] == 'object') {
                            fetch(data[i], data, i);
                        } else {
                            var resValue = this.fetchParamsValue(data[i], 'mongo', filter);
                            if (resValue == null) {
                                if (this.getFormMode() == 'edit') {
                                    if (parent && parent[key])
                                        parent[key] = null;
                                    else
                                        data[i] = null;
                                }
                                else {
                                    if (parent && parent[key])
                                        delete parent[key];
                                    else
                                        delete data[i];
                                }
                            }
                            else {
                                data[i] = resValue;
                            }
                        }
                    }
                }
            }
            fetch(data.params);

            return data.params;
        }
        else {
            for (let p in data.params) {
                var pValue = data.params[p];
                var resValue = this.fetchParamsValue(pValue, mode, filter);
                params[p] = resValue;
            }

        }

        // if (mode == 'mongo') {
        //     var fetch = function (data, parent = null, key = null) {
        //         if (data) {
        //             for (let i in data) {
        //                 if (typeof data[i] == 'object') {
        //                     fetch(data[i], data, i);
        //                 } else {
        //                     if (typeof data[i] == 'string' && /!?(@\w+)/i.test(data[i])) {
        //                         if (parent && parent[key])
        //                             delete parent[key];
        //                         else
        //                             delete data[i];
        //                     }
        //                 }
        //             }
        //         }
        //     }
        //     fetch(data.params);
        // }

        return params;
    }

    fetchSave(saves: any[]): void {
        for (let config of saves) {
            var data = config.api || config.mongo || config.sql;
            var mode = '';
            if (config.api) {
                mode = 'api';
            }
            else if (config.mongo) {
                mode = 'mongo';
            }
            if (!data.params) {
                data.params = {};
            }

            let jsonData = JSON.parse(JSON.stringify(data.params));
            let newParams: any = this.fetchParams(jsonData, mode);

            let info: any = {};

            if (data.authen) {
                info.authen = true;
            }

            if (config.api) {
                info.type = "api";
                info.url = config.api.url;
                if (config.api.method) {
                    info.method = config.api.method;
                }
            }
            else if (config.mongo) {
                info.type = "mongo";
                info.collection = config.mongo.collection;

                let params: any = this.fetchParams(config.mongo.filter, 'mongo');
                info.filter = params;

                if (config.mongo.pk) {
                    info.pk = config.mongo.pk;
                }
            }

            this.saveData.push(Object.assign({
                params: newParams
            }, info));
        }
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

                                if (c.ws && c.ws.length) {
                                    if (c.ws.find(o => o == this.authen.ws.wsp_id) == undefined) {
                                        c.cls += ' d-none';
                                    }
                                }

                                let config: any = c.config;
                                config.renderTo = Ext.get(c.id);
                                config.labelWidth = 140;

                                let cmp: any = this.component(c);
                                cmp.type = c.type;

                                if (cmp.xtype) {
                                    if (!cmp.name && c.name) {
                                        cmp.name = c.name;
                                    }
                                    cmp.data = {};

                                    if (c.visible) {
                                        cmp.setVisible(this.getVisible(c.visible));
                                    }
                                    if (c.disable) {
                                        cmp.setDisabled(this.getVisible(c.disable));
                                    }

                                    if (c.query) {
                                        cmp.data.query = c.query;
                                    }
                                    if (c.paging) {
                                        var dataConfig = c.paging.mongo || c.paging.api || c.paging.sql;
                                        if (c.paging.mongo) {
                                            cmp.data.mode = 'mongo';
                                        }
                                        else if (c.paging.api) {
                                            cmp.data.mode = 'api';
                                        }

                                        if (dataConfig)
                                            cmp.data.config = dataConfig;
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

                                    if (c.saveFields) {
                                        cmp.saveFields = c.saveFields;
                                    }

                                    if (c.mapping) {
                                        cmp.dataMapping = c.mapping;
                                    }

                                    this.view.addComponent(this.formId, cmp);
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

    getVisible(visible: any): boolean {
        let invisible = false;
        for (let m of this.formModes) {
            if (visible[m] == 0) {
                invisible = true;
                break;
            }
        }

        for (let m of this.formModes) {
            if (visible[m] == null) {
                visible[m] = (!invisible) ? 0 : 1;
            }
        }

        if (visible[this.getFormMode()] == 0) {
            return false;
        }
        return true;
    }

    getData(config: any, params: any): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.dataService.fetchData(config, params)
                .then(data => {
                    var resultData = data;
                    if (config.mapping) {
                        eval('resultData = resultData.' + config.mapping);
                        // let mappings: string[] = config.mapping.split('.');
                        // if (mappings.length > 0) {
                        //     for (var i = 0; i < mappings.length; i++) {
                        //         resultData = resultData[mappings[i]];
                        //     }
                        // }
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

                        var valid = true;
                        if (!config.params) {
                            config.params = config.find;
                        }

                        if (config.aggregate) {
                            valid = this.fetchAggregate(config.aggregate);
                        }

                        let params: any = this.fetchParams(config.params, (remoteCmp.mongo) ? 'mongo' : null);
                        for (let p in params) {
                            if (valid) {
                                if (!params[p] || (params[p] && params[p] == "") || params[p].toString().startsWith('@')) {
                                    valid = false;
                                }
                            }
                        }

                        // if (config.params) {
                        //     var ds = this.dsData;
                        //     for (var p in config.params) {
                        //         var pValue = config.params[p];
                        //         if (pValue.toString().startsWith('@params')) {
                        //             var name = pValue.replace('@params.', '');
                        //             params[p] = this.queryParams[name];
                        //         }
                        //         else if (this.center.indexOf(pValue) > -1) {
                        //             params[p] = this.getCenterParam(pValue);
                        //         }
                        //         else if (pValue.toString().startsWith('@')) {
                        //             let value: any = "";
                        //             var c = Ext.query('[name="' + pValue.substring(1) + '"]');
                        //             if (c.length) {
                        //                 var o = Ext.getCmp(c[0].dataset.componentid);
                        //                 if (o.mapping) {
                        //                     var dsName = o.mapping.substring(0, o.mapping.indexOf('.'));
                        //                     if (ds[dsName]) {
                        //                         eval('value = ds.' + o.mapping + '');
                        //                     }
                        //                 }
                        //                 params[p] = value;
                        //             }
                        //             else {
                        //                 params[p] = pValue;
                        //             }
                        //         }
                        //         else {
                        //             params[p] = pValue;
                        //         }

                        //         if (valid) {
                        //             if (!params[p] || (params[p] && params[p] == "") || params[p].toString().startsWith('@')) {
                        //                 valid = false;
                        //             }
                        //         }
                        //     }
                        // }

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

    navigateAction(action: any, recordData: any = null): void {
        var p = {};
        if (action.params) {
            for (let i in action.params) {
                var value = action.params[i];
                if (recordData) {
                    if (typeof value == 'string' && value.startsWith('@')) {
                        eval('value = recordData.' + value.substring(1));
                    }
                    p[i] = value;
                }
                else {
                    p[i] = this.fetchParamsValue(value, null);
                }
            }
        }

        if (action.type == 'open') {
            this.open(action, p);
        }
        else if (action.type == 'link') {
            let path: string = action.path;
            if (!path) {
                path = '/form/' + action.id;
            }
            this.router.navigate([path], {
                queryParams: p
            })
            // this.open(column.action, p);
        }
    }

    grid(c: any, config: any): any {
        let columns: any[] = [];
        let fields: any[] = [];
        let docks: any[] = [];

        if (c.type == 'grid') {
            config.cls = 'ext-list';
            for (let col of c.columns) {
                col.cls = "";
                if (!col.config) {
                    col.config = {};
                }

                if (col.ws && col.ws.length > 0) {
                    if (col.ws.find(o => o == this.authen.ws.wsp_id) == undefined) {
                        col.config.hidden = true;
                    }
                }

                if (col.iconCls) {
                    col.defaultValue = '<i class="' + col.iconCls + '"></i>';
                    col.config.width = 40;
                    col.config.align = 'center';
                }

                if (col.type == 'action') {
                    col.config.width = 40 * col.config.items.length;
                    col.config.align = 'center';
                    columns.push(Ext.create('Ext.grid.column.Action', col.config));
                }
                else {
                    var column;

                    if (col.visible) {
                        col.config.hidden = !this.getVisible(col.visible);
                    }

                    if (col.config.renderer) {
                        eval('col.config.renderer = ' + col.config.renderer);
                    }
                    else if (col.mapping || col.action || col.defaultValue) {
                        col.config.renderer = function (value, metaData, record, rowIndex, colIndex) {
                            var column = this.getColumns()[colIndex];
                            if (!value && column.defaultValue) {
                                value = column.defaultValue;
                            }

                            if (value || value === 0 || value === false) {
                                if (column.mapping) {
                                    eval('value = record.data.' + column.mapping);
                                    // var mappings = column.mapping.split('.');
                                    // if (mappings.length > 1) {
                                    //     for (var i = 1; i < mappings.length; i++) {
                                    //         value = value[mappings[i]];
                                    //     }
                                    // }
                                }

                                if (column.type == 'currency') {
                                    value = Ext.util.Format.numberRenderer('0,0.00')(value);
                                }

                                if (column.action) {
                                    if (column.action.type == 'open' || column.action.type == 'link') {
                                        return `<a style="text-decoration: underline" href="javascript:void(0)">${value}</a>`;
                                    }
                                }
                            }
                            return value;
                        }
                    }

                    if (col.type == 'date') {
                        if (!col.config.format) {
                            col.config.format = 'd/m/Y';
                        }
                        if (!col.config.width) {
                            col.config.width = 100;
                        }
                        column = Ext.create('Ext.grid.column.Date', col.config);
                    }
                    else if (col.type == 'time') {
                        if (!col.config.format) {
                            col.config.format = 'H:i';
                        }
                        if (!col.config.width) {
                            col.config.width = 80;
                        }
                        column = Ext.create('Ext.grid.column.Date', col.config);
                    }
                    else if (col.type == 'datetime') {
                        if (!col.config.format) {
                            col.config.format = 'd/m/Y H:i';
                        }
                        if (!col.config.width) {
                            col.config.width = 150;
                        }
                        column = Ext.create('Ext.grid.column.Date', col.config);
                    }
                    else if (col.type == 'checkbox') {
                        col.config.xtype = 'checkcolumn';
                        col.config.align = 'center';
                        col.config.width = 60;
                        col.config.listeners = {
                            beforecheckchange: function () {
                                return false;
                            }
                        };
                        column = Ext.create('Ext.grid.column.Check', col.config);
                    }
                    else if (col.type == 'currency') {
                        if (!col.config.renderer) {
                            col.config.renderer = Ext.util.Format.numberRenderer('0,0.00');
                        }
                        col.config.align = 'right';
                        column = Ext.create('Ext.grid.column.Column', col.config);
                    }
                    else {
                        column = Ext.create('Ext.grid.column.Column', col.config);
                    }

                    if (col.action) {
                        column.action = col.action;
                    }
                    if (col.mapping) {
                        column.mapping = col.mapping;
                    }
                    if (col.defaultValue) {
                        column.defaultValue = col.defaultValue;
                    }
                    if (col.type) {
                        column.type = col.type;
                    }

                    column.angular = this;
                    columns.push(column);
                }

                if (col.config.dataIndex) {
                    fields.push(col.config.dataIndex);
                }
            }
            config.listeners = {
                cellclick: (o, td, cellIndex, record, tr, rowIndex, e) => {
                    if (e.target.tagName == 'A' || e.target.tagName == 'I') {
                        var column = o.ownerGrid.getColumns()[cellIndex];
                        this.navigateAction(column.action, record.data);
                    }
                },
                resize: function (e) {
                    if (e.ownerGrid) {
                        setTimeout(() => {
                            var width = e.ownerGrid.getEl().dom.getBoundingClientRect().width;
                            e.ownerGrid.setWidth(Math.floor(width));
                        }, 0);
                    }
                }
            };

            if (c.tbar) {
                let tbarButtons: any[] = [];
                var viewCount = 0;
                for (let b of c.tbar) {
                    var isView = this.viewMode;
                    if (isView) {
                        viewCount++;
                    }

                    let btnConfig: any = {
                        scale: 'medium',
                        cls: (b.cls) ? b.cls : 'ext-grey',
                        text: b.text,
                        angular: this,
                        action: b.action,
                        hidden: isView
                    };

                    if (b.action) {
                        btnConfig.handler = function () {
                            var p = {};
                            if (this.action.params) {
                                for (let i in this.action.params) {
                                    var value = this.action.params[i];
                                    if (value.toString().startsWith('@params')) {
                                        var name = value.replace('@params.', '');
                                        p[i] = this.angular.queryParams[name];
                                    }
                                    else if (value.toString().startsWith('@')) {
                                        let v: any = null;
                                        var o = this.angular.getCmp(value.substring(1));
                                        if (o && (o.getValue() != undefined || o.getValue() != null)) {
                                            v = o.getValue();
                                        }
                                        p[i] = v;
                                    }
                                    else {
                                        p[i] = value;
                                    }
                                }
                            }

                            if (c.name) {
                                p['ref'] = c.name;
                            }

                            if (this.action.type == 'open') {
                                this.angular.open(this.action, p);
                            }
                        };
                    }
                    var cmp = Ext.create('Ext.Button', btnConfig);
                    cmp.name = b.name;
                    tbarButtons.push(cmp);
                    this.view.addComponent(this.formId, cmp);
                }

                var hidden = false;
                if (viewCount == tbarButtons.length) {
                    hidden = true;
                }
                docks.push({
                    xtype: 'toolbar',
                    hidden: hidden,
                    items: tbarButtons
                });
            }

            if (c.selModel) {
                config.selModel = {
                    selType: 'checkboxmodel',
                    checkOnly: true,
                    allowDeselect: true,
                    listeners: {
                        select: function (sm, rec) {
                            if (!sm.checkItems) {
                                sm.checkItems = [];
                            }
                            sm.checkItems[rec.get('id')] = rec.data;
                        },
                        deselect: function (sm, rec) {
                            if (!sm.checkItems) {
                                sm.checkItems = [];
                            }
                            if (sm.checkItems[rec.get('id')]) {
                                delete sm.checkItems[rec.get('id')];
                            }
                        }
                    }
                };
                columns[0].cls = (columns[0].cls + " ext-col-bl-line").trim();
            }

            if (c.features) {
                config.features = [];
                for (let f of c.features) {
                    let feature: any = null;
                    if (f.type == 'rowbody') {
                        feature = {
                            ftype: 'rowbody',
                            tpl: f.tpl,
                            getAdditionalData: function (data, idx, record, orig) {
                                var html = this.tpl;
                                if (html instanceof Array) {
                                    html = html.join("");
                                }
                                var tpl = new Ext.XTemplate(
                                    html,
                                    {
                                        toCurrency: function (value) {
                                            return Ext.util.Format.numberRenderer('0,0.00')(value);
                                        }
                                    }
                                );

                                return {
                                    rowBody: tpl.apply(record.data)
                                };
                            }
                        };
                    }

                    if (feature) {
                        config.features.push(feature);
                    }
                }
            }

            // config.features = [{
            //     ftype: 'rowbody',
            //     tpl
            //     rowBody: 'xxx-rowBody',
            //     rowBodyCls: 'xxx-rowBodyCls',
            //     getAdditionalData: function (data, idx, record, orig) {
            //         console.log(this);

            //         var tpl = new Ext.XTemplate(this.tpl);
            //         return tpl.apply(record.data);

            //         return {
            //             rowBody: '<div style="padding: 1em">' + record.get("outlet_name") + '</div>',
            //             rowBodyCls: "my-body-class"
            //         };
            //     }
            // }]
        }
        else if (c.type == 'list') {
            config.cls = 'ext-list';
            config.listeners = {
                cellclick: (o, td, cellIndex, record, tr, rowIndex, e) => {
                    if (e.target.tagName == 'A') {
                        var ds = e.target.parentElement.dataset;
                        if (ds.action) {
                            var action = JSON.parse(ds.action);
                            if (action.type == 'open') {
                                var p = {};
                                if (action.params) {
                                    for (let i in action.params) {
                                        var value = action.params[i];
                                        if (typeof value == 'string' && value.startsWith('@')) {
                                            value = record.get(value.substring(1));
                                        }
                                        p[i] = value;
                                    }
                                }
                                this.open(action, p);
                            }
                        }
                    }
                    // var link;
                    // if (e.target.tagName == 'A') {
                    //     link = e.target;
                    // }
                    // else if (e.target.tagName == 'I') {
                    //     link = e.target.parentElement;
                    // }

                    // if (link && link.getAttribute('routerLink')) {
                    //     var linkPath = link.getAttribute('routerLink');
                    //     var query = link.getAttribute('queryParams');
                    //     var queryParams = {}
                    //     if (query) {
                    //         eval('queryParams = ' + query);
                    //     }
                    //     o.ownerGrid.angular.router.navigate([linkPath], { queryParams: queryParams });
                    // }
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
                            if (it.action) {
                                template.dataset.action = JSON.stringify(it.action);
                            }

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
                                    if (it.action && it.action.type == 'open') {
                                        rValue = `<a style="text-decoration: underline" href="javascript:void(0)">${rValue}</a>`;
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
        if (c.group) {
            storeConfig.groupField = c.group;
        }
        if (c.sort) {
            storeConfig.sorters = [];
            for (let s in c.sort) {
                let dir = "ASC";
                if (c.sort[s] == -1) {
                    dir = "DESC";
                }
                storeConfig.sorters.push({
                    property: s,
                    direction: dir
                });
            }
        }

        let store, proxy;

        if (c.paging && (c.paging.mongo || c.paging.api || c.paging.sql)) {
            var dataConfig = c.paging.mongo || c.paging.api || c.paging.sql;
            if (c.paging.mongo) {
                proxy = {
                    type: 'ajax',
                    url: Config.ServiceUrl + '/data?page=1&size=' + Config.PageSize,
                    paramsAsJson: true,
                    actionMethods: {
                        create: 'POST',
                        read: 'POST',
                        update: 'POST',
                        destroy: 'POST'
                    },
                    reader: {
                        type: 'json',
                        rootProperty: 'data',
                        totalProperty: 'total'
                    }
                };

                proxy.mode = 'mongo';

                proxy.extraParams = {
                    collection: dataConfig.collection
                }

                if (dataConfig.find) {
                    var jsonFind = JSON.parse(JSON.stringify(dataConfig.find));
                    proxy.extraParams.find = this.fetchParams(jsonFind, 'mongo', true);
                }
                else if (dataConfig.aggregate) {
                    let agg: any[] = JSON.parse(JSON.stringify(dataConfig.aggregate));
                    this.fetchAggregate(agg, true);
                    proxy.extraParams.aggregate = agg; //this.fetchParams(jsonAggregate, 'mongo');                    
                }

                if (dataConfig.sort) {
                    proxy.extraParams.sort = dataConfig.sort; //JSON.stringify(dataConfig.sort);
                }
            }
            else if (c.paging.api) {
                proxy = {
                    type: 'ajax',
                    url: dataConfig.url,
                    paramsAsJson: true,
                    actionMethods: {
                        create: dataConfig.method,
                        read: dataConfig.method,
                        update: dataConfig.method,
                        destroy: dataConfig.method
                    },
                    reader: {
                        type: 'json',
                        rootProperty: dataConfig.mapping,
                        totalProperty: dataConfig.total
                    }
                };

                proxy.mode = 'api';
                proxy.pageParams = dataConfig.pageParams;

                proxy.extraParams = {};
                proxy.extraParams[dataConfig.pageParams.page] = 1;
                proxy.extraParams[dataConfig.pageParams.limit] = Config.PageSize;
            }
        }

        if (c.paging && c.type == 'grid') {
            // if (options.authen) {
            //     proxy.headers = { 'Authorization': 'Bearer ' + this.storage.get('access_token') };
            // }

            let listeners: any = {
                load: function (store) {
                    setTimeout(() => {
                        window.dispatchEvent(new Event('resize'));
                    }, 0);

                    var sm = store.ownerGrid.getSelectionModel();
                    if (sm && sm.checkItems) {
                        store.each(function (item) {
                            if (sm.checkItems[item.get('id')]) {
                                sm.select(item, true);
                            }
                        });
                    }

                    // if (!store.checkedItems) store.checkedItems = [];
                    // store.each(function (item) {
                    //     item.set("selected", store.checkedItems[item.get("_id")]);
                    // });
                }
            };

            // if (c.selModel) {
            //     Object.assign(listeners, {
            //         beforeload: function (store) {
            //             if (!store.checkedItems) store.checkedItems = [];
            //             store.each(function (item) {
            //                 store.checkedItems[item.get("_id")] = item.get("selected");
            //             });
            //         }
            //     });
            // }

            store = Ext.create('Ext.data.JsonStore', {
                pageSize: Config.PageSize,
                autoLoad: true,
                proxy: proxy,
                // ref: refValue,
                listeners: listeners
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
                        var proxy = self.ownerCt.getStore().getProxy();
                        if (proxy.mode == 'mongo') {
                            proxy.setUrl(Config.ServiceUrl + '/data?page=' + page + '&size=' + Config.PageSize);
                        }
                        else if (proxy.mode == 'api') {
                            var p = {};
                            p[proxy.pageParams.page] = page;
                            proxy.setExtraParams(Object.assign(proxy.getExtraParams(), p));
                        }

                        // console.log(self.ownerCt.getSelectionModel().checkItems);

                        // var sm = self.ownerCt.getSelectionModel();
                        // if (sm.getSelected()) {
                        //     if (!self.ownerCt.getStore().checkedItems) 
                        //         self.ownerCt.getStore().checkedItems = [];

                        //     for (var i = 0; i < sm.getSelected().length; i++) {
                        //         var row = sm.getSelected().getAt(i);
                        //         store.checkedItems[row.get("_id")] = true;
                        //     }
                        // }
                    }
                }
            });
        }
        else if (c.paging && c.type == 'list') {
            // let proxy: any = {
            //     type: 'ajax',
            //     url: Config.ServiceUrl + '/data?page=1&size=' + Config.PageSize,
            //     paramsAsJson: true,
            //     actionMethods: {
            //         create: 'POST',
            //         read: 'POST',
            //         update: 'POST',
            //         destroy: 'POST'
            //     },
            //     extraParams: {
            //         collection: c.paging.collection,
            //         find: c.paging.find
            //     },
            //     reader: {
            //         type: 'json',
            //         rootProperty: 'data',
            //         totalProperty: 'total'
            //     }
            // };

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
            sortableColumns: false,
            enableColumnHide: false,
            enableColumnMove: false,
            enableColumnResize: false,
            hideHeaders: c.type == 'list',
            columns: columns,
            dockedItems: docks,
            store: store
        };
        if (c.autoHeight == true) {
            var cls = config.cls || '';
            config.cls = (cls + ' ext-auto-height').trim();
            config.viewConfig = {
                deferEmptyText: false,
                emptyText: "ไม่มีข้อมูล"
            }
        }
        else {
            data.minHeight = (c.type == 'grid') ? 300 : 170;
        }
        if (c.group) {
            data.features = [{
                ftype: 'grouping'
            }];
        }

        var grid = Ext.create('Ext.grid.Panel', Object.assign(data, config));
        store.ownerGrid = grid;
        return grid;
    }

    createPicBox(imagePath): any {
        var html = `<img src="${imagePath}" />`;
        if (!this.viewMode) {
            html += '<i class="fas fa-times fa-1x"></i>';
        }
        return Ext.create('Ext.Component', {
            width: 118,
            height: 118,
            cls: 'pic-box d-flex v-center h-center',
            html: html,
            autoEl: {
                tag: 'div'
            },
            listeners: {
                render: function (c) {
                    var removeIcon = c.getEl().dom.querySelector('i');
                    if (removeIcon) {
                        removeIcon.addEventListener('click', function (e) {
                            var owner = c.ownerLayout.owner;
                            owner.remove(c);

                            if (typeof owner.setRefValue == 'function') {
                                owner.setRefValue();
                            }
                        });
                    }
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
        if (this.viewMode) {
            let readOnly: boolean = true;
            if (c.editable) {
                for (let v in c.editable) {
                    if (c.editable[v] == 1) {
                        if (v == 'view') {
                            readOnly = false;
                        }
                    }
                }
            }
            config.readOnly = readOnly;
        }

        if (config.allowBlank == false && config.fieldLabel) {
            config.fieldLabel = '<span style="color: red">*</span> ' + config.fieldLabel;
        }

        switch (c.type) {
            case 'text': {
                return Ext.create('Ext.form.field.Text', config);
                // break;
            }
            case 'password': {
                config.inputType = 'password';
                return Ext.create('Ext.form.field.Text', config);
                // break;
            }
            case 'date': {
                if (!config.format) {
                    config.format = 'd/m/Y';
                }
                config.fieldStyle = 'text-align: center;';
                clearTrigger(config);
                if (this.viewMode) {
                    config.fieldCls = 'ext-form-readonly';
                }
                return Ext.create('Ext.form.field.Date', config);
                // break;
            }
            case 'time': {
                config.format = 'H:i';
                config.fieldStyle = 'text-align: center;';
                clearTrigger(config);
                if (this.viewMode) {
                    config.fieldCls = 'ext-form-readonly';
                }
                return Ext.create('Ext.form.field.Time', config);
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
                        if (combo.links && this.view.loading == false) {
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
                if (this.viewMode && config.readOnly) {
                    config.fieldCls = 'ext-form-readonly';
                }

                return Ext.create('Ext.form.field.ComboBox', Object.assign(data, config));
                // break;
            }
            case 'checkbox': {
                return Ext.create('Ext.form.field.Checkbox', config);
                // break;
            }
            case 'daterange': {
                var date1 = {
                    format: 'd/m/Y',
                    fieldStyle: 'text-align: center;'
                };
                clearTrigger(date1);

                var date2 = {
                    format: 'd/m/Y',
                    fieldStyle: 'text-align: center;'
                };
                clearTrigger(date2);

                config.cls = 'ext-field-range';
                config.items = [
                    Ext.create('Ext.form.field.Date', date1),
                    Ext.create('Ext.Component', {
                        html: '-',
                        cls: 'ext-sep-range'
                    }),
                    Ext.create('Ext.form.field.Date', date2)
                ];
                var cmp = Ext.create('Ext.form.FieldContainer', config);
                cmp.getValue = function () {
                    var values = null;
                    var value1 = this.items.get(0).getValue();
                    var value2 = this.items.get(2).getValue();
                    if (value1 || value2) {
                        values = [
                            value1,
                            value2
                        ];
                    }
                    return values;
                };
                return cmp;
                // break;
            }
            case 'checkboxgroup': {
                var cmp = Ext.create('Ext.form.FieldContainer', config);
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
                return cmp;
                // break;
            }
            case 'radiogroup': {
                if (config.name) {
                    for (var i = 0; i < config.items.length; i++) {
                        config.items[i].name = config.name;
                    }
                }
                var cmp = Ext.create('Ext.form.FieldContainer', config);
                cmp.getValue = function () {
                    return null;
                };
                cmp.setValue = function (value) {
                    for (var i = 0; i < this.items.length; i++) {
                        var item = this.items.get(i);
                        if (item.inputValue == value) {
                            item.setValue(true);
                            break;
                        }
                    }
                };
                cmp.getValue = function () {
                    for (var i = 0; i < this.items.length; i++) {
                        var item = this.items.get(i);
                        if (item.getValue() == true) {
                            return item.inputValue;
                        }
                    }
                    return null;
                };
                if (this.viewMode) {
                    for (var i = 0; i < cmp.items.length; i++) {
                        cmp.items.get(i).setReadOnly(true);
                    }
                }
                return cmp;
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
                config.cls = 'ext-secondary';

                if (c.filter) {
                    config.handler = function () {
                        var filterRef = this.ariaAttributes.filter;
                        var grid = this.angular.getCmp(filterRef);
                        var store = grid.getStore();

                        if (grid.data.mode == 'mongo') {
                            // var find;
                            // if (!grid.data.config.query) {
                            //     grid.data.config.query = "{}";
                            //     eval('find = ' + grid.data.config.query);
                            // }
                            // else {
                            //     eval('find = ' + grid.data.config.query);
                            // }

                            // if (!grid.data.config.find) {
                            //     find = {};
                            // }
                            // else {
                            //     find = grid.data.config.find;
                            // }

                            // var filterParams = find;
                            // for (let filterName of grid.data.config.filter) {
                            //     let cmp: any = this.angular.getCmp(filterName);
                            //     if (cmp && cmp.name) {
                            //         let value: any = cmp.getValue();
                            //         if (value || value === 0 || value === false) {
                            //             let fieldName: string = cmp.mapping || cmp.name;
                            //             if (cmp.type == 'daterange') {
                            //                 if (value[0]) {
                            //                     value[0] = Ext.Date.format(value[0], 'Y-m-d\\T00:00:00.000\\Z');
                            //                 }
                            //                 if (value[1]) {
                            //                     value[1] = Ext.Date.add(value[1], Ext.Date.DAY, 1);
                            //                     value[1] = Ext.Date.format(value[1], 'Y-m-d\\T00:00:00.000\\Z');
                            //                 }

                            //                 let expr: any = {
                            //                     "$gte": value[0],
                            //                     "$lt": value[1]
                            //                 };
                            //                 if (value[0] && !value[1]) {
                            //                     expr = {
                            //                         "$gte": value[0]
                            //                     };
                            //                 }
                            //                 else if (value[1] && !value[0]) {
                            //                     expr = {
                            //                         "$lt": value[1]
                            //                     };
                            //                 }

                            //                 let query: any = {};
                            //                 query[fieldName] = expr;
                            //                 Object.assign(filterParams, query);
                            //             }
                            //             else if (cmp.type == 'date') {
                            //                 let query: any = {};
                            //                 query[fieldName] = {
                            //                     "$gte": Ext.Date.format(value, 'Y-m-d\\T00:00:00.000\\Z'),
                            //                     "$lt": Ext.Date.format(Ext.Date.add(value, Ext.Date.DAY, 1), 'Y-m-d\\T00:00:00.000\\Z')
                            //                 };
                            //                 Object.assign(filterParams, query);
                            //             }
                            //             else {
                            //                 let cmpFind: any = cmp.data.query || cmp.data.find;
                            //                 if (typeof cmpFind == 'object') {
                            //                     let query: any = {};
                            //                     query[fieldName] = this.angular.fetchParams(cmpFind, 'mongo', value);
                            //                     Object.assign(filterParams, query);
                            //                 }
                            //                 else {
                            //                     // if (!cmpFind) {
                            //                     //     cmpFind = '{{value}}';
                            //                     //     if (typeof value == 'string') {
                            //                     //         value = '"' + value + '"';
                            //                     //     }
                            //                     // }
                            //                     // cmpFind = cmpFind.replace('{{value}}', value);
                            //                     // let exp: string = `{ '${fieldName}': ${cmpFind} }`;
                            //                     // var query;
                            //                     // eval('query = ' + exp);
                            //                     let query: any = {};
                            //                     query[fieldName] = value;
                            //                     Object.assign(filterParams, query);
                            //                 }
                            //             }
                            //         }
                            //     }
                            // }                            

                            if (grid.data.config.aggregate) {
                                let agg: any[] = JSON.parse(JSON.stringify(grid.data.config.aggregate));

                                this.angular.fetchAggregate(agg, true);

                                store.proxy.extraParams.aggregate = agg;
                            }
                            else if (grid.data.config.find) {
                                // let filterParams: any = {};
                                // for (let filterName of grid.data.config.filter || {}) {
                                //     let cmp: any = this.angular.getCmp(filterName);
                                //     if (cmp && cmp.name) {
                                //         let value: any = cmp.getValue();
                                //         if (value || value === 0 || value === false) {
                                //             let fieldName: string = cmp.mapping || cmp.name;
                                //             if (cmp.type == 'daterange') {
                                //                 if (value[0]) {
                                //                     value[0] = Ext.Date.format(value[0], 'Y-m-d\\T00:00:00.000\\Z');
                                //                 }
                                //                 if (value[1]) {
                                //                     value[1] = Ext.Date.add(value[1], Ext.Date.DAY, 1);
                                //                     value[1] = Ext.Date.format(value[1], 'Y-m-d\\T00:00:00.000\\Z');
                                //                 }

                                //                 let expr: any = {
                                //                     "$gte": value[0],
                                //                     "$lt": value[1]
                                //                 };
                                //                 if (value[0] && !value[1]) {
                                //                     expr = {
                                //                         "$gte": value[0]
                                //                     };
                                //                 }
                                //                 else if (value[1] && !value[0]) {
                                //                     expr = {
                                //                         "$lt": value[1]
                                //                     };
                                //                 }

                                //                 let query: any = {};
                                //                 query[fieldName] = expr;
                                //                 Object.assign(filterParams, query);
                                //             }
                                //             else if (cmp.type == 'date') {
                                //                 let query: any = {};
                                //                 query[fieldName] = {
                                //                     "$gte": Ext.Date.format(value, 'Y-m-d\\T00:00:00.000\\Z'),
                                //                     "$lt": Ext.Date.format(Ext.Date.add(value, Ext.Date.DAY, 1), 'Y-m-d\\T00:00:00.000\\Z')
                                //                 };
                                //                 Object.assign(filterParams, query);
                                //             }
                                //             else {
                                //                 let query: any = {};
                                //                 query[fieldName] = this.angular.fetchParamsValue(value, 'mongo');
                                //                 Object.assign(filterParams, query);
                                //             }
                                //         }
                                //     }
                                // }

                                let find: any = JSON.parse(JSON.stringify(grid.data.config.find));
                                store.proxy.extraParams.find = this.angular.fetchParams(find, 'mongo', true);
                            }

                            // if (filterParams) {
                            //     store.proxy.extraParams.find = filterParams;
                            // }
                            // else {
                            //     store.proxy.extraParams.find = find;
                            // }

                            store.proxy.setUrl(Config.ServiceUrl + '/data?page=1&size=' + Config.PageSize);

                            store.loadPage(1);
                            store.load();

                            if (this.export) {
                                var findQuery = {
                                    find: store.proxy.extraParams.find
                                };
                                Object.assign(findQuery, store.proxy.extraParams);

                                let columns: any[] = [];
                                for (let i = 0; i < grid.getColumns().length; i++) {
                                    var c = grid.getColumns()[i];
                                    if (c.dataIndex) {
                                        let colConfig: any = {
                                            text: c.text,
                                            dataIndex: c.mapping || c.dataIndex,
                                            width: c.width || c.cellWidth,
                                            mapping: (c.mapping) ? true : false
                                        };

                                        columns.push(colConfig);

                                    }
                                }
                                this.angular.dataService.exportExcel({
                                    columns: columns,
                                    filter: findQuery
                                }).then(data => {
                                    window.location.href = Config.ServiceUrl + '/download?path=' + data.path;
                                });
                            }
                        }
                        else if (grid.data.mode == 'api') {
                            let filterParams: any = {};
                            for (let filterName of grid.data.config.filter) {
                                let cmp: any = this.angular.getCmp(filterName);
                                if (cmp && cmp.name) {
                                    let value: any = cmp.getValue();
                                    if (value || value === 0 || value === false) {
                                        filterParams[filterName] = value;
                                    }
                                }
                            }

                            var dataConfig = grid.data.config;
                            store.proxy.pageParams = dataConfig.pageParams;

                            store.proxy.extraParams = {};
                            store.proxy.extraParams[dataConfig.pageParams.page] = 1;
                            store.proxy.extraParams[dataConfig.pageParams.limit] = Config.PageSize;
                            store.proxy.extraParams = Object.assign(store.proxy.extraParams, filterParams);

                            store.load();
                        }
                    };
                    var renderTo = config.renderTo;
                    config.renderTo = '';
                    config.iconCls = 'fas fa-search fa-1x';
                    var button = Ext.create('Ext.Button', config);
                    button.angular = this;
                    var cmp = Ext.create('Ext.form.FieldContainer', {
                        renderTo: renderTo,
                        cls: 'd-flex h-center',
                        defaults: {
                            margin: '0 5 0 5'
                        },
                        items: [
                            button,
                            Ext.create('Ext.Button', {
                                scale: 'medium',
                                cls: 'ext-grey',
                                iconCls: 'fas fa-redo-alt fa-1x',
                                hidden: (!c.resets) ? true : false,
                                angular: this,
                                resets: c.resets,
                                text: this.translate.instant('clear'),
                                handler: function () {
                                    for (let filterName of this.resets) {
                                        let cmp: any = this.angular.getCmp(filterName);
                                        if (cmp) {
                                            if (cmp.type == 'daterange') {
                                                cmp.items.get(0).setValue(null);
                                                cmp.items.get(2).setValue(null);
                                            }
                                            else {
                                                cmp.setValue(null);
                                            }
                                        }
                                    };
                                }
                            })
                        ]
                    });

                    if (c.export) {
                        var exportButton = Ext.create('Ext.Button', Object.assign(config, {
                            scale: 'medium',
                            cls: 'ext-grey',
                            iconCls: 'fas fa-file-excel fa-1x',
                            text: this.translate.instant('export_excel')
                        }));
                        exportButton.angular = this;
                        exportButton.export = true;
                        cmp.items.add(exportButton);
                    }

                    return cmp;
                }
                else {
                    if (c.action) {
                        config.handler = function () {
                            this.angular.navigateAction(this.action);
                        };
                    }

                    config.style = { top: '-3px' };
                    if (config.fieldLabel === "") {
                        config.style.marginLeft = '145px';
                    }

                    var button = Ext.create('Ext.Button', config);
                    button.action = c.action;
                    button.angular = this;
                    return button;
                }
                // break;
            }
            case 'file': {
                var fileUpload = Ext.create('Ext.form.field.File', {
                    cls: 'ext-file-upload',
                    buttonConfig: {
                        text: (!c.excel) ? this.translate.instant('select_photo') : this.translate.instant('select_file'),
                        cls: 'ext-grey',
                        scale: 'medium'
                    },
                    msgTarget: 'side',
                    buttonOnly: true,
                    hidden: this.viewMode,
                    listeners: {
                        render: function (s) {
                            s.fileInputEl.set({ multiple: 'multiple' });
                        },
                        change: function (s) {
                            var files = s.fileInputEl.dom.files;
                            var data = new FormData();

                            if (s.excel) {
                                data.append('files', files[0]);
                                data.append('data', JSON.stringify(s.excel));

                                this.angular.dataService.uploadExcel(data)
                                    .then(data => {
                                        s.reset();
                                        if (!data.error) {
                                            this.angular.getCmp(s.ownerCt.ref).getStore().loadData(data);
                                        }
                                    })
                                    .catch(data => {
                                        s.reset();
                                    });
                            }
                            else {
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
                    }
                });
                fileUpload.angular = this;
                if (c.excel) {
                    fileUpload.excel = c.excel;
                }
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
                    if (this.ref) {
                        let values: string[] = null;
                        for (var i = 1; i < this.items.length; i++) {
                            if (!values) {
                                values = [];
                            }
                            values.push(this.items.get(i).value);
                        }
                        return values;
                    }
                    else {
                        return this.items.get(1).value;
                    }
                };
                cmp.setValue = function (values) {
                    if (this.ref) {
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
                    else {
                        var s = this.uploadField;
                        var imagePath = s.imagePath;
                        imagePath = imagePath + "/" + values;
                        var picBox = s.angular.createPicBox(imagePath);
                        picBox.value = values;
                        this.items.add(picBox);
                        this.updateLayout();
                    }
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