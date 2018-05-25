import { Injectable } from '@angular/core';

declare var Ext: any;

@Injectable()
export class ViewService {
    title: string;
    scope: any;

    filter: boolean;
    form: boolean;

    ready(config: any): Promise<any> {        
        // this.filter = false;
        // this.form = false;

        // let keys: string[] = ['ext-filter', 'ext-command_bar', 'ext-form'];
        // for (let i of keys) {
        //     let cmp = Ext.getCmp(i);
        //     if (cmp) {
        //         cmp.destroy();
        //     }
        // }

        if (config.scope)
            this.scope = config.scope;
        // if (config.filter) {
        //     this.filter = true;
        // }

        return new Promise<any>((resolve, reject) => {            
            Ext.onReady(() => {  
                resolve();
            });
        });
    }

    setTitle(title: string): void {
        this.title = title;
    }

    setToolbarButtons(buttons: any[]): void {
        let buttonItems: any[] = [];
        for (let i of buttons) {
            buttonItems.push({
                xtype: 'button',
                text: i.text,
                scale: 'medium',
                cls: 'ext-secondary',
                iconCls: 'fas ' + i.icon + ' fa-1x',
                handler: (i.handler)? i.handler.bind(this.scope): null
            });
        }
        
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
            items: buttonItems
        });

        window.dispatchEvent(new Event('resize'));
    }

    setFilter(options: any): void {
        Ext.create('Ext.form.FieldSet', {
            id: 'ext-filter',
            renderTo: Ext.get('filter'),
            title: 'ค้นหา',
            padding: '10 5 0 5',
            cls: 'ext-layout',
            items: {
                xtype: 'form',
                border: false,
                buttons: [{
                    text: 'ค้นหา',
                    scale: 'medium',
                    margin: 5,
                    iconCls: 'fas fa-search fa-1x',
                    cls: 'ext-primary',
                    handler: function (self) {
                        options.onSearch(self.ownerCt.ownerCt.getForm());
                    }
                }, {
                    text: 'เคลียข้อมูล',
                    scale: 'medium',
                    margin: 5,
                    iconCls: 'fas fa-redo-alt fa-1x',
                    cls: 'ext-primary',
                    handler: function (self) {
                        self.ownerCt.ownerCt.getForm().reset();
                    }
                }],
                buttonAlign: 'center',
                items: options.items
            }
        });
        
        setTimeout(function () {
            window.dispatchEvent(new Event('resize'));
        });
    }

    setForm(options: any): any {
        this.form = true;

        var formButtons: any[] = [];
        if (options.buttons) {
            for (let i of options.buttons) {
                let b: any = {
                    text: i.text,
                    scale: 'medium',
                    margin: 5,
                    iconCls: 'fas ' + i.icon + ' fa-1x',
                    cls: (!i.cls)? 'ext-primary': i.cls,
                    handler: (typeof i.handler == 'function')? i.handler.bind(this.scope): null
                };
                if (i.id) {
                    b.id = i.id;
                }
                formButtons.push(b);
            }
        }

        var form = Ext.create('Ext.form.Panel', {
            border: false,
            items: options.items,
            buttons: formButtons,
            buttonAlign: 'center'
        });

        Ext.create('Ext.panel.Panel', {
            id: 'ext-form',
            renderTo: Ext.get('form'),
            cls: 'ext-layout',
            border: false,
            items: form
        });
        
        setTimeout(function () {
            window.dispatchEvent(new Event('resize'));
        });

        return form;
    }

    loadData(form: any, data: any): void {
        var basicForm = form.getForm();
        for (var i in data) {
            var field = basicForm.findField(i);
            if (field) {
                field.setValue(data[i]);
            }
        }
    }
}