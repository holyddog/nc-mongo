// app/translate/translation.ts

import { InjectionToken } from '@angular/core';

// import translations
import { LANG_EN_TRANS } from './lang-en';
import { LANG_TH_TRANS } from './lang-th';

// translation token
export const TRANSLATION = new InjectionToken<string>('translations');

// providers
export const TRANSLATION_PROVIDERS = [
    {
        provide: TRANSLATION, useValue: {
            'en': LANG_EN_TRANS,
            'th': LANG_TH_TRANS
        }
    }
];