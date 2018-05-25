import { Component, Input, HostListener } from '@angular/core';

@Component({
    selector: 'spinner',
    templateUrl: 'spinner.element.html',
    styleUrls: ['spinner.element.css'],
    host: { 'class': 'd-flex flex-column v-center h-center fill-dock' }
})
export class SpinnerElement {
    @Input()
    text: string = "";
}