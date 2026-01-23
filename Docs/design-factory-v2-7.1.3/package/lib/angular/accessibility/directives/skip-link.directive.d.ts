import { EventEmitter } from '@angular/core';
export declare class SkipLinkDirective {
    class: string;
    inFocus: EventEmitter<boolean>;
    onFocus(): void;
    onBlur(): void;
    constructor();
}
