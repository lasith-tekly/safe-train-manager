/**
 * @fileoverview added by tsickle
 * Generated from: lib/angular/modal/modal.service.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Injectable, RendererFactory2, NgModule } from '@angular/core';
export class DfModalService {
    /**
     * @param {?} modalService
     * @param {?} rendererFactory
     */
    constructor(modalService, rendererFactory) {
        this.modalService = modalService;
        this.rendererFactory = rendererFactory;
        this.renderer = rendererFactory.createRenderer(null, null);
    }
    /**
     * @param {?} content
     * @param {?=} options
     * @return {?}
     */
    open(content, options) {
        /** @type {?} */
        let modalRef;
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
        () => {
            this.renderer.removeClass(document.body, 'df-modal-open');
        }), (/**
         * @return {?}
         */
        () => {
            this.renderer.removeClass(document.body, 'df-modal-open');
        }));
        return modalRef;
    }
}
DfModalService.decorators = [
    { type: Injectable }
];
/** @nocollapse */
DfModalService.ctorParameters = () => [
    { type: NgbModal },
    { type: RendererFactory2 }
];
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
export class DfModalModule {
    /**
     * @return {?}
     */
    static forRoot() { return { ngModule: DfModalModule, providers: [DfModalService] }; }
}
DfModalModule.decorators = [
    { type: NgModule, args: [{
                declarations: [],
                entryComponents: [],
                providers: [DfModalService]
            },] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kYWwuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL2Rlc2lnbi1mYWN0b3J5LXYyLyIsInNvdXJjZXMiOlsibGliL2FuZ3VsYXIvbW9kYWwvbW9kYWwuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUNBLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUN0RCxPQUFPLEVBQUUsVUFBVSxFQUFhLGdCQUFnQixFQUF1QixRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFHdkcsTUFBTSxPQUFPLGNBQWM7Ozs7O0lBSXpCLFlBQW9CLFlBQXNCLEVBQVUsZUFBaUM7UUFBakUsaUJBQVksR0FBWixZQUFZLENBQVU7UUFBVSxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7UUFDbkYsSUFBSSxDQUFDLFFBQVEsR0FBRyxlQUFlLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM1RCxDQUFDOzs7Ozs7SUFFRixJQUFJLENBQUMsT0FBWSxFQUFFLE9BQXlCOztZQUN0QyxRQUFxQjtRQUN2QixJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQ2hDLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDckQ7YUFBTTtZQUNMLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQ3ZELEVBQUUsU0FBUyxFQUFFLG9CQUFvQixFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztTQUNwRDtRQUNELHNIQUFzSDtRQUN0SCxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ3ZELFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSTs7O1FBQUMsR0FBRyxFQUFFO1lBQ3hCLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDNUQsQ0FBQzs7O1FBQUUsR0FBRyxFQUFFO1lBQ04sSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxlQUFlLENBQUMsQ0FBQztRQUM1RCxDQUFDLEVBQUMsQ0FBQztRQUNMLE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7OztZQXpCRixVQUFVOzs7O1lBSEYsUUFBUTtZQUNlLGdCQUFnQjs7Ozs7OztJQUs5QyxrQ0FBNEI7Ozs7O0lBRWhCLHNDQUE4Qjs7Ozs7SUFBRSx5Q0FBeUM7O0FBNEJ2RixNQUFNLE9BQU8sYUFBYTs7OztJQUN4QixNQUFNLENBQUMsT0FBTyxLQUEwQixPQUFPLEVBQUMsUUFBUSxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsQ0FBQyxjQUFjLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQzs7O1lBTnpHLFFBQVEsU0FBQztnQkFDUixZQUFZLEVBQUUsRUFBRTtnQkFDaEIsZUFBZSxFQUFFLEVBQUU7Z0JBQ25CLFNBQVMsRUFBRSxDQUFDLGNBQWMsQ0FBQzthQUM1QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5nYk1vZGFsT3B0aW9ucywgTmdiTW9kYWxSZWYgfSBmcm9tICdAbmctYm9vdHN0cmFwL25nLWJvb3RzdHJhcC9tb2RhbC9tb2RhbC5tb2R1bGUnO1xuaW1wb3J0IHsgTmdiTW9kYWwgfSBmcm9tICdAbmctYm9vdHN0cmFwL25nLWJvb3RzdHJhcCc7XG5pbXBvcnQgeyBJbmplY3RhYmxlLCBSZW5kZXJlcjIsIFJlbmRlcmVyRmFjdG9yeTIsIE1vZHVsZVdpdGhQcm92aWRlcnMsIE5nTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBEZk1vZGFsU2VydmljZSB7XG5cbiAgcHJpdmF0ZSByZW5kZXJlcjogUmVuZGVyZXIyO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgbW9kYWxTZXJ2aWNlOiBOZ2JNb2RhbCwgcHJpdmF0ZSByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTIpIHtcbiAgICB0aGlzLnJlbmRlcmVyID0gcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG51bGwsIG51bGwpO1xuICAgfVxuXG4gIG9wZW4oY29udGVudDogYW55LCBvcHRpb25zPzogTmdiTW9kYWxPcHRpb25zKTogTmdiTW9kYWxSZWYge1xuICAgIGxldCBtb2RhbFJlZjogTmdiTW9kYWxSZWY7XG4gICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmNvbnRhaW5lcikge1xuICAgICAgICBtb2RhbFJlZiA9IHRoaXMubW9kYWxTZXJ2aWNlLm9wZW4oY29udGVudCwgb3B0aW9ucyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtb2RhbFJlZiA9IHRoaXMubW9kYWxTZXJ2aWNlLm9wZW4oY29udGVudCwgT2JqZWN0LmFzc2lnbih7fSxcbiAgICAgICAgICAgIHsgY29udGFpbmVyOiAnLmRlc2lnbi1mYWN0b3J5LXYyJyB9LCBvcHRpb25zKSk7XG4gICAgICB9XG4gICAgICAvLyB3ZSBhZGQgdGhlICdkZi1tb2RhLW9wZW4nIGNsYXNzIHRvIHRoZSBib2R5IHdoZW4gdGhlIG1vZGFsIGlzIG9wZW4uIFdlIHJlbW92ZSBpdCB3aGVuIHRoZSBtb2RhbCBpcyBjbG9zZWQvZGlzbWlzc2VkXG4gICAgICB0aGlzLnJlbmRlcmVyLmFkZENsYXNzKGRvY3VtZW50LmJvZHksICdkZi1tb2RhbC1vcGVuJyk7XG4gICAgICBtb2RhbFJlZi5yZXN1bHQudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMucmVuZGVyZXIucmVtb3ZlQ2xhc3MoZG9jdW1lbnQuYm9keSwgJ2RmLW1vZGFsLW9wZW4nKTtcbiAgICAgIH0sICgpID0+IHtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5yZW1vdmVDbGFzcyhkb2N1bWVudC5ib2R5LCAnZGYtbW9kYWwtb3BlbicpO1xuICAgICAgfSk7XG4gICAgcmV0dXJuIG1vZGFsUmVmO1xuICB9XG59XG5cbkBOZ01vZHVsZSh7XG4gIGRlY2xhcmF0aW9uczogW10sXG4gIGVudHJ5Q29tcG9uZW50czogW10sXG4gIHByb3ZpZGVyczogW0RmTW9kYWxTZXJ2aWNlXVxufSlcbmV4cG9ydCBjbGFzcyBEZk1vZGFsTW9kdWxlIHtcbiAgc3RhdGljIGZvclJvb3QoKTogTW9kdWxlV2l0aFByb3ZpZGVycyB7IHJldHVybiB7bmdNb2R1bGU6IERmTW9kYWxNb2R1bGUsIHByb3ZpZGVyczogW0RmTW9kYWxTZXJ2aWNlXX07IH1cbn1cbiJdfQ==