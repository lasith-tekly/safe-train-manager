/**
 * @fileoverview added by tsickle
 * Generated from: lib/angular/accessibility/directives/skip-link.directive.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { Output, EventEmitter, Directive, HostListener, HostBinding, } from '@angular/core';
var SkipLinkDirective = /** @class */ (function () {
    function SkipLinkDirective() {
        this.class = 'list-group-item list-group-item-action';
        this.inFocus = new EventEmitter();
    }
    /**
     * @return {?}
     */
    SkipLinkDirective.prototype.onFocus = /**
     * @return {?}
     */
    function () {
        this.inFocus.emit(true);
    };
    /**
     * @return {?}
     */
    SkipLinkDirective.prototype.onBlur = /**
     * @return {?}
     */
    function () {
        this.inFocus.emit(false);
    };
    SkipLinkDirective.decorators = [
        { type: Directive, args: [{
                    selector: '[dfSkipLink]',
                },] }
    ];
    /** @nocollapse */
    SkipLinkDirective.ctorParameters = function () { return []; };
    SkipLinkDirective.propDecorators = {
        class: [{ type: HostBinding }],
        inFocus: [{ type: Output }],
        onFocus: [{ type: HostListener, args: ['focus',] }, { type: HostListener, args: ['click',] }],
        onBlur: [{ type: HostListener, args: ['blur',] }]
    };
    return SkipLinkDirective;
}());
export { SkipLinkDirective };
if (false) {
    /** @type {?} */
    SkipLinkDirective.prototype.class;
    /** @type {?} */
    SkipLinkDirective.prototype.inFocus;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2tpcC1saW5rLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL2Rlc2lnbi1mYWN0b3J5LXYyLyIsInNvdXJjZXMiOlsibGliL2FuZ3VsYXIvYWNjZXNzaWJpbGl0eS9kaXJlY3RpdmVzL3NraXAtbGluay5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxPQUFPLEVBQ0wsTUFBTSxFQUNOLFlBQVksRUFDWixTQUFTLEVBQ1QsWUFBWSxFQUNaLFdBQVcsR0FDWixNQUFNLGVBQWUsQ0FBQztBQUV2QjtJQWlCRTtRQWJlLFVBQUssR0FBRyx3Q0FBd0MsQ0FBQztRQWM5RCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7SUFDcEMsQ0FBQzs7OztJQVZNLG1DQUFPOzs7SUFGZDtRQUdFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzFCLENBQUM7Ozs7SUFFTSxrQ0FBTTs7O0lBRGI7UUFFRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQixDQUFDOztnQkFmRixTQUFTLFNBQUM7b0JBQ1QsUUFBUSxFQUFFLGNBQWM7aUJBQ3pCOzs7Ozt3QkFFRSxXQUFXOzBCQUVYLE1BQU07MEJBQ04sWUFBWSxTQUFDLE9BQU8sY0FDcEIsWUFBWSxTQUFDLE9BQU87eUJBSXBCLFlBQVksU0FBQyxNQUFNOztJQVF0Qix3QkFBQztDQUFBLEFBcEJELElBb0JDO1NBakJZLGlCQUFpQjs7O0lBQzVCLGtDQUFnRTs7SUFFaEUsb0NBQXlDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgT3V0cHV0LFxuICBFdmVudEVtaXR0ZXIsXG4gIERpcmVjdGl2ZSxcbiAgSG9zdExpc3RlbmVyLFxuICBIb3N0QmluZGluZyxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tkZlNraXBMaW5rXScsXG59KVxuZXhwb3J0IGNsYXNzIFNraXBMaW5rRGlyZWN0aXZlIHtcbiAgQEhvc3RCaW5kaW5nKCkgY2xhc3MgPSAnbGlzdC1ncm91cC1pdGVtIGxpc3QtZ3JvdXAtaXRlbS1hY3Rpb24nO1xuXG4gIEBPdXRwdXQoKSBpbkZvY3VzOiBFdmVudEVtaXR0ZXI8Ym9vbGVhbj47XG4gIEBIb3N0TGlzdGVuZXIoJ2ZvY3VzJylcbiAgQEhvc3RMaXN0ZW5lcignY2xpY2snKVxuICBwdWJsaWMgb25Gb2N1cygpIHtcbiAgICB0aGlzLmluRm9jdXMuZW1pdCh0cnVlKTtcbiAgfVxuICBASG9zdExpc3RlbmVyKCdibHVyJylcbiAgcHVibGljIG9uQmx1cigpIHtcbiAgICB0aGlzLmluRm9jdXMuZW1pdChmYWxzZSk7XG4gIH1cblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmluRm9jdXMgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIH1cbn1cbiJdfQ==