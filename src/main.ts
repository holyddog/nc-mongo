import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

declare var Ext: any;

if (environment.production) {
    enableProdMode();
}

Ext.onReady(() => {
    // Ext.define('ux.ThousandSeperatorNumber', {
    //     //Simple override by Arno Voerman, Februari 2018.
    //     //Extenting the use of currency- and thousand seperator
    //     override: 'Ext.form.field.Number',
    
    //     initComponent: function () {
    //         var me = this;
    
    //         //Modification. The decimal seperator is always different from the thousand seperator
    //         if (me.thousandSeparator) me.decimalSeparator = me.thousandSeparator == ',' ? '.' : ',';
    
    //         //Get focus to remove formatting on editing. Using directly the onFocus will result in a disfunction of the Mousewheeel...
    //         me.mon(me, 'focus', me._onFocus, me);
    
    //         this.callParent();
    //     },
    
    //     valueToRaw: function (value) {
    //         // Extend current routine with formatting the output
    //         var me = this,
    //             decimalSeparator = me.decimalSeparator,
    //             thousandSeparator = me.thousandSeparator;
    //         //value = me.parseValue(value);
    //         value = me.fixPrecision(value);
    //         value = Ext.isNumber(value) ? value : parseFloat(String(value).replace(decimalSeparator, '.'));
    //         value = isNaN(value) ? '' : String(value).replace('.', decimalSeparator);
    
    //         //Add formatting
    //         if (this.thousandSeparator) {
    //             var regX = /(\d+)(\d{3})/;
    //             value = String(value).replace(/^\d+/, function (val) {
    //                 while (regX.test(val)) {
    //                     val = val.replace(regX, '$1' + thousandSeparator + '$2');
    //                 }
    //                 return val;
    //             });
    //         }
    
    //         //Add currency symbol
    //         if (this.currencySymbol) value = this.currencySymbol + ' ' + value;
    
    //         return value;
    //     },
    
    //     parseValue: function (value) {
    //         //Modification. Strip formatting (currency and/or thousandseperator) and eturn 'clean' number
    //         if (this.currencySymbol || this.thousandSeparator) value = String(value).replace(this.currencySymbol, '').replace(this.thousandSeparator, '').trim();
    
    //         value = parseFloat(String(value).replace(this.decimalSeparator, '.'));
    
    //         return isNaN(value) ? null : value;
    //     },
    
    //     _onFocus: function () {
    //         //On focus, remove the formatting to editing (if NOT readOnly)
    //         if (this.readOnly) return;
    
    //         //Get the actual value which is shown in the field
    //         var value = this.getRawValue();
    
    //         //Remove extra formatting including leading and trailing spaces
    //         if (this.currencySymbol || this.thousandSeparator) value = String(value).replace(this.currencySymbol, '').replace(this.thousandSeparator, '').trim();    //.replace('.', this.decimalSeparator);
    
    //         //show Rawvalue in field
    //         this.setRawValue(Ext.isEmpty(value) ? null : value);
    //     }
    // });

    Ext.CacheComponents = [];

    platformBrowserDynamic().bootstrapModule(AppModule);
});