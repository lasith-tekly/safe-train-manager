/**
 * @fileoverview added by tsickle
 * Generated from: lib/angular/modal/modal.service.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Injectable, RendererFactory2, NgModule } from '@angular/core';
var DfModalService = /** @class */ (function () {
    function DfModalService(modalService, rendererFactory) {
        this.modalService = modalService;
        this.rendererFactory = rendererFactory;
        this.renderer = rendererFactory.createRenderer(null, null);
    }
    /**
     * @param {?} content
     * @param {?=} options
     * @return {?}
     */
    DfModalService.prototype.open = /**
     * @param {?} content
     * @param {?=} options
     * @return {?}
     */
    function (content, options) {
        var _this = this;
        /** @type {?} */
        var modalRef;
        if (options && options.container) {
            modalRef = this.modalService.open(content, options);
        }
        else {
            modalRef = this.modalService.open(content, Object.assign({}, { container: '.design-factory-v2' }, options));
        }
        // we add the 'df-moda-open' class to the body when the modal is open. We remove it when the modal is closed/dismissed
        this.renderer.addClass(document.body, 'df-modal-open');
        modalRef.result.then((/**
         * @return {?}
         */
        function () {
            _this.renderer.removeClass(document.body, 'df-modal-open');
        }), (/**
         * @return {?}
         */
        function () {
            _this.renderer.removeClass(document.body, 'df-modal-open');
        }));
        return modalRef;
    };
    DfModalService.decorators = [
        { type: Injectable }
    ];
    /** @nocollapse */
    DfModalService.ctorParameters = function () { return [
        { type: NgbModal },
        { type: RendererFactory2 }
    ]; };
    return DfModalService;
}());
export { DfModalService };
if (false) {
    /**
     * @type {?}
     * @private
     */
    DfModalService.prototype.renderer;
    /**
     * @type {?}
     * @private
     */
    DfModalService.prototype.modalService;
    /**
     * @type {?}
     * @private
     */
    DfModalService.prototype.rendererFactory;
}
var DfModalModule = /** @class */ (function () {
    function DfModalModule() {
    }
    /**
     * @return {?}
     */
    DfModalModule.forRoot = /**
     * @return {?}
     */
    function () { return { ngModule: DfModalModule, providers: [DfModalService] }; };
    DfModalModule.decorators = [
        { type: NgModule, args: [{
                    declarations: [],
                    entryComponents: [],
                    providers: [DfModalService]
                },] }
    ];
    return DfModalModule;
}());
export { DfModalModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kYWwuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL2Rlc2lnbi1mYWN0b3J5LXYyLyIsInNvdXJjZXMiOlsibGliL2FuZ3VsYXIvbW9kYWwvbW9kYWwuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUNBLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUN0RCxPQUFPLEVBQUUsVUFBVSxFQUFhLGdCQUFnQixFQUF1QixRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFFdkc7SUFLRSx3QkFBb0IsWUFBc0IsRUFBVSxlQUFpQztRQUFqRSxpQkFBWSxHQUFaLFlBQVksQ0FBVTtRQUFVLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtRQUNuRixJQUFJLENBQUMsUUFBUSxHQUFHLGVBQWUsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVELENBQUM7Ozs7OztJQUVGLDZCQUFJOzs7OztJQUFKLFVBQUssT0FBWSxFQUFFLE9BQXlCO1FBQTVDLGlCQWdCQzs7WUFmSyxRQUFxQjtRQUN2QixJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQ2hDLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDckQ7YUFBTTtZQUNMLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQ3ZELEVBQUUsU0FBUyxFQUFFLG9CQUFvQixFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztTQUNwRDtRQUNELHNIQUFzSDtRQUN0SCxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ3ZELFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSTs7O1FBQUM7WUFDbkIsS0FBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxlQUFlLENBQUMsQ0FBQztRQUM1RCxDQUFDOzs7UUFBRTtZQUNELEtBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDNUQsQ0FBQyxFQUFDLENBQUM7UUFDTCxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDOztnQkF6QkYsVUFBVTs7OztnQkFIRixRQUFRO2dCQUNlLGdCQUFnQjs7SUE0QmhELHFCQUFDO0NBQUEsQUExQkQsSUEwQkM7U0F6QlksY0FBYzs7Ozs7O0lBRXpCLGtDQUE0Qjs7Ozs7SUFFaEIsc0NBQThCOzs7OztJQUFFLHlDQUF5Qzs7QUF1QnZGO0lBQUE7SUFPQSxDQUFDOzs7O0lBRFEscUJBQU87OztJQUFkLGNBQXdDLE9BQU8sRUFBQyxRQUFRLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDOztnQkFOekcsUUFBUSxTQUFDO29CQUNSLFlBQVksRUFBRSxFQUFFO29CQUNoQixlQUFlLEVBQUUsRUFBRTtvQkFDbkIsU0FBUyxFQUFFLENBQUMsY0FBYyxDQUFDO2lCQUM1Qjs7SUFHRCxvQkFBQztDQUFBLEFBUEQsSUFPQztTQUZZLGFBQWEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZ2JNb2RhbE9wdGlvbnMsIE5nYk1vZGFsUmVmIH0gZnJvbSAnQG5nLWJvb3RzdHJhcC9uZy1ib290c3RyYXAvbW9kYWwvbW9kYWwubW9kdWxlJztcbmltcG9ydCB7IE5nYk1vZGFsIH0gZnJvbSAnQG5nLWJvb3RzdHJhcC9uZy1ib290c3RyYXAnO1xuaW1wb3J0IHsgSW5qZWN0YWJsZSwgUmVuZGVyZXIyLCBSZW5kZXJlckZhY3RvcnkyLCBNb2R1bGVXaXRoUHJvdmlkZXJzLCBOZ01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgRGZNb2RhbFNlcnZpY2Uge1xuXG4gIHByaXZhdGUgcmVuZGVyZXI6IFJlbmRlcmVyMjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG1vZGFsU2VydmljZTogTmdiTW9kYWwsIHByaXZhdGUgcmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkyKSB7XG4gICAgdGhpcy5yZW5kZXJlciA9IHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKTtcbiAgIH1cblxuICBvcGVuKGNvbnRlbnQ6IGFueSwgb3B0aW9ucz86IE5nYk1vZGFsT3B0aW9ucyk6IE5nYk1vZGFsUmVmIHtcbiAgICBsZXQgbW9kYWxSZWY6IE5nYk1vZGFsUmVmO1xuICAgICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5jb250YWluZXIpIHtcbiAgICAgICAgbW9kYWxSZWYgPSB0aGlzLm1vZGFsU2VydmljZS5vcGVuKGNvbnRlbnQsIG9wdGlvbnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbW9kYWxSZWYgPSB0aGlzLm1vZGFsU2VydmljZS5vcGVuKGNvbnRlbnQsIE9iamVjdC5hc3NpZ24oe30sXG4gICAgICAgICAgICB7IGNvbnRhaW5lcjogJy5kZXNpZ24tZmFjdG9yeS12MicgfSwgb3B0aW9ucykpO1xuICAgICAgfVxuICAgICAgLy8gd2UgYWRkIHRoZSAnZGYtbW9kYS1vcGVuJyBjbGFzcyB0byB0aGUgYm9keSB3aGVuIHRoZSBtb2RhbCBpcyBvcGVuLiBXZSByZW1vdmUgaXQgd2hlbiB0aGUgbW9kYWwgaXMgY2xvc2VkL2Rpc21pc3NlZFxuICAgICAgdGhpcy5yZW5kZXJlci5hZGRDbGFzcyhkb2N1bWVudC5ib2R5LCAnZGYtbW9kYWwtb3BlbicpO1xuICAgICAgbW9kYWxSZWYucmVzdWx0LnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnJlbW92ZUNsYXNzKGRvY3VtZW50LmJvZHksICdkZi1tb2RhbC1vcGVuJyk7XG4gICAgICB9LCAoKSA9PiB7XG4gICAgICAgIHRoaXMucmVuZGVyZXIucmVtb3ZlQ2xhc3MoZG9jdW1lbnQuYm9keSwgJ2RmLW1vZGFsLW9wZW4nKTtcbiAgICAgIH0pO1xuICAgIHJldHVybiBtb2RhbFJlZjtcbiAgfVxufVxuXG5ATmdNb2R1bGUoe1xuICBkZWNsYXJhdGlvbnM6IFtdLFxuICBlbnRyeUNvbXBvbmVudHM6IFtdLFxuICBwcm92aWRlcnM6IFtEZk1vZGFsU2VydmljZV1cbn0pXG5leHBvcnQgY2xhc3MgRGZNb2RhbE1vZHVsZSB7XG4gIHN0YXRpYyBmb3JSb290KCk6IE1vZHVsZVdpdGhQcm92aWRlcnMgeyByZXR1cm4ge25nTW9kdWxlOiBEZk1vZGFsTW9kdWxlLCBwcm92aWRlcnM6IFtEZk1vZGFsU2VydmljZV19OyB9XG59XG4iXX0=