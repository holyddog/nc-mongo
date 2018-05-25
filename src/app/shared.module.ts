import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SpinnerElement } from './elements/spinner/spinner.element';

import { TRANSLATION_PROVIDERS }   from './translate/translation';
import { TranslatePipe } from './pipes/translate.pipe';

@NgModule({
    imports: [
        CommonModule,
        FormsModule
    ],
    declarations: [
        TranslatePipe,
        SpinnerElement
    ],
    providers: [
        TRANSLATION_PROVIDERS
    ],
    exports: [
        TranslatePipe,
        SpinnerElement
    ]
})
export class SharedModule { }