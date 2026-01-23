/**
 * @fileoverview added by tsickle
 * Generated from: lib/angular/accessibility/components/skip-links-container/skip-links-container.component.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import * as tslib_1 from "tslib";
import { SkipLinkDirective } from '../../directives/skip-link.directive';
import { Component, ContentChildren, QueryList, ChangeDetectionStrategy, ChangeDetectorRef, } from '@angular/core';
import { merge } from 'rxjs';
var SkipLinksContainerComponent = /** @class */ (function () {
    function SkipLinksContainerComponent(changeDetector) {
        this.changeDetector = changeDetector;
        this._inFocus = false;
    }
    /**
     * @return {?}
     */
    SkipLinksContainerComponent.prototype.ngAfterContentInit = /**
     * @return {?}
     */
    function () {
        var _this = this;
        if (!this.links.length) {
            return;
        }
        this.focusSubscription = merge.apply(void 0, tslib_1.__spread(this.links.map((/**
         * @param {?} link
         * @return {?}
         */
        function (link) { return link.inFocus; })))).subscribe((/**
         * @param {?} focus
         * @return {?}
         */
        function (focus) {
            _this._inFocus = focus;
            _this.changeDetector.detectChanges();
        }));
    };
    /**
     * @return {?}
     */
    SkipLinksContainerComponent.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        this.focusSubscription.unsubscribe();
    };
    SkipLinksContainerComponent.decorators = [
        { type: Component, args: [{
                    selector: 'df-skip-links-container',
                    template: "<section class=\"df-skip-links__section\">\n  <div class=\"df-skip-links\">\n    <div\n      class=\"df-skip-links__wrap list-group\"\n      [class.focus]=\"_inFocus\"\n      (blur)=\"_inFocus=false\"\n    >\n      <ng-content></ng-content>\n    </div>\n  </div>\n</section>\n",
                    changeDetection: ChangeDetectionStrategy.OnPush
                }] }
    ];
    /** @nocollapse */
    SkipLinksContainerComponent.ctorParameters = function () { return [
        { type: ChangeDetectorRef }
    ]; };
    SkipLinksContainerComponent.propDecorators = {
        links: [{ type: ContentChildren, args: [SkipLinkDirective,] }]
    };
    return SkipLinksContainerComponent;
}());
export { SkipLinksContainerComponent };
if (false) {
    /**
     * @type {?}
     * @private
     */
    SkipLinksContainerComponent.prototype.links;
    /** @type {?} */
    SkipLinksContainerComponent.prototype._inFocus;
    /**
     * @type {?}
     * @private
     */
    SkipLinksContainerComponent.prototype.focusSubscription;
    /**
     * @type {?}
     * @private
     */
    SkipLinksContainerComponent.prototype.changeDetector;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2tpcC1saW5rcy1jb250YWluZXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6Im5nOi8vZGVzaWduLWZhY3RvcnktdjIvIiwic291cmNlcyI6WyJsaWIvYW5ndWxhci9hY2Nlc3NpYmlsaXR5L2NvbXBvbmVudHMvc2tpcC1saW5rcy1jb250YWluZXIvc2tpcC1saW5rcy1jb250YWluZXIuY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHNDQUFzQyxDQUFDO0FBQ3pFLE9BQU8sRUFDTCxTQUFTLEVBQ1QsZUFBZSxFQUNmLFNBQVMsRUFHVCx1QkFBdUIsRUFDdkIsaUJBQWlCLEdBQ2xCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBRSxLQUFLLEVBQWdCLE1BQU0sTUFBTSxDQUFDO0FBRTNDO0lBWUUscUNBQW9CLGNBQWlDO1FBQWpDLG1CQUFjLEdBQWQsY0FBYyxDQUFtQjtRQUhyRCxhQUFRLEdBQUcsS0FBSyxDQUFDO0lBR3VDLENBQUM7Ozs7SUFFekQsd0RBQWtCOzs7SUFBbEI7UUFBQSxpQkFVQztRQVRDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtZQUN0QixPQUFPO1NBQ1I7UUFDRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsS0FBSyxnQ0FDekIsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHOzs7O1FBQUMsVUFBQSxJQUFJLElBQUksT0FBQSxJQUFJLENBQUMsT0FBTyxFQUFaLENBQVksRUFBQyxHQUN2QyxTQUFTOzs7O1FBQUMsVUFBQyxLQUFjO1lBQ3pCLEtBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1lBQ3RCLEtBQUksQ0FBQyxjQUFjLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDdEMsQ0FBQyxFQUFDLENBQUM7SUFDTCxDQUFDOzs7O0lBRUQsaURBQVc7OztJQUFYO1FBQ0UsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ3ZDLENBQUM7O2dCQTVCRixTQUFTLFNBQUM7b0JBQ1QsUUFBUSxFQUFFLHlCQUF5QjtvQkFDbkMsZ1NBQW9EO29CQUNwRCxlQUFlLEVBQUUsdUJBQXVCLENBQUMsTUFBTTtpQkFDaEQ7Ozs7Z0JBUkMsaUJBQWlCOzs7d0JBV2hCLGVBQWUsU0FBQyxpQkFBaUI7O0lBc0JwQyxrQ0FBQztDQUFBLEFBN0JELElBNkJDO1NBeEJZLDJCQUEyQjs7Ozs7O0lBRXRDLDRDQUM0Qzs7SUFDNUMsK0NBQWlCOzs7OztJQUNqQix3REFBd0M7Ozs7O0lBRTVCLHFEQUF5QyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNraXBMaW5rRGlyZWN0aXZlIH0gZnJvbSAnLi4vLi4vZGlyZWN0aXZlcy9za2lwLWxpbmsuZGlyZWN0aXZlJztcbmltcG9ydCB7XG4gIENvbXBvbmVudCxcbiAgQ29udGVudENoaWxkcmVuLFxuICBRdWVyeUxpc3QsXG4gIEFmdGVyQ29udGVudEluaXQsXG4gIE9uRGVzdHJveSxcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENoYW5nZURldGVjdG9yUmVmLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IG1lcmdlLCBTdWJzY3JpcHRpb24gfSBmcm9tICdyeGpzJztcblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnZGYtc2tpcC1saW5rcy1jb250YWluZXInLFxuICB0ZW1wbGF0ZVVybDogJy4vc2tpcC1saW5rcy1jb250YWluZXIuY29tcG9uZW50Lmh0bWwnLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxufSlcbmV4cG9ydCBjbGFzcyBTa2lwTGlua3NDb250YWluZXJDb21wb25lbnRcbiAgaW1wbGVtZW50cyBBZnRlckNvbnRlbnRJbml0LCBPbkRlc3Ryb3kge1xuICBAQ29udGVudENoaWxkcmVuKFNraXBMaW5rRGlyZWN0aXZlKVxuICBwcml2YXRlIGxpbmtzOiBRdWVyeUxpc3Q8U2tpcExpbmtEaXJlY3RpdmU+O1xuICBfaW5Gb2N1cyA9IGZhbHNlO1xuICBwcml2YXRlIGZvY3VzU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjaGFuZ2VEZXRlY3RvcjogQ2hhbmdlRGV0ZWN0b3JSZWYpIHt9XG5cbiAgbmdBZnRlckNvbnRlbnRJbml0KCkge1xuICAgIGlmICghdGhpcy5saW5rcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5mb2N1c1N1YnNjcmlwdGlvbiA9IG1lcmdlKFxuICAgICAgLi4udGhpcy5saW5rcy5tYXAobGluayA9PiBsaW5rLmluRm9jdXMpXG4gICAgKS5zdWJzY3JpYmUoKGZvY3VzOiBib29sZWFuKSA9PiB7XG4gICAgICB0aGlzLl9pbkZvY3VzID0gZm9jdXM7XG4gICAgICB0aGlzLmNoYW5nZURldGVjdG9yLmRldGVjdENoYW5nZXMoKTtcbiAgICB9KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuZm9jdXNTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxufVxuIl19