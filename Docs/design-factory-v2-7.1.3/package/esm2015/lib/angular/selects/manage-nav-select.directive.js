/**
 * @fileoverview added by tsickle
 * Generated from: lib/angular/selects/manage-nav-select.directive.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { Directive, Host, ElementRef, HostListener, Input, HostBinding, Renderer2 } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import { DfDirectionDetectionService, RightToLeftDirectionEnum } from '../right-to-left/directionDetection.service';
/** @type {?} */
const DF_SELECT_CLASS = 'df-ym';
// Put to avoid opening of the select after removal
// See why in file https://github.com/ng-select/ng-select/blob/57c6671a972d23beddcca2b6acc9418544c17a2e/src/ng-select/ng-select.component.ts#L307
/** @type {?} */
const NG_SELECT_CLASS_IDENTIFIER = 'ng-value-icon';
export class dfManageBadgeEventsDirective {
    /**
     * @param {?} renderer
     * @param {?} element
     */
    constructor(renderer, element) {
        this.renderer = renderer;
        this.element = element;
        this.tabindex = '-1';
        this.renderer.addClass(this.element.nativeElement, DF_SELECT_CLASS);
        this.renderer.addClass(this.element.nativeElement, NG_SELECT_CLASS_IDENTIFIER);
    }
    /**
     * @return {?}
     */
    ngAfterViewInit() {
        /** @type {?} */
        const childs = this.element.nativeElement.children;
        /** @type {?} */
        const map = Array.from(childs);
        map.forEach((/**
         * @param {?} element
         * @return {?}
         */
        element => {
            this.renderer.addClass(element, NG_SELECT_CLASS_IDENTIFIER);
        }));
    }
    /**
     * @param {?} event
     * @return {?}
     */
    handleKeyDownBackspace(event) {
        this.dfManageBadgeEventsSelect[0](this.dfManageBadgeEventsSelect[1]);
        event.stopPropagation();
    }
    /**
     * @param {?} event
     * @return {?}
     */
    handleClick(event) {
        this.dfManageBadgeEventsSelect[0](this.dfManageBadgeEventsSelect[1]);
        event.stopPropagation();
    }
    /**
     * @param {?} event
     * @return {?}
     */
    handleKeyDownEnter(event) {
        this.dfManageBadgeEventsSelect[0](this.dfManageBadgeEventsSelect[1]);
        event.stopPropagation();
    }
    /**
     * @param {?} event
     * @return {?}
     */
    handleKeyDownDelete(event) {
        this.dfManageBadgeEventsSelect[0](this.dfManageBadgeEventsSelect[1]);
        event.stopPropagation();
    }
}
dfManageBadgeEventsDirective.decorators = [
    { type: Directive, args: [{
                selector: '[dfManageBadgeEventsSelect]'
            },] }
];
/** @nocollapse */
dfManageBadgeEventsDirective.ctorParameters = () => [
    { type: Renderer2 },
    { type: ElementRef }
];
dfManageBadgeEventsDirective.propDecorators = {
    dfManageBadgeEventsSelect: [{ type: Input }],
    tabindex: [{ type: HostBinding, args: ['attr.tabindex',] }],
    handleKeyDownBackspace: [{ type: HostListener, args: ['keydown.Backspace', ['$event'],] }],
    handleClick: [{ type: HostListener, args: ['click', ['$event'],] }],
    handleKeyDownEnter: [{ type: HostListener, args: ['keydown.Enter', ['$event'],] }],
    handleKeyDownDelete: [{ type: HostListener, args: ['keydown.Delete', ['$event'],] }]
};
if (false) {
    /** @type {?} */
    dfManageBadgeEventsDirective.prototype.dfManageBadgeEventsSelect;
    /** @type {?} */
    dfManageBadgeEventsDirective.prototype.tabindex;
    /**
     * @type {?}
     * @private
     */
    dfManageBadgeEventsDirective.prototype.renderer;
    /**
     * @type {?}
     * @private
     */
    dfManageBadgeEventsDirective.prototype.element;
}
export class dfManageNavSelectDirective {
    /**
     * @param {?} select
     * @param {?} element
     * @param {?} rtlDirectionService
     */
    constructor(select, element, rtlDirectionService) {
        this.select = select;
        this.element = element;
        this.rtlDirectionService = rtlDirectionService;
    }
    /**
     * @return {?}
     */
    ngOnInit() {
        this.direction = this.rtlDirectionService.getPageDirection(this.element);
    }
    /**
     * @param {?} event
     * @return {?}
     */
    handleKeyDown(event) {
        if (this.direction === RightToLeftDirectionEnum.LeftToRight) {
            this.arrowLeftInnerHandler(event);
        }
        else {
            this.arrowRightInnerHandler(event);
        }
    }
    /**
     * @param {?} event
     * @return {?}
     */
    handleKeyDownBackspace(event) {
        // Clear on backspace is already handled by ng select when clearable is true
        if (!this.select.clearable && !this.select.searchTerm) {
            /** @type {?} */
            const listBadge = this.element.nativeElement.querySelectorAll(`.${DF_SELECT_CLASS}`);
            if (listBadge.length > 0) {
                listBadge[listBadge.length - 1].click();
            }
        }
    }
    /**
     * @param {?} event
     * @return {?}
     */
    handleKeyDownRight(event) {
        if (this.direction === RightToLeftDirectionEnum.LeftToRight) {
            this.arrowRightInnerHandler(event);
        }
        else {
            this.arrowLeftInnerHandler(event);
        }
    }
    /**
     * @param {?} event
     * @return {?}
     */
    arrowRightInnerHandler(event) {
        /** @type {?} */
        const listBadge = this.element.nativeElement.querySelectorAll(`.${DF_SELECT_CLASS}`);
        /** @type {?} */
        const currentPos = Array.prototype.indexOf.call(listBadge, document.activeElement);
        // Test if the focus is in the list (otherwise it is in the input and we do nothing)
        if (currentPos !== -1) {
            if (currentPos === listBadge.length - 1) {
                this.select.focus();
            }
            else {
                (listBadge[currentPos + 1] || document.activeElement).focus();
            }
        }
        else if (event.target.selectionStart === event.target.selectionEnd &&
            event.target.nodeName === 'INPUT' && event.target.selectionStart === event.target.value.length) {
            /** @type {?} */
            const clearEl = this.element.nativeElement.querySelector('.ng-clear-wrapper') ||
                this.element.nativeElement.querySelector('.ng-clear');
            clearEl.focus();
        }
    }
    /**
     * @param {?} event
     * @return {?}
     */
    arrowLeftInnerHandler(event) {
        /** @type {?} */
        const listBadge = this.element.nativeElement.querySelectorAll(`.${DF_SELECT_CLASS}`);
        if (event.target.selectionStart === event.target.selectionEnd &&
            event.target.selectionStart === 0 && event.target.nodeName === 'INPUT') {
            if (listBadge.length > 0) {
                listBadge[listBadge.length - 1].focus();
            }
        }
        else if (event.target.classList.contains('ng-clear-wrapper') || event.target.classList.contains('ng-clear')) {
            this.select.focus();
        }
        else {
            /** @type {?} */
            const currentPos = Array.prototype.indexOf.call(listBadge, document.activeElement);
            (listBadge[currentPos - 1] || document.activeElement).focus();
        }
    }
}
dfManageNavSelectDirective.decorators = [
    { type: Directive, args: [{
                selector: '[dfManageNavSelect]'
            },] }
];
/** @nocollapse */
dfManageNavSelectDirective.ctorParameters = () => [
    { type: NgSelectComponent, decorators: [{ type: Host }] },
    { type: ElementRef },
    { type: DfDirectionDetectionService }
];
dfManageNavSelectDirective.propDecorators = {
    handleKeyDown: [{ type: HostListener, args: ['keydown.ArrowLeft', ['$event'],] }],
    handleKeyDownBackspace: [{ type: HostListener, args: ['keydown.Backspace', ['$event'],] }],
    handleKeyDownRight: [{ type: HostListener, args: ['keydown.ArrowRight', ['$event'],] }]
};
if (false) {
    /**
     * @type {?}
     * @private
     */
    dfManageNavSelectDirective.prototype.direction;
    /**
     * @type {?}
     * @private
     */
    dfManageNavSelectDirective.prototype.select;
    /**
     * @type {?}
     * @private
     */
    dfManageNavSelectDirective.prototype.element;
    /**
     * @type {?}
     * @private
     */
    dfManageNavSelectDirective.prototype.rtlDirectionService;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuYWdlLW5hdi1zZWxlY3QuZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vZGVzaWduLWZhY3RvcnktdjIvIiwic291cmNlcyI6WyJsaWIvYW5ndWxhci9zZWxlY3RzL21hbmFnZS1uYXYtc2VsZWN0LmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQXlCLE1BQU0sZUFBZSxDQUFDO0FBQ2hJLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQ3pELE9BQU8sRUFBRSwyQkFBMkIsRUFBRSx3QkFBd0IsRUFBRSxNQUFNLDZDQUE2QyxDQUFDOztNQUU5RyxlQUFlLEdBQUcsT0FBTzs7OztNQUd6QiwwQkFBMEIsR0FBRyxlQUFlO0FBS2xELE1BQU0sT0FBTyw0QkFBNEI7Ozs7O0lBSXZDLFlBQW9CLFFBQW1CLEVBQVUsT0FBbUI7UUFBaEQsYUFBUSxHQUFSLFFBQVEsQ0FBVztRQUFVLFlBQU8sR0FBUCxPQUFPLENBQVk7UUFhdEMsYUFBUSxHQUFHLElBQUksQ0FBQztRQVo1QyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUNwRSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO0lBQ2pGLENBQUM7Ozs7SUFFRCxlQUFlOztjQUNQLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxRQUFROztjQUM1QyxHQUFHLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDOUIsR0FBRyxDQUFDLE9BQU87Ozs7UUFBQyxPQUFPLENBQUMsRUFBRTtZ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USxFQUFFLHFCQUFxQjthQUNoQzs7OztZQXJEUSxpQkFBaUIsdUJBeURYLElBQUk7WUExRE8sVUFBVTtZQUUzQiwyQkFBMkI7Ozs0QkErRGpDLFlBQVksU0FBQyxtQkFBbUIsRUFBRSxDQUFDLFFBQVEsQ0FBQztxQ0FTNUMsWUFBWSxTQUFDLG1CQUFtQixFQUFFLENBQUMsUUFBUSxDQUFDO2lDQVU1QyxZQUFZLFNBQUMsb0JBQW9CLEVBQUUsQ0FBQyxRQUFRLENBQUM7Ozs7Ozs7SUE1QjlDLCtDQUEwQjs7Ozs7SUFFZCw0Q0FBeUM7Ozs7O0lBQUUsNkNBQTJCOzs7OztJQUNoRix5REFBd0QiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXJlY3RpdmUsIEhvc3QsIEVsZW1lbnRSZWYsIEhvc3RMaXN0ZW5lciwgSW5wdXQsIEhvc3RCaW5kaW5nLCBSZW5kZXJlcjIsIEFmdGVyVmlld0luaXQsIE9uSW5pdCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgTmdTZWxlY3RDb21wb25lbnQgfSBmcm9tICdAbmctc2VsZWN0L25nLXNlbGVjdCc7XG5pbXBvcnQgeyBEZkRpcmVjdGlvbkRldGVjdGlvblNlcnZpY2UsIFJpZ2h0VG9MZWZ0RGlyZWN0aW9uRW51bSB9IGZyb20gJy4uL3JpZ2h0LXRvLWxlZnQvZGlyZWN0aW9uRGV0ZWN0aW9uLnNlcnZpY2UnO1xuXG5jb25zdCBERl9TRUxFQ1RfQ0xBU1MgPSAnZGYteW0nO1xuLy8gUHV0IHRvIGF2b2lkIG9wZW5pbmcgb2YgdGhlIHNlbGVjdCBhZnRlciByZW1vdmFsXG4vLyBTZWUgd2h5IGluIGZpbGUgaHR0cHM6Ly9naXRodWIuY29tL25nLXNlbGVjdC9uZy1zZWxlY3QvYmxvYi81N2M2NjcxYTk3MmQyM2JlZGRjY2EyYjZhY2M5NDE4NTQ0YzE3YTJlL3NyYy9uZy1zZWxlY3Qvbmctc2VsZWN0LmNvbXBvbmVudC50cyNMMzA3XG5jb25zdCBOR19TRUxFQ1RfQ0xBU1NfSURFTlRJRklFUiA9ICduZy12YWx1ZS1pY29uJztcblxuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2RmTWFuYWdlQmFkZ2VFdmVudHNTZWxlY3RdJ1xufSlcbmV4cG9ydCBjbGFzcyBkZk1hbmFnZUJhZGdlRXZlbnRzRGlyZWN0aXZlIGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCB7XG4gIEBJbnB1dCgpXG4gIGRmTWFuYWdlQmFkZ2VFdmVudHNTZWxlY3Q6IFtGdW5jdGlvbiwgYW55XTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlbmRlcmVyOiBSZW5kZXJlcjIsIHByaXZhdGUgZWxlbWVudDogRWxlbWVudFJlZikge1xuICAgIHRoaXMucmVuZGVyZXIuYWRkQ2xhc3ModGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQsIERGX1NFTEVDVF9DTEFTUyk7XG4gICAgdGhpcy5yZW5kZXJlci5hZGRDbGFzcyh0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudCwgTkdfU0VMRUNUX0NMQVNTX0lERU5USUZJRVIpO1xuICB9XG5cbiAgbmdBZnRlclZpZXdJbml0KCkge1xuICAgIGNvbnN0IGNoaWxkcyA9IHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LmNoaWxkcmVuO1xuICAgIGNvbnN0IG1hcCA9IEFycmF5LmZyb20oY2hpbGRzKTtcbiAgICBtYXAuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgIHRoaXMucmVuZGVyZXIuYWRkQ2xhc3MoZWxlbWVudCwgTkdfU0VMRUNUX0NMQVNTX0lERU5USUZJRVIpO1xuICAgIH0pO1xuICB9XG5cbiAgQEhvc3RCaW5kaW5nKCdhdHRyLnRhYmluZGV4JykgdGFiaW5kZXggPSAnLTEnO1xuXG4gIEBIb3N0TGlzdGVuZXIoJ2tleWRvd24uQmFja3NwYWNlJywgWyckZXZlbnQnXSkgaGFuZGxlS2V5RG93bkJhY2tzcGFjZShldmVudDogYW55KSB7XG4gICAgdGhpcy5kZk1hbmFnZUJhZGdlRXZlbnRzU2VsZWN0WzBdKHRoaXMuZGZNYW5hZ2VCYWRnZUV2ZW50c1NlbGVjdFsxXSk7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH1cblxuICBASG9zdExpc3RlbmVyKCdjbGljaycsIFsnJGV2ZW50J10pIGhhbmRsZUNsaWNrKGV2ZW50OiBhbnkpIHtcbiAgICB0aGlzLmRmTWFuYWdlQmFkZ2VFdmVudHNTZWxlY3RbMF0odGhpcy5kZk1hbmFnZUJhZGdlRXZlbnRzU2VsZWN0WzFdKTtcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ2tleWRvd24uRW50ZXInLCBbJyRldmVudCddKSBoYW5kbGVLZXlEb3duRW50ZXIoZXZlbnQ6IGFueSkge1xuICAgIHRoaXMuZGZNYW5hZ2VCYWRnZUV2ZW50c1NlbGVjdFswXSh0aGlzLmRmTWFuYWdlQmFkZ2VFdmVudHNTZWxlY3RbMV0pO1xuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICB9XG5cbiAgQEhvc3RMaXN0ZW5lcigna2V5ZG93bi5EZWxldGUnLCBbJyRldmVudCddKSBoYW5kbGVLZXlEb3duRGVsZXRlKGV2ZW50OiBhbnkpIHtcbiAgICB0aGlzLmRmTWFuYWdlQmFkZ2VFdmVudHNTZWxlY3RbMF0odGhpcy5kZk1hbmFnZUJhZGdlRXZlbnRzU2VsZWN0WzFdKTtcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfVxufVxuXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbZGZNYW5hZ2VOYXZTZWxlY3RdJ1xufSlcbmV4cG9ydCBjbGFzcyBkZk1hbmFnZU5hdlNlbGVjdERpcmVjdGl2ZSBpbXBsZW1lbnRzIE9uSW5pdCB7XG4gIHByaXZhdGUgZGlyZWN0aW9uOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoQEhvc3QoKSBwcml2YXRlIHNlbGVjdDogTmdTZWxlY3RDb21wb25lbnQsIHByaXZhdGUgZWxlbWVudDogRWxlbWVudFJlZixcbiAgICBwcml2YXRlIHJ0bERpcmVjdGlvblNlcnZpY2U6IERmRGlyZWN0aW9uRGV0ZWN0aW9uU2VydmljZSkgeyB9XG5cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5kaXJlY3Rpb24gPSB0aGlzLnJ0bERpcmVjdGlvblNlcnZpY2UuZ2V0UGFnZURpcmVjdGlvbih0aGlzLmVsZW1lbnQpO1xuICB9XG5cbiAgQEhvc3RMaXN0ZW5lcigna2V5ZG93bi5BcnJvd0xlZnQnLCBbJyRldmVudCddKVxuICBoYW5kbGVLZXlEb3duKGV2ZW50OiBhbnkpIHtcbiAgICBpZiAodGhpcy5kaXJlY3Rpb24gPT09IFJpZ2h0VG9MZWZ0RGlyZWN0aW9uRW51bS5MZWZ0VG9SaWdodCkge1xuICAgICAgdGhpcy5hcnJvd0xlZnRJbm5lckhhbmRsZXIoZXZlbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFycm93UmlnaHRJbm5lckhhbmRsZXIoZXZlbnQpO1xuICAgIH1cbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ2tleWRvd24uQmFja3NwYWNlJywgWyckZXZlbnQnXSkgaGFuZGxlS2V5RG93bkJhY2tzcGFjZShldmVudDogYW55KSB7XG4gICAgLy8gQ2xlYXIgb24gYmFja3NwYWNlIGlzIGFscmVhZHkgaGFuZGxlZCBieSBuZyBzZWxlY3Qgd2hlbiBjbGVhcmFibGUgaXMgdHJ1ZVxuICAgIGlmICghdGhpcy5zZWxlY3QuY2xlYXJhYmxlICYmICF0aGlzLnNlbGVjdC5zZWFyY2hUZXJtKSB7XG4gICAgICBjb25zdCBsaXN0QmFkZ2UgPSB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKGAuJHtERl9TRUxFQ1RfQ0xBU1N9YCk7XG4gICAgICBpZiAobGlzdEJhZGdlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGlzdEJhZGdlW2xpc3RCYWRnZS5sZW5ndGggLSAxXS5jbGljaygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ2tleWRvd24uQXJyb3dSaWdodCcsIFsnJGV2ZW50J10pXG4gIGhhbmRsZUtleURvd25SaWdodChldmVudDogYW55KSB7XG4gICAgaWYgKHRoaXMuZGlyZWN0aW9uID09PSBSaWdodFRvTGVmdERpcmVjdGlvbkVudW0uTGVmdFRvUmlnaHQpe1xuICAgICAgdGhpcy5hcnJvd1JpZ2h0SW5uZXJIYW5kbGVyKGV2ZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hcnJvd0xlZnRJbm5lckhhbmRsZXIoZXZlbnQpO1xuICAgIH1cbiAgfVxuXG4gIGFycm93UmlnaHRJbm5lckhhbmRsZXIoZXZlbnQ6IGFueSkge1xuICAgIGNvbnN0IGxpc3RCYWRnZSA9IHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC4ke0RGX1NFTEVDVF9DTEFTU31gKTtcbiAgICBjb25zdCBjdXJyZW50UG9zID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChsaXN0QmFkZ2UsIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpO1xuICAgIC8vIFRlc3QgaWYgdGhlIGZvY3VzIGlzIGluIHRoZSBsaXN0IChvdGhlcndpc2UgaXQgaXMgaW4gdGhlIGlucHV0IGFuZCB3ZSBkbyBub3RoaW5nKVxuICAgIGlmIChjdXJyZW50UG9zICE9PSAtMSkge1xuICAgICAgaWYgKGN1cnJlbnRQb3MgPT09IGxpc3RCYWRnZS5sZW5ndGggLSAxKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0LmZvY3VzKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAobGlzdEJhZGdlW2N1cnJlbnRQb3MgKyAxXSB8fCBkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5mb2N1cygpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZXZlbnQudGFyZ2V0LnNlbGVjdGlvblN0YXJ0ID09PSBldmVudC50YXJnZXQuc2VsZWN0aW9uRW5kICYmXG4gICAgICAgZXZlbnQudGFyZ2V0Lm5vZGVOYW1lID09PSAnSU5QVVQnICYmIGV2ZW50LnRhcmdldC5zZWxlY3Rpb25TdGFydCA9PT0gZXZlbnQudGFyZ2V0LnZhbHVlLmxlbmd0aCkge1xuICAgICAgY29uc3QgY2xlYXJFbCA9IHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5uZy1jbGVhci13cmFwcGVyJykgfHxcbiAgICAgICB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC5xdWVyeVNlbGVjdG9yKCcubmctY2xlYXInKTtcbiAgICAgIGNsZWFyRWwuZm9jdXMoKTtcbiAgICB9XG4gIH1cblxuICBhcnJvd0xlZnRJbm5lckhhbmRsZXIoZXZlbnQ6IGFueSkge1xuICAgIGNvbnN0IGxpc3RCYWRnZSA9IHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC4ke0RGX1NFTEVDVF9DTEFTU31gKTtcbiAgICBpZiAoZXZlbnQudGFyZ2V0LnNlbGVjdGlvblN0YXJ0ID09PSBldmVudC50YXJnZXQuc2VsZWN0aW9uRW5kICYmXG4gICAgICAgZXZlbnQudGFyZ2V0LnNlbGVjdGlvblN0YXJ0ID09PSAwICYmIGV2ZW50LnRhcmdldC5ub2RlTmFtZSA9PT0gJ0lOUFVUJykge1xuICAgICAgaWYgKGxpc3RCYWRnZS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpc3RCYWRnZVtsaXN0QmFkZ2UubGVuZ3RoIC0gMV0uZm9jdXMoKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ25nLWNsZWFyLXdyYXBwZXInKSB8fCBldmVudC50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCduZy1jbGVhcicpKSB7XG4gICAgICB0aGlzLnNlbGVjdC5mb2N1cygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjdXJyZW50UG9zID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChsaXN0QmFkZ2UsIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpO1xuICAgICAgKGxpc3RCYWRnZVtjdXJyZW50UG9zIC0gMV0gfHwgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuZm9jdXMoKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==