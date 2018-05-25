import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { FormService } from '../../services/api/form.service';
import { DataService } from '../../services/api/data.service';

import { Config } from '../../../environments/environment';
import { TranslateService } from '../../services/shared/translate.service';

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
    key: any;
    formData: any[] = null;

    constructor(private router: Router, private route: ActivatedRoute, private translate: TranslateService, private formService: FormService, private dataService: DataService) {
    }

    ngOnInit() {
        this.route.params.forEach((params: Params) => {
            this.formId = params['id'];
            this.key = params['key'];

            if (this.formId) {
                this.loading = true;
                this.formService.findById(this.formId)
                    .then(data => {
                        this.loading = false;
                        if (!data.error) {
                            this.prepare(data.data);
                            this.render();

                            this.collection = data.collection;
                            this.pk = (data.pk) ? data.pk : 'id';

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
                                                    if (!this.angular.key) {
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

                            if (this.key) {
                                setTimeout(() => {
                                    this.dataService.findByKey(this.key, this.collection, this.pk)
                                        .then(resultData => {
                                            for (let d in resultData) {
                                                var cmp = Ext.ComponentQuery.query('[name=' + d + ']');
                                                if (cmp && cmp.length) {
                                                    var value = resultData[d];

                                                    if (cmp[0].dataMapping) {
                                                        let mappings: string[] = cmp[0].dataMapping.split('.');
                                                        if (mappings.length > 1) {
                                                            for (var i = 1; i < mappings.length; i++) {
                                                                value = value[mappings[i]];
                                                            }
                                                        }
                                                    }

                                                    cmp[0].setValue(value);
                                                }
                                            }
                                        });
                                }, 0);
                            }
                        }
                        else {
                            this.formData = null;
                        }
                    })
                    .catch(data => {
                        this.formData = null;
                        this.loading = false;
                    });
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
                            if (c.save) {
                                if ((c.insertOnly != true && c.updateOnly != true) || (c.insertOnly == true && !this.key) || (c.updateOnly == true && this.key)) {
                                    let name: string = c.config.name;
                                    var cmp = Ext.ComponentQuery.query('[name=' + name + ']');
                                    if (cmp && cmp.length) {
                                        let value: any = {
                                            field: name,
                                            value: cmp[0].getValue()
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

            var savePromise;
            if (this.key) {
                var filter = {};
                filter[this.pk] = +this.key;
                savePromise = this.formService.update({
                    collection: this.collection,
                    filter: filter,
                    data: data
                });
            }
            else {
                savePromise = this.formService.insert({
                    collection: this.collection,
                    pk: this.pk,
                    data: data
                });
            }

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

    render(): void {
        setTimeout(() => {
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
        }, 0);
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

                    var linkPath = link.getAttribute('routerLink');
                    if (linkPath) {
                        // alert(linkPath);
                        o.ownerGrid.angular.router.navigate([linkPath]);
                    }
                }
            };
            var column = Ext.create('Ext.grid.column.Column', {
                cellWrap: true,
                flex: 1,
                dataIndex: '_data',
                renderer: function (value, metaData, record) {
                    var angular = this.ownerGrid.angular;
                    var tpl = new Ext.XTemplate(
                        this.ownerGrid.tpl,
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
        if (c.data) {
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
                return Ext.create('Ext.form.field.Number', config);
                // break;
            }
            case 'currency': {
                config.hideTrigger = true;
                config.keyNavEnabled = false;
                config.mouseWheelEnabled = false;
                config.fieldStyle = 'text-align: right;';
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
                        render: function(s) {
                            s.fileInputEl.set({ multiple: 'multiple' });
                        },
                        change: function(s) {
                            var files = s.fileInputEl.dom.files;
                            var data = new FormData();
            
                            Ext.each(files, function(f) {
                                data.append('pictures', f);
                            });

                            this.angular.dataService.uploadPicture(data)
                                .then(data => {
                                    for (let i of data) {
                                        var picBox = Ext.create('Ext.Component', {
                                            width: 118,
                                            height: 118,
                                            cls: 'pic-box',
                                            html: `<img src="${Config.FileUrl + i}" /><i class="fas fa-times fa-1x"></i>`,
                                            autoEl: {
                                                tag: 'div'
                                            },
                                            listeners: {
                                                render: function(c) {
                                                    c.getEl().dom.querySelector('i').addEventListener('click', function(e) {
                                                        var owner = c.ownerLayout.owner;
                                                        owner.remove(c);
                                                        owner.setRefValue();
                                                    });
                                                }
                                            }
                                        });
                                        picBox.value = i;
                                        s.ownerCt.items.add(picBox);
                                    }
                                    s.ownerCt.updateLayout();
                                    s.ownerCt.setRefValue();
                                });
                        }
                    }
                });
                fileUpload.angular = this;
                config.items = [
                    fileUpload
                ];
                var cmp = Ext.create('Ext.form.FieldContainer', config);
                cmp.getValue = function() {
                    let values: string[] = null;                    
                    for (var i = 1; i < this.items.length; i++) {
                        if (!values) {
                            values = [];
                        }
                        values.push(this.items.get(i).value);
                    }
                    return values;
                };
                cmp.setValue = function(values) {
                    for (let i of values) {
                        var picBox = Ext.create('Ext.Component', {
                            width: 118,
                            height: 118,
                            cls: 'pic-box',
                            html: `<img src="${Config.FileUrl + i}" /><i class="fas fa-times fa-1x"></i>`,
                            autoEl: {
                                tag: 'div'
                            },
                            listeners: {
                                render: function(c) {
                                    c.getEl().dom.querySelector('i').addEventListener('click', function(e) {
                                        var owner = c.ownerLayout.owner;
                                        owner.remove(c);
                                        owner.setRefValue();
                                    });
                                }
                            }
                        });
                        picBox.value = i;
                        this.items.add(picBox);
                    }
                    this.updateLayout();
                    this.setRefValue();
                }                
                if (c.ref) {
                    cmp.ref = c.ref;
                    cmp.setRefValue = function() {
                        var cmp = Ext.ComponentQuery.query('[name=' + this.ref + ']');
                        if (cmp && cmp.length > 0) {
                            if (this.items.length > 1) {
                                cmp[0].setValue(this.items.get(1).value);
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
            case 'display': {
                return Ext.create('Ext.form.field.Display', config);
                // break;
            }
        }
    }
}
