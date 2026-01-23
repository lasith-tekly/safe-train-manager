/**
 * @fileoverview added by tsickle
 * Generated from: lib/angular/inputs/inputicon.directive.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { Directive, HostListener, ElementRef, Renderer2, Input } from '@angular/core';
/** @enum {number} */
const DfDirection = {
    'append': 0,
    'prepend': 1,
};
export { DfDirection };
DfDirection[DfDirection['append']] = 'append';
DfDirection[DfDirection['prepend']] = 'prepend';
/**
 * My dfInputIcon directive
 */
export class DfInputIconDirective {
    /**
     * @param {?} renderer
     * @param {?} el
     */
    constructor(renderer, el) {
        this.renderer = renderer;
        this.el = el;
        this.dfInputIcon = [];
        this.isFocused = false;
    }
    /**
     * @return {?}
     */
    ngOnInit() {
        this.renderer.addClass(this.el.nativeElement, 'df-input-withicon');
        this.dfInputIcon.forEach((/**
         * @param {?} direction
         * @return {?}
         */
        direction => {
            this.renderer.addClass(this.el.nativeElement, direction.toString());
        }));
    }
    /**
     * onBlur catch blur event to set the focused to false
     * @param {?} e
     * @return {?}
     */
    onBlur(e) {
        this.isFocused = false;
    }
    /**
     * @param {?} e
     * @return {?}
     */
    onFocus(e) {
        this.isFocused = true;
    }
}
DfInputIconDirective.decorators = [
    { type: Directive, args: [{
                exportAs: 'dfInputIcon',
                selector: '[dfInputIcon]'
            },] }
];
/** @nocollapse */
DfInputIconDirective.ctorParameters = () => [
    { type: Renderer2 },
    { type: ElementRef }
];
DfInputIconDirective.propDecorators = {
    dfInputIcon: [{ type: Input }],
    onBlur: [{ type: HostListener, args: ['blur', ['$event'],] }],
    onFocus: [{ type: HostListener, args: ['focus', ['$event'],] }]
};
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXRpY29uLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL2Rlc2lnbi1mYWN0b3J5LXYyLyIsInNvdXJjZXMiOlsibGliL2FuZ3VsYXIvaW5wdXRzL2lucHV0aWNvbi5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBVSxNQUFNLGVBQWUsQ0FBQzs7QUFFOUYsTUFBWSxXQUFXO0lBQ3JCLFFBQVEsR0FBQTtJQUNSLFNBQVMsR0FBQTtFQUNWOzt3QkFGQyxRQUFRLEtBQVIsUUFBUTt3QkFDUixTQUFTLEtBQVQsU0FBUzs7OztBQVVYLE1BQU0sT0FBTyxvQkFBb0I7Ozs7O0lBSy9CLFlBQW9CLFFBQW1CLEVBQVUsRUFBYztRQUEzQyxhQUFRLEdBQVIsUUFBUSxDQUFXO1FBQVUsT0FBRSxHQUFGLEVBQUUsQ0FBWTtRQUh0RCxnQkFBVyxHQUFrQixFQUFFLENBQUM7UUFFekMsY0FBUyxHQUFHLEtBQUssQ0FBQztJQUNnRCxDQUFDOzs7O0lBRW5FLFFBQVE7UUFDTixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBQ25FLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTzs7OztRQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQ25DLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3RFLENBQUMsRUFBQyxDQUFDO0lBQ0wsQ0FBQzs7Ozs7O0lBT0QsTUFBTSxDQUFDLENBQUM7UUFDTixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztJQUN6QixDQUFDOzs7OztJQUdELE9BQU8sQ0FBQyxDQUFDO1FBQ1AsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7SUFDeEIsQ0FBQzs7O1lBOUJGLFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQUUsYUFBYTtnQkFDdkIsUUFBUSxFQUFFLGVBQWU7YUFDMUI7Ozs7WUFiNkMsU0FBUztZQUFyQixVQUFVOzs7MEJBZ0J6QyxLQUFLO3FCQWdCTCxZQUFZLFNBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDO3NCQUsvQixZQUFZLFNBQUMsT0FBTyxFQUFFLENBQUMsUUFBUSxDQUFDOzs7O0lBckJqQywyQ0FBeUM7O0lBRXpDLHlDQUFrQjs7Ozs7SUFDTix3Q0FBMkI7Ozs7O0lBQUUsa0NBQXNCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGlyZWN0aXZlLCBIb3N0TGlzdGVuZXIsIEVsZW1lbnRSZWYsIFJlbmRlcmVyMiwgSW5wdXQsIE9uSW5pdCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5leHBvcnQgZW51bSBEZkRpcmVjdGlvbiB7XG4gICdhcHBlbmQnLFxuICAncHJlcGVuZCdcbn1cblxuLyoqXG4gKiBNeSBkZklucHV0SWNvbiBkaXJlY3RpdmVcbiAqL1xuQERpcmVjdGl2ZSh7XG4gIGV4cG9ydEFzOiAnZGZJbnB1dEljb24nLFxuICBzZWxlY3RvcjogJ1tkZklucHV0SWNvbl0nXG59KVxuZXhwb3J0IGNsYXNzIERmSW5wdXRJY29uRGlyZWN0aXZlIGltcGxlbWVudHMgT25Jbml0IHtcblxuICBASW5wdXQoKSBkZklucHV0SWNvbjogRGZEaXJlY3Rpb25bXSA9IFtdO1xuXG4gIGlzRm9jdXNlZCA9IGZhbHNlO1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlbmRlcmVyOiBSZW5kZXJlcjIsIHByaXZhdGUgZWw6IEVsZW1lbnRSZWYpIHt9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgdGhpcy5yZW5kZXJlci5hZGRDbGFzcyh0aGlzLmVsLm5hdGl2ZUVsZW1lbnQsICdkZi1pbnB1dC13aXRoaWNvbicpO1xuICAgIHRoaXMuZGZJbnB1dEljb24uZm9yRWFjaChkaXJlY3Rpb24gPT4ge1xuICAgICAgdGhpcy5yZW5kZXJlci5hZGRDbGFzcyh0aGlzLmVsLm5hdGl2ZUVsZW1lbnQsIGRpcmVjdGlvbi50b1N0cmluZygpKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBvbkJsdXIgY2F0Y2ggYmx1ciBldmVudCB0byBzZXQgdGhlIGZvY3VzZWQgdG8gZmFsc2VcbiAgICogQHBhcmFtIGVcbiAgICovXG4gIEBIb3N0TGlzdGVuZXIoJ2JsdXInLCBbJyRldmVudCddKVxuICBvbkJsdXIoZSkge1xuICAgIHRoaXMuaXNGb2N1c2VkID0gZmFsc2U7XG4gIH1cblxuICBASG9zdExpc3RlbmVyKCdmb2N1cycsIFsnJGV2ZW50J10pXG4gIG9uRm9jdXMoZSkge1xuICAgIHRoaXMuaXNGb2N1c2VkID0gdHJ1ZTtcbiAgfVxuXG59XG4iXX0=