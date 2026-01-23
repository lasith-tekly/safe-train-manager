/**
 * @fileoverview added by tsickle
 * Generated from: lib/angular/datepicker/closedatepicker.directive.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { Directive, HostListener, Input, ElementRef } from '@angular/core';
var CloseInputDatePickerDirective = /** @class */ (function () {
    function CloseInputDatePickerDirective(elementRef) {
        this.elementRef = elementRef;
    }
    /**
     * @param {?} targetElement
     * @return {?}
     */
    CloseInputDatePickerDirective.prototype.onClick = /**
     * @param {?} targetElement
     * @return {?}
     */
    function (targetElement) {
        /** @type {?} */
        var isConnected = document.body.parentElement.contains(targetElement);
        // targetElement.isConnected to check if it is attached to the DOM
        if (!targetElement || !isConnected || !this.inputDatePicker._cRef) {
            return;
        }
        /** @type {?} */
        var clickedInside = this.inputDatePicker._cRef.location.nativeElement.contains(targetElement);
        /** @type {?} */
        var clickedInsideInput = this.elementRef.nativeElement.contains(targetElement);
        if (!(clickedInside || clickedInsideInput)) {
            this.inputDatePicker.close();
        }
    };
    CloseInputDatePickerDirective.decorators = [
        { type: Directive, args: [{
                    selector: '[closeInputDatePicker]'
                },] }
    ];
    /** @nocollapse */
    CloseInputDatePickerDirective.ctorParameters = function () { return [
        { type: ElementRef }
    ]; };
    CloseInputDatePickerDirective.propDecorators = {
        inputDatePicker: [{ type: Input, args: ['closeInputDatePicker',] }],
        onClick: [{ type: HostListener, args: ['document:click', ['$event.target'],] }, { type: HostListener, args: ['document:keyup', ['$event.target'],] }]
    };
    return CloseInputDatePickerDirective;
}());
export { CloseInputDatePickerDirective };
if (false) {
    /** @type {?} */
    CloseInputDatePickerDirective.prototype.inputDatePicker;
    /**
     * @type {?}
     * @private
     */
    CloseInputDatePickerDirective.prototype.elementRef;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xvc2VkYXRlcGlja2VyLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL2Rlc2lnbi1mYWN0b3J5LXYyLyIsInNvdXJjZXMiOlsibGliL2FuZ3VsYXIvZGF0ZXBpY2tlci9jbG9zZWRhdGVwaWNrZXIuZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUUzRTtJQVFFLHVDQUFvQixVQUFzQjtRQUF0QixlQUFVLEdBQVYsVUFBVSxDQUFZO0lBRTFDLENBQUM7Ozs7O0lBSU0sK0NBQU87Ozs7SUFGZCxVQUVlLGFBQWtCOztZQUN6QixXQUFXLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQztRQUN2RSxrRUFBa0U7UUFDbEUsSUFBSSxDQUFDLGFBQWEsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFO1lBQ2pFLE9BQU87U0FDUjs7WUFDSyxhQUFhLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDOztZQUN6RixrQkFBa0IsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDO1FBQ2hGLElBQUksQ0FBQyxDQUFDLGFBQWEsSUFBSSxrQkFBa0IsQ0FBQyxFQUFFO1lBQzFDLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUM7U0FDOUI7SUFDSCxDQUFDOztnQkF6QkYsU0FBUyxTQUFDO29CQUNULFFBQVEsRUFBRSx3QkFBd0I7aUJBQ25DOzs7O2dCQUp3QyxVQUFVOzs7a0NBT2hELEtBQUssU0FBQyxzQkFBc0I7MEJBTzVCLFlBQVksU0FBQyxnQkFBZ0IsRUFBRSxDQUFDLGVBQWUsQ0FBQyxjQUNoRCxZQUFZLFNBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxlQUFlLENBQUM7O0lBYW5ELG9DQUFDO0NBQUEsQUExQkQsSUEwQkM7U0F2QlksNkJBQTZCOzs7SUFFeEMsd0RBQzRCOzs7OztJQUVoQixtREFBOEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXJlY3RpdmUsIEhvc3RMaXN0ZW5lciwgSW5wdXQsIEVsZW1lbnRSZWYgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nsb3NlSW5wdXREYXRlUGlja2VyXSdcbn0pXG5leHBvcnQgY2xhc3MgQ2xvc2VJbnB1dERhdGVQaWNrZXJEaXJlY3RpdmUge1xuXG4gIEBJbnB1dCgnY2xvc2VJbnB1dERhdGVQaWNrZXInKVxuICBwdWJsaWMgaW5wdXREYXRlUGlja2VyOiBhbnk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBlbGVtZW50UmVmOiBFbGVtZW50UmVmKSB7XG5cbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ2RvY3VtZW50OmNsaWNrJywgWyckZXZlbnQudGFyZ2V0J10pXG4gIEBIb3N0TGlzdGVuZXIoJ2RvY3VtZW50OmtleXVwJywgWyckZXZlbnQudGFyZ2V0J10pXG4gIHB1YmxpYyBvbkNsaWNrKHRhcmdldEVsZW1lbnQ6IGFueSkge1xuICAgIGNvbnN0IGlzQ29ubmVjdGVkID0gZG9jdW1lbnQuYm9keS5wYXJlbnRFbGVtZW50LmNvbnRhaW5zKHRhcmdldEVsZW1lbnQpO1xuICAgIC8vIHRhcmdldEVsZW1lbnQuaXNDb25uZWN0ZWQgdG8gY2hlY2sgaWYgaXQgaXMgYXR0YWNoZWQgdG8gdGhlIERPTVxuICAgIGlmICghdGFyZ2V0RWxlbWVudCB8fCAhaXNDb25uZWN0ZWQgfHwgIXRoaXMuaW5wdXREYXRlUGlja2VyLl9jUmVmKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGNsaWNrZWRJbnNpZGUgPSB0aGlzLmlucHV0RGF0ZVBpY2tlci5fY1JlZi5sb2NhdGlvbi5uYXRpdmVFbGVtZW50LmNvbnRhaW5zKHRhcmdldEVsZW1lbnQpO1xuICAgIGNvbnN0IGNsaWNrZWRJbnNpZGVJbnB1dCA9IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmNvbnRhaW5zKHRhcmdldEVsZW1lbnQpO1xuICAgIGlmICghKGNsaWNrZWRJbnNpZGUgfHwgY2xpY2tlZEluc2lkZUlucHV0KSkge1xuICAgICAgdGhpcy5pbnB1dERhdGVQaWNrZXIuY2xvc2UoKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==