import { ElementRef, Renderer2, AfterViewInit } from '@angular/core';
export declare class InsertAlertIconDirective implements AfterViewInit {
    private el;
    private renderer;
    constructor(el: ElementRef, renderer: Renderer2);
    ngAfterViewInit(): void;
    getIconClassFromAlertClasses(cssClasses: any): string;
}
