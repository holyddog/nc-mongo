import { Injectable, Inject } from '@angular/core';
import { TRANSLATION } from '../../translate/translation';

@Injectable()
export class TranslateService {
    public _currentLang: string;

    public get currentLang(): string {
        return this._currentLang;
    }

    // inject our translations
    constructor( @Inject(TRANSLATION) private _translations: any) {
    }

    public use(lang: string): void {
        // set current language
        this._currentLang = lang;
    }

    private translate(key: string): string {
        // private perform translation
        let translation = key;

        if (this._translations[this.currentLang] && this._translations[this.currentLang][key]) {
            return this._translations[this.currentLang][key];
        }

        return translation;
    }

    public instant(key: string): any {
        // call translation
        return this.translate(key);
    }
}

String.prototype['format'] = function () {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined'
            ? args[number]
            : match
            ;
    });
};