import { ElementRef, Renderer2, OnInit } from '@angular/core';
export declare enum DfDirection {
    'append' = 0,
    'prepend' = 1
}
/**
 * My dfInputIcon directive
 */
export declare class DfInputIconDirective implements OnInit {
    private renderer;
    private el;
    dfInputIcon: DfDirection[];
    isFocused: boolean;
    constructor(renderer: Renderer2, el: ElementRef);
    ngOnInit(): void;
    /**
     * onBlur catch blur event to set the focused to false
     * @param e
     */
    onBlur(e: any): void;
    onFocus(e: any): void;
}
