/**
 * @fileoverview added by tsickle
 * Generated from: lib/angular/datepicker/closedatepicker.directive.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { Directive, HostListener, Input, ElementRef } from '@angular/core';
export class CloseInputDatePickerDirective {
    /**
     * @param {?} elementRef
     */
    constructor(elementRef) {
        this.elementRef = elementRef;
    }
    /**
     * @param {?} targetElement
     * @return {?}
     */
    onClick(targetElement) {
        /** @type {?} */
        const isConnected = document.body.parentElement.contains(targetElement);
        // targetElement.isConnected to check if it is attached to the DOM
        if (!targetElement || !isConnected || !this.inputDatePicker._cRef) {
            return;
        }
        /** @type {?} */
        const clickedInside = this.inputDatePicker._cRef.location.nativeElement.contains(targetElement);
        /** @type {?} */
        const clickedInsideInput = this.elementRef.nativeElement.contains(targetElement);
        if (!(clickedInside || clickedInsideInput)) {
            this.inputDatePicker.close();
        }
    }
}
CloseInputDatePickerDirective.decorators = [
    { type: Directive, args: [{
                selector: '[closeInputDatePicker]'
            },] }
];
/** @nocollapse */
CloseInputDatePickerDirective.ctorParameters = () => [
    { type: ElementRef }
];
CloseInputDatePickerDirective.propDecorators = {
    inputDatePicker: [{ type: Input, args: ['closeInputDatePicker',] }],
    onClick: [{ type: HostListener, args: ['document:click', ['$event.target'],] }, { type: HostListener, args: ['document:keyup', ['$event.target'],] }]
};
if (false) {
    /** @type {?} */
    CloseInputDatePickerDirective.prototype.inputDatePicker;
    /**
     * @type {?}
     * @private
     */
    CloseInputDatePickerDirective.prototype.elementRef;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xvc2VkYXRlcGlja2VyLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL2Rlc2lnbi1mYWN0b3J5LXYyLyIsInNvdXJjZXMiOlsibGliL2FuZ3VsYXIvZGF0ZXBpY2tlci9jbG9zZWRhdGVwaWNrZXIuZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUszRSxNQUFNLE9BQU8sNkJBQTZCOzs7O0lBS3hDLFlBQW9CLFVBQXNCO1FBQXRCLGVBQVUsR0FBVixVQUFVLENBQVk7SUFFMUMsQ0FBQzs7Ozs7SUFJTSxPQUFPLENBQUMsYUFBa0I7O2NBQ3pCLFdBQVcsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDO1FBQ3ZFLGtFQUFrRTtRQUNsRSxJQUFJLENBQUMsYUFBYSxJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUU7WUFDakUsT0FBTztTQUNSOztjQUNLLGFBQWEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUM7O2NBQ3pGLGtCQUFrQixHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUM7UUFDaEYsSUFBSSxDQUFDLENBQUMsYUFBYSxJQUFJLGtCQUFrQixDQUFDLEVBQUU7WUFDMUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUM5QjtJQUNILENBQUM7OztZQXpCRixTQUFTLFNBQUM7Z0JBQ1QsUUFBUSxFQUFFLHdCQUF3QjthQUNuQzs7OztZQUp3QyxVQUFVOzs7OEJBT2hELEtBQUssU0FBQyxzQkFBc0I7c0JBTzVCLFlBQVksU0FBQyxnQkFBZ0IsRUFBRSxDQUFDLGVBQWUsQ0FBQyxjQUNoRCxZQUFZLFNBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxlQUFlLENBQUM7Ozs7SUFSakQsd0RBQzRCOzs7OztJQUVoQixtREFBOEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXJlY3RpdmUsIEhvc3RMaXN0ZW5lciwgSW5wdXQsIEVsZW1lbnRSZWYgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nsb3NlSW5wdXREYXRlUGlja2VyXSdcbn0pXG5leHBvcnQgY2xhc3MgQ2xvc2VJbnB1dERhdGVQaWNrZXJEaXJlY3RpdmUge1xuXG4gIEBJbnB1dCgnY2xvc2VJbnB1dERhdGVQaWNrZXInKVxuICBwdWJsaWMgaW5wdXREYXRlUGlja2VyOiBhbnk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBlbGVtZW50UmVmOiBFbGVtZW50UmVmKSB7XG5cbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ2RvY3VtZW50OmNsaWNrJywgWyckZXZlbnQudGFyZ2V0J10pXG4gIEBIb3N0TGlzdGVuZXIoJ2RvY3VtZW50OmtleXVwJywgWyckZXZlbnQudGFyZ2V0J10pXG4gIHB1YmxpYyBvbkNsaWNrKHRhcmdldEVsZW1lbnQ6IGFueSkge1xuICAgIGNvbnN0IGlzQ29ubmVjdGVkID0gZG9jdW1lbnQuYm9keS5wYXJlbnRFbGVtZW50LmNvbnRhaW5zKHRhcmdldEVsZW1lbnQpO1xuICAgIC8vIHRhcmdldEVsZW1lbnQuaXNDb25uZWN0ZWQgdG8gY2hlY2sgaWYgaXQgaXMgYXR0YWNoZWQgdG8gdGhlIERPTVxuICAgIGlmICghdGFyZ2V0RWxlbWVudCB8fCAhaXNDb25uZWN0ZWQgfHwgIXRoaXMuaW5wdXREYXRlUGlja2VyLl9jUmVmKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGNsaWNrZWRJbnNpZGUgPSB0aGlzLmlucHV0RGF0ZVBpY2tlci5fY1JlZi5sb2NhdGlvbi5uYXRpdmVFbGVtZW50LmNvbnRhaW5zKHRhcmdldEVsZW1lbnQpO1xuICAgIGNvbnN0IGNsaWNrZWRJbnNpZGVJbnB1dCA9IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmNvbnRhaW5zKHRhcmdldEVsZW1lbnQpO1xuICAgIGlmICghKGNsaWNrZWRJbnNpZGUgfHwgY2xpY2tlZEluc2lkZUlucHV0KSkge1xuICAgICAgdGhpcy5pbnB1dERhdGVQaWNrZXIuY2xvc2UoKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==