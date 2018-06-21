import { Injectable } from '@angular/core';

declare var Ext: any;

@Injectable()
export class ViewService {
    title: string;
    forms: any[] = [];
    dialogs: any[] = [];
    loading: boolean = false;

    showLoading(): void {
        this.loading = true;
    }

    hideLoading(): void {
        this.loading = false;
    }

    setTitle(title: string): void {
        this.title = title;
    }

    setForm(form: any): void {
        this.clearComponent();

        this.forms = [form];
        Ext.CacheComponents = [{
            id: form.id,
            items: []
        }];
    }

    hasLayer(): boolean {
        return this.forms.length > 1;
    }

    addForm(form: any): void {
        this.forms.push(form);
        Ext.CacheComponents.push({
            id: form.id,
            items: []
        });

        for (let c of Ext.CacheComponents) {
            if (c.tbar) {
                c.tbar.hide();
            }
        }
    }

    addDialog(form: any): void {
        this.dialogs.push(form);
        Ext.CacheComponents.push({
            id: form.id,
            items: [],
            dialog: true
        });
    }

    closeForm(): void {
        var form = this.forms[this.forms.length - 1];
        for (let c of Ext.CacheComponents) {
            if (c.id == form.id) {
                c.items.map(i => {
                    i.destroy();
                });
                if (c.tbar) {
                    c.tbar.destroy();
                }
                break;
            }
        }
        Ext.CacheComponents.pop();
        this.forms.pop();

        var tbar = Ext.CacheComponents[Ext.CacheComponents.length - 1].tbar;
        if (tbar) {
            tbar.show();
        }
    }

    closeDialog(): void {
        var form = this.dialogs[this.dialogs.length - 1];
        for (let c of Ext.CacheComponents) {
            if (c.id == form.id) {
                c.items.map(i => {
                    i.destroy();
                });
                if (c.tbar) {
                    c.tbar.destroy();
                }
                break;
            }
        }
        Ext.CacheComponents.pop();
        this.dialogs.pop();
    }

    setToolbarButtons(id: number, buttons: any[]): void {
        var tbar = Ext.create('Ext.Panel', {
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
            listeners: {
                show: function(t) {
                    setTimeout(() => {
                        t.updateLayout();
                    }, 0);
                }
            },
            items: buttons
        });

        for (let c of Ext.CacheComponents) {
            if (c.id == id) {
                c.tbar = tbar;
            }
            else if (c.tbar) {
                c.tbar.hide();
            }
        }
    }

    setDialogToolbarButtons(id: number, buttons: any[]): void {
        var tbar = Ext.create('Ext.Panel', {
            layout: {
                type: 'hbox',
                pack: 'center'
            },
            cls: 'ext-layout',
            border: false,
            width: '100%',
            renderTo: Ext.get('bbar_' + id),
            defaults: {
                margin: '0 5 0 5'
            },
            listeners: {
                show: function(t) {
                    setTimeout(() => {
                        t.updateLayout();
                    }, 0);
                }
            },
            items: buttons
        });

        for (let c of Ext.CacheComponents) {
            if (c.id == id) {
                c.tbar = tbar;
            }
        }
    }

    addComponent(id: number, component: any): void {
        for (let c of Ext.CacheComponents) {
            if (c.id == id) {
                c.items.push(component);
                break;
            }
        }
    }

    getComponentItems(id: number): any[] {
        for (let c of Ext.CacheComponents) {
            if (c.id == id) {
                return c.items;
            }
        }
        return [];
    }

    clearComponent(): void {        
        Ext.CacheComponents.map(c => {
            c.items.map(i => {
                i.destroy();
            });
            if (c.tbar) {
                c.tbar.destroy();
            }
        });            
        Ext.CacheComponents = [];
    }
}