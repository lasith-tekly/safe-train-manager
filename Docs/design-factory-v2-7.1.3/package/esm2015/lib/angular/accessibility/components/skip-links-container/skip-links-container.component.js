/**
 * @fileoverview added by tsickle
 * Generated from: lib/angular/accessibility/components/skip-links-container/skip-links-container.component.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { SkipLinkDirective } from '../../directives/skip-link.directive';
import { Component, ContentChildren, QueryList, ChangeDetectionStrategy, ChangeDetectorRef, } from '@angular/core';
import { merge } from 'rxjs';
export class SkipLinksContainerComponent {
    /**
     * @param {?} changeDetector
     */
    constructor(changeDetector) {
        this.changeDetector = changeDetector;
        this._inFocus = false;
    }
    /**
     * @return {?}
     */
    ngAfterContentInit() {
        if (!this.links.length) {
            return;
        }
        this.focusSubscription = merge(...this.links.map((/**
         * @param {?} link
         * @return {?}
         */
        link => link.inFocus))).subscribe((/**
         * @param {?} focus
         * @return {?}
         */
        (focus) => {
            this._inFocus = focus;
            this.changeDetector.detectChanges();
        }));
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this.focusSubscription.unsubscribe();
    }
}
SkipLinksContainerComponent.decorators = [
    { type: Component, args: [{
                selector: 'df-skip-links-container',
                template: "<section class=\"df-skip-links__section\">\n  <div class=\"df-skip-links\">\n    <div\n      class=\"df-skip-links__wrap list-group\"\n      [class.focus]=\"_inFocus\"\n      (blur)=\"_inFocus=false\"\n    >\n      <ng-content></ng-content>\n    </div>\n  </div>\n</section>\n",
                changeDetection: ChangeDetectionStrategy.OnPush
            }] }
];
/** @nocollapse */
SkipLinksContainerComponent.ctorParameters = () => [
    { type: ChangeDetectorRef }
];
SkipLinksContainerComponent.propDecorators = {
    links: [{ type: ContentChildren, args: [SkipLinkDirective,] }]
};
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2tpcC1saW5rcy1jb250YWluZXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6Im5nOi8vZGVzaWduLWZhY3RvcnktdjIvIiwic291cmNlcyI6WyJsaWIvYW5ndWxhci9hY2Nlc3NpYmlsaXR5L2NvbXBvbmVudHMvc2tpcC1saW5rcy1jb250YWluZXIvc2tpcC1saW5rcy1jb250YWluZXIuY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sc0NBQXNDLENBQUM7QUFDekUsT0FBTyxFQUNMLFNBQVMsRUFDVCxlQUFlLEVBQ2YsU0FBUyxFQUdULHVCQUF1QixFQUN2QixpQkFBaUIsR0FDbEIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLEtBQUssRUFBZ0IsTUFBTSxNQUFNLENBQUM7QUFPM0MsTUFBTSxPQUFPLDJCQUEyQjs7OztJQU90QyxZQUFvQixjQUFpQztRQUFqQyxtQkFBYyxHQUFkLGNBQWMsQ0FBbUI7UUFIckQsYUFBUSxHQUFHLEtBQUssQ0FBQztJQUd1QyxDQUFDOzs7O0lBRXpELGtCQUFrQjtRQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUU7WUFDdEIsT0FBTztTQUNSO1FBQ0QsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEtBQUssQ0FDNUIsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUc7Ozs7UUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUMsQ0FDeEMsQ0FBQyxTQUFTOzs7O1FBQUMsQ0FBQyxLQUFjLEVBQUUsRUFBRTtZQUM3QixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztZQUN0QixJQUFJLENBQUMsY0FBYyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3RDLENBQUMsRUFBQyxDQUFDO0lBQ0wsQ0FBQzs7OztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDdkMsQ0FBQzs7O1lBNUJGLFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQUUseUJBQXlCO2dCQUNuQyxnU0FBb0Q7Z0JBQ3BELGVBQWUsRUFBRSx1QkFBdUIsQ0FBQyxNQUFNO2FBQ2hEOzs7O1lBUkMsaUJBQWlCOzs7b0JBV2hCLGVBQWUsU0FBQyxpQkFBaUI7Ozs7Ozs7SUFBbEMsNENBQzRDOztJQUM1QywrQ0FBaUI7Ozs7O0lBQ2pCLHdEQUF3Qzs7Ozs7SUFFNUIscURBQXlDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2tpcExpbmtEaXJlY3RpdmUgfSBmcm9tICcuLi8uLi9kaXJlY3RpdmVzL3NraXAtbGluay5kaXJlY3RpdmUnO1xuaW1wb3J0IHtcbiAgQ29tcG9uZW50LFxuICBDb250ZW50Q2hpbGRyZW4sXG4gIFF1ZXJ5TGlzdCxcbiAgQWZ0ZXJDb250ZW50SW5pdCxcbiAgT25EZXN0cm95LFxuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgbWVyZ2UsIFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdkZi1za2lwLWxpbmtzLWNvbnRhaW5lcicsXG4gIHRlbXBsYXRlVXJsOiAnLi9za2lwLWxpbmtzLWNvbnRhaW5lci5jb21wb25lbnQuaHRtbCcsXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoXG59KVxuZXhwb3J0IGNsYXNzIFNraXBMaW5rc0NvbnRhaW5lckNvbXBvbmVudFxuICBpbXBsZW1lbnRzIEFmdGVyQ29udGVudEluaXQsIE9uRGVzdHJveSB7XG4gIEBDb250ZW50Q2hpbGRyZW4oU2tpcExpbmtEaXJlY3RpdmUpXG4gIHByaXZhdGUgbGlua3M6IFF1ZXJ5TGlzdDxTa2lwTGlua0RpcmVjdGl2ZT47XG4gIF9pbkZvY3VzID0gZmFsc2U7XG4gIHByaXZhdGUgZm9jdXNTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNoYW5nZURldGVjdG9yOiBDaGFuZ2VEZXRlY3RvclJlZikge31cblxuICBuZ0FmdGVyQ29udGVudEluaXQoKSB7XG4gICAgaWYgKCF0aGlzLmxpbmtzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmZvY3VzU3Vic2NyaXB0aW9uID0gbWVyZ2UoXG4gICAgICAuLi50aGlzLmxpbmtzLm1hcChsaW5rID0+IGxpbmsuaW5Gb2N1cylcbiAgICApLnN1YnNjcmliZSgoZm9jdXM6IGJvb2xlYW4pID0+IHtcbiAgICAgIHRoaXMuX2luRm9jdXMgPSBmb2N1cztcbiAgICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3IuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5mb2N1c1N1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG59XG4iXX0=