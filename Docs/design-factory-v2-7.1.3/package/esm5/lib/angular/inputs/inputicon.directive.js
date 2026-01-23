/**
 * @fileoverview added by tsickle
 * Generated from: lib/angular/inputs/inputicon.directive.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { Directive, HostListener, ElementRef, Renderer2, Input } from '@angular/core';
/** @enum {number} */
var DfDirection = {
    'append': 0,
    'prepend': 1,
};
export { DfDirection };
DfDirection[DfDirection['append']] = 'append';
DfDirection[DfDirection['prepend']] = 'prepend';
/**
 * My dfInputIcon directive
 */
var DfInputIconDirective = /** @class */ (function () {
    function DfInputIconDirective(renderer, el) {
        this.renderer = renderer;
        this.el = el;
        this.dfInputIcon = [];
        this.isFocused = false;
    }
    /**
     * @return {?}
     */
    DfInputIconDirective.prototype.ngOnInit = /**
     * @return {?}
     */
    function () {
        var _this = this;
        this.renderer.addClass(this.el.nativeElement, 'df-input-withicon');
        this.dfInputIcon.forEach((/**
         * @param {?} direction
         * @return {?}
         */
        function (direction) {
            _this.renderer.addClass(_this.el.nativeElement, direction.toString());
        }));
    };
    /**
     * onBlur catch blur event to set the focused to false
     * @param e
     */
    /**
     * onBlur catch blur event to set the focused to false
     * @param {?} e
     * @return {?}
     */
    DfInputIconDirective.prototype.onBlur = /**
     * onBlur catch blur event to set the focused to false
     * @param {?} e
     * @return {?}
     */
    function (e) {
        this.isFocused = false;
    };
    /**
     * @param {?} e
     * @return {?}
     */
    DfInputIconDirective.prototype.onFocus = /**
     * @param {?} e
     * @return {?}
     */
    function (e) {
        this.isFocused = true;
    };
    DfInputIconDirective.decorators = [
        { type: Directive, args: [{
                    exportAs: 'dfInputIcon',
                    selector: '[dfInputIcon]'
                },] }
    ];
    /** @nocollapse */
    DfInputIconDirective.ctorParameters = function () { return [
        { type: Renderer2 },
        { type: ElementRef }
    ]; };
    DfInputIconDirective.propDecorators = {
        dfInputIcon: [{ type: Input }],
        onBlur: [{ type: HostListener, args: ['blur', ['$event'],] }],
        onFocus: [{ type: HostListener, args: ['focus', ['$event'],] }]
    };
    return DfInputIconDirective;
}());
export { DfInputIconDirective };
if (false) {
    /** @type {?} */
    DfInputIconDirective.prototype.dfInputIcon;
    /** @type {?} */
    DfInputIconDirective.prototype.isFocused;
    /**
     * @type {?}
     * @private
     */
    DfInputIconDirective.prototype.renderer;
    /**
     * @type {?}
     * @private
     */
    DfInputIconDirective.prototype.el;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXRpY29uLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL2Rlc2lnbi1mYWN0b3J5LXYyLyIsInNvdXJjZXMiOlsibGliL2FuZ3VsYXIvaW5wdXRzL2lucHV0aWNvbi5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBVSxNQUFNLGVBQWUsQ0FBQzs7QUFFOUYsSUFBWSxXQUFXO0lBQ3JCLFFBQVEsR0FBQTtJQUNSLFNBQVMsR0FBQTtFQUNWOzt3QkFGQyxRQUFRLEtBQVIsUUFBUTt3QkFDUixTQUFTLEtBQVQsU0FBUzs7OztBQU1YO0lBU0UsOEJBQW9CLFFBQW1CLEVBQVUsRUFBYztRQUEzQyxhQUFRLEdBQVIsUUFBUSxDQUFXO1FBQVUsT0FBRSxHQUFGLEVBQUUsQ0FBWTtRQUh0RCxnQkFBVyxHQUFrQixFQUFFLENBQUM7UUFFekMsY0FBUyxHQUFHLEtBQUssQ0FBQztJQUNnRCxDQUFDOzs7O0lBRW5FLHVDQUFROzs7SUFBUjtRQUFBLGlCQUtDO1FBSkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUNuRSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU87Ozs7UUFBQyxVQUFBLFNBQVM7WUFDaEMsS0FBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDdEUsQ0FBQyxFQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7OztPQUdHOzs7Ozs7SUFFSCxxQ0FBTTs7Ozs7SUFETixVQUNPLENBQUM7UUFDTixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztJQUN6QixDQUFDOzs7OztJQUdELHNDQUFPOzs7O0lBRFAsVUFDUSxDQUFDO1FBQ1AsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7SUFDeEIsQ0FBQzs7Z0JBOUJGLFNBQVMsU0FBQztvQkFDVCxRQUFRLEVBQUUsYUFBYTtvQkFDdkIsUUFBUSxFQUFFLGVBQWU7aUJBQzFCOzs7O2dCQWI2QyxTQUFTO2dCQUFyQixVQUFVOzs7OEJBZ0J6QyxLQUFLO3lCQWdCTCxZQUFZLFNBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDOzBCQUsvQixZQUFZLFNBQUMsT0FBTyxFQUFFLENBQUMsUUFBUSxDQUFDOztJQUtuQywyQkFBQztDQUFBLEFBaENELElBZ0NDO1NBNUJZLG9CQUFvQjs7O0lBRS9CLDJDQUF5Qzs7SUFFekMseUNBQWtCOzs7OztJQUNOLHdDQUEyQjs7Ozs7SUFBRSxrQ0FBc0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXJlY3RpdmUsIEhvc3RMaXN0ZW5lciwgRWxlbWVudFJlZiwgUmVuZGVyZXIyLCBJbnB1dCwgT25Jbml0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmV4cG9ydCBlbnVtIERmRGlyZWN0aW9uIHtcbiAgJ2FwcGVuZCcsXG4gICdwcmVwZW5kJ1xufVxuXG4vKipcbiAqIE15IGRmSW5wdXRJY29uIGRpcmVjdGl2ZVxuICovXG5ARGlyZWN0aXZlKHtcbiAgZXhwb3J0QXM6ICdkZklucHV0SWNvbicsXG4gIHNlbGVjdG9yOiAnW2RmSW5wdXRJY29uXSdcbn0pXG5leHBvcnQgY2xhc3MgRGZJbnB1dEljb25EaXJlY3RpdmUgaW1wbGVtZW50cyBPbkluaXQge1xuXG4gIEBJbnB1dCgpIGRmSW5wdXRJY29uOiBEZkRpcmVjdGlvbltdID0gW107XG5cbiAgaXNGb2N1c2VkID0gZmFsc2U7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVuZGVyZXI6IFJlbmRlcmVyMiwgcHJpdmF0ZSBlbDogRWxlbWVudFJlZikge31cblxuICBuZ09uSW5pdCgpIHtcbiAgICB0aGlzLnJlbmRlcmVyLmFkZENsYXNzKHRoaXMuZWwubmF0aXZlRWxlbWVudCwgJ2RmLWlucHV0LXdpdGhpY29uJyk7XG4gICAgdGhpcy5kZklucHV0SWNvbi5mb3JFYWNoKGRpcmVjdGlvbiA9PiB7XG4gICAgICB0aGlzLnJlbmRlcmVyLmFkZENsYXNzKHRoaXMuZWwubmF0aXZlRWxlbWVudCwgZGlyZWN0aW9uLnRvU3RyaW5nKCkpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIG9uQmx1ciBjYXRjaCBibHVyIGV2ZW50IHRvIHNldCB0aGUgZm9jdXNlZCB0byBmYWxzZVxuICAgKiBAcGFyYW0gZVxuICAgKi9cbiAgQEhvc3RMaXN0ZW5lcignYmx1cicsIFsnJGV2ZW50J10pXG4gIG9uQmx1cihlKSB7XG4gICAgdGhpcy5pc0ZvY3VzZWQgPSBmYWxzZTtcbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ2ZvY3VzJywgWyckZXZlbnQnXSlcbiAgb25Gb2N1cyhlKSB7XG4gICAgdGhpcy5pc0ZvY3VzZWQgPSB0cnVlO1xuICB9XG5cbn1cbiJdfQ==