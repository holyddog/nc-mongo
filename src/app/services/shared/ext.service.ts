import { Injectable } from '@angular/core';

import { Config } from '../../../environments/environment';
import { StorageService } from '../../services/shared/storage.service';

declare var Ext: any;

@Injectable()
export class ExtService {
    message: MessageBox = new MessageBox();

    constructor(private storage: StorageService) { }

    updateLayout(): void {
        window.dispatchEvent(new Event('resize'));
    }

    layoutColumn(fields: any[], config: any = {}): any {
        var rowFields: any[] = [];
        for (let i of fields) {
            i.padding = '0 10 0 10';
            i.labelWidth = 120;

            if (i.allowBlank == false) {
                i.afterLabelTextTpl = [
                    '<span style="color:red" data-qtip="Required"> *</span>'
                ];
            }

            if (i.xtype == 'fieldcontainer' && i.items.length == 2) {
                i.layout = 'hbox';
                i.items.splice(1, 0, {
                    xtype: 'component',
                    padding: '2 5 2 5',
                    html: '-'
                });

                i.items[0].hideLabel = true;
                i.items[0].flex = 1;
                if (i.items[0].xtype == 'datefield') {
                    i.items[0].format = 'd/m/Y';
                    i.items[0].triggers = {
                        clear: {
                            cls: 'x-form-clear-trigger',
                            handler: function () {
                                this.reset();
                            }
                        }
                    };
                }

                i.items[2].hideLabel = true;
                i.items[2].flex = 1;
                if (i.items[2].xtype == 'datefield') {
                    i.items[2].format = 'd/m/Y';
                    i.items[2].triggers = {
                        clear: {
                            cls: 'x-form-clear-trigger',
                            handler: function () {
                                this.reset();
                            }
                        }
                    };
                }
            }

            rowFields.push(i);
        }

        return {
            border: false,
            layout: 'hbox',
            padding: (config.noPadding == true)? '0': '5 0 5 0',
            items: rowFields
        };
    }

    formData(form: any, fields: any[]): any {
        var data = {};
        for (let i of fields) {
            var field = form.findField(i.name);
            if (field) {
                data[i.name] = field.getValue();
            }
        }
        return data;
    }

    combo(options: any): any {
        var config: any = {
            xtype: 'combo',
            anyMatch: true,
            minChars: 0,
            typeAhead: true,
            queryMode: 'local'
        };
        if (options.editable == false) {
            config.typeAhead = false;
        }
        if (options.id) {
            config.id = options.id;
        }
        if (options.hidden) {
            config.hidden = options.hidden;
        }
        return Object.assign(config, options);
    }

    store(options: any): any {
        let proxy: any = {
            type: 'ajax',
            url: Config.ServiceUrl + options.url,
            startParam: 'page',
            limitParam: 'size',
            extraParams: Object.assign({
                page: 1
            }, (options.params) ? options.params : {}),
            reader: {
                type: 'json',
                rootProperty: options.prop.root,
                totalProperty: options.prop.total
            }
        };

        if (options.authen) {
            proxy.headers = { 'Authorization': 'Bearer ' + this.storage.get('access_token') };
        }

        return Ext.create('Ext.data.JsonStore', {
            pageSize: 10,
            autoLoad: (options.autoLoad != false)? true: false,
            listeners: {
                load: function (self) {
                    setTimeout(function () {
                        window.dispatchEvent(new Event('resize'));
                    }, 0);
                }
            },
            proxy: proxy
        });
    }

    column(options: any): any {
        if (!options.config)
            options.config = {};

        if (options.type == 'action') {
            options.xtype = 'actioncolumn';
            options.align = 'center';
            options.width = 50;
            // options.locked = true;
            options.items = [{
                iconCls: 'fas ' + options.icon + ' fa-1x',
                handler: options.handler.bind(options.scope)
            }];
        }
        else if (options.type == 'seq') {
            options.width = 80;
            options.align = 'center';
            options.renderer = (value, metaData, record, rowIndex) => {
                return (rowIndex + 1) + ((record.store.currentPage - 1) * record.store.pageSize);
            };
        }
        else if (options.type == 'datetime') {
            options.renderer = (value) => {
                return Ext.Date.format(new Date(value), 'd/m/Y H:i');
            }
        }
        else if (options.type == 'currency') {
            options.renderer = (value) => {
                return Ext.util.Format.numberRenderer('0,000.00')(value);
            }
        }
        else if (options.type == 'checkbox') {
            options.xtype = 'checkcolumn';
            options.align = 'center';
            options.listeners = {
                beforecheckchange: function () {
                    return false;
                }
            };
        }
        return Object.assign(options, options.config);
    }

    grid(options: any): any {
        if (!options.config)
            options.config = {};

        var docks = [];
        if (options.paging != false) {
            docks = [{
                xtype: 'pagingtoolbar',
                store: options.store,
                dock: 'bottom',
                displayInfo: true,
                displayMsg: 'จำนวนรายการ {0} - {1} of {2}',
                emptyMsg: "ไม่มีรายการ",
                listeners: {
                    beforechange: function (self, page) {
                        self.store.proxy.extraParams.page = page;
                    }
                }
            }];
        }
        else {
            if (!options.store) {
                let fields: any[] = [];
                for (let c of options.columns) {
                    if (c.dataIndex)
                        fields.push(c.dataIndex);
                }
                options.store = Ext.create('Ext.data.Store', {
                    fields: fields
                });
            }
        }

        return Ext.create('Ext.grid.Panel', Object.assign({
            store: options.store,
            minHeight: 300,
            padding: '5 0 5 0',
            columns: options.columns,
            dockedItems: docks,

            sortableColumns: false,
            enableColumnHide: false,
            enableColumnMove: false,
            enableColumnResize: false
        }, options.config ));
    }

    alert(message: string, title: string = 'แจ้งเตือน'): Promise<any> {
        return new Promise<any>((resolve) => {
            Ext.MessageBox.alert(title, message, resolve);
        });
    }
}

class MessageBox {
    alert(message: string, title: string = 'แจ้งเตือน'): Promise<any> {
        return new Promise<any>((resolve) => {
            Ext.MessageBox.alert(title, message, resolve);
        });
    }
    confirm(message: string, title: string = 'ยืนยัน'): Promise<any> {
        return new Promise<any>((resolve) => {
            Ext.MessageBox.confirm(title, message, function(btn){
                if (btn == 'yes'){
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            });
        });
    }
}