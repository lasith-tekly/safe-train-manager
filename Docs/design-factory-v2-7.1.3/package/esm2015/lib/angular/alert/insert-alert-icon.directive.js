/**
 * @fileoverview added by tsickle
 * Generated from: lib/angular/alert/insert-alert-icon.directive.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { Directive, ElementRef, Renderer2 } from '@angular/core';
export class InsertAlertIconDirective {
    /**
     * @param {?} el
     * @param {?} renderer
     */
    constructor(el, renderer) {
        this.el = el;
        this.renderer = renderer;
    }
    /**
     * @return {?}
     */
    ngAfterViewInit() {
        /** @type {?} */
        const alertClasses = this.el.nativeElement.classList;
        // we create the HTML icon element with the renderer
        /** @type {?} */
        const iconEl = this.renderer.createElement('span');
        this.renderer.addClass(iconEl, 'alert-icon');
        this.renderer.addClass(iconEl, this.getIconClassFromAlertClasses(alertClasses));
        this.renderer.setAttribute(iconEl, 'aria-hidden', 'true');
        // we insert the icon element inside the DOM of the alert element
        this.renderer.insertBefore(this.el.nativeElement, iconEl, this.el.nativeElement.firstChild);
    }
    /**
     * @param {?} cssClasses
     * @return {?}
     */
    getIconClassFromAlertClasses(cssClasses) {
        if (cssClasses == null) {
            return 'icon-info-circle';
        }
        if (cssClasses.contains('alert-info') || cssClasses.contains('alert-primary') || cssClasses.contains('alert-secondary')
            || cssClasses.contains('alert-light') || cssClasses.contains('alert-dark')) {
            return 'icon-info-circle';
        }
        if (cssClasses.contains('alert-success')) {
            return 'icon-check-circle';
        }
        if (cssClasses.contains('alert-warning')) {
            return 'icon-exclamation-triangle';
        }
        if (cssClasses.contains('alert-danger')) {
            return 'icon-minus-circle';
        }
        if (cssClasses.contains('alert-tip')) {
            return 'icon-lightbulb';
        }
        return 'icon-info-circle'; // return default icon if there is no match
    }
}
InsertAlertIconDirective.decorators = [
    { type: Directive, args: [{
                selector: 'ngb-alert[insert-alert-icon]'
            },] }
];
/** @nocollapse */
InsertAlertIconDirective.ctorParameters = () => [
    { type: ElementRef },
    { type: Renderer2 }
];
if (false) {
    /**
     * @type {?}
     * @private
     */
    InsertAlertIconDirective.prototype.el;
    /**
     * @type {?}
     * @private
     */
    InsertAlertIconDirective.prototype.renderer;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zZXJ0LWFsZXJ0LWljb24uZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vZGVzaWduLWZhY3RvcnktdjIvIiwic291cmNlcyI6WyJsaWIvYW5ndWxhci9hbGVydC9pbnNlcnQtYWxlcnQtaWNvbi5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQWlCLE1BQU0sZUFBZSxDQUFDO0FBS2hGLE1BQU0sT0FBTyx3QkFBd0I7Ozs7O0lBQ25DLFlBQW9CLEVBQWMsRUFBVSxRQUFtQjtRQUEzQyxPQUFFLEdBQUYsRUFBRSxDQUFZO1FBQVUsYUFBUSxHQUFSLFFBQVEsQ0FBVztJQUMvRCxDQUFDOzs7O0lBRUQsZUFBZTs7Y0FFUCxZQUFZLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsU0FBUzs7O2NBRzlDLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7UUFDbEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsNEJBQTRCLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUNoRixJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRTFELGlFQUFpRTtRQUNqRSxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDOUYsQ0FBQzs7Ozs7SUFFRCw0QkFBNEIsQ0FBQyxVQUFVO1FBQ3JDLElBQUksVUFBVSxJQUFJLElBQUksRUFBRTtZQUN0QixPQUFPLGtCQUFrQixDQUFDO1NBQzNCO1FBQ0QsSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztlQUNuSCxVQUFVLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDM0UsT0FBTyxrQkFBa0IsQ0FBQztTQUMzQjtRQUNELElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFBRTtZQUN4QyxPQUFPLG1CQUFtQixDQUFDO1NBQzVCO1FBQ0QsSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxFQUFFO1lBQ3hDLE9BQU8sMkJBQTJCLENBQUM7U0FDcEM7UUFDRCxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUU7WUFDdkMsT0FBTyxtQkFBbUIsQ0FBQztTQUM1QjtRQUNELElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUNwQyxPQUFPLGdCQUFnQixDQUFDO1NBQ3pCO1FBQ0QsT0FBTyxrQkFBa0IsQ0FBQyxDQUFDLDJDQUEyQztJQUN4RSxDQUFDOzs7WUExQ0YsU0FBUyxTQUFDO2dCQUNULFFBQVEsRUFBRSw4QkFBOEI7YUFDekM7Ozs7WUFKbUIsVUFBVTtZQUFFLFNBQVM7Ozs7Ozs7SUFNM0Isc0NBQXNCOzs7OztJQUFFLDRDQUEyQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpcmVjdGl2ZSwgRWxlbWVudFJlZiwgUmVuZGVyZXIyLCBBZnRlclZpZXdJbml0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ25nYi1hbGVydFtpbnNlcnQtYWxlcnQtaWNvbl0nXG59KVxuZXhwb3J0IGNsYXNzIEluc2VydEFsZXJ0SWNvbkRpcmVjdGl2ZSBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGVsOiBFbGVtZW50UmVmLCBwcml2YXRlIHJlbmRlcmVyOiBSZW5kZXJlcjIpIHtcbiAgfVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcblxuICAgIGNvbnN0IGFsZXJ0Q2xhc3NlcyA9IHRoaXMuZWwubmF0aXZlRWxlbWVudC5jbGFzc0xpc3Q7XG5cbiAgICAvLyB3ZSBjcmVhdGUgdGhlIEhUTUwgaWNvbiBlbGVtZW50IHdpdGggdGhlIHJlbmRlcmVyXG4gICAgY29uc3QgaWNvbkVsID0gdGhpcy5yZW5kZXJlci5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgdGhpcy5yZW5kZXJlci5hZGRDbGFzcyhpY29uRWwsICdhbGVydC1pY29uJyk7XG4gICAgdGhpcy5yZW5kZXJlci5hZGRDbGFzcyhpY29uRWwsIHRoaXMuZ2V0SWNvbkNsYXNzRnJvbUFsZXJ0Q2xhc3NlcyhhbGVydENsYXNzZXMpKTtcbiAgICB0aGlzLnJlbmRlcmVyLnNldEF0dHJpYnV0ZShpY29uRWwsICdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG5cbiAgICAvLyB3ZSBpbnNlcnQgdGhlIGljb24gZWxlbWVudCBpbnNpZGUgdGhlIERPTSBvZiB0aGUgYWxlcnQgZWxlbWVudFxuICAgIHRoaXMucmVuZGVyZXIuaW5zZXJ0QmVmb3JlKHRoaXMuZWwubmF0aXZlRWxlbWVudCwgaWNvbkVsLCB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gIH1cblxuICBnZXRJY29uQ2xhc3NGcm9tQWxlcnRDbGFzc2VzKGNzc0NsYXNzZXMpOiBzdHJpbmcge1xuICAgIGlmIChjc3NDbGFzc2VzID09IG51bGwpIHtcbiAgICAgIHJldHVybiAnaWNvbi1pbmZvLWNpcmNsZSc7XG4gICAgfVxuICAgIGlmIChjc3NDbGFzc2VzLmNvbnRhaW5zKCdhbGVydC1pbmZvJykgfHwgY3NzQ2xhc3Nlcy5jb250YWlucygnYWxlcnQtcHJpbWFyeScpIHx8IGNzc0NsYXNzZXMuY29udGFpbnMoJ2FsZXJ0LXNlY29uZGFyeScpXG4gICAgIHx8IGNzc0NsYXNzZXMuY29udGFpbnMoJ2FsZXJ0LWxpZ2h0JykgfHwgY3NzQ2xhc3Nlcy5jb250YWlucygnYWxlcnQtZGFyaycpKSB7XG4gICAgICByZXR1cm4gJ2ljb24taW5mby1jaXJjbGUnO1xuICAgIH1cbiAgICBpZiAoY3NzQ2xhc3Nlcy5jb250YWlucygnYWxlcnQtc3VjY2VzcycpKSB7XG4gICAgICByZXR1cm4gJ2ljb24tY2hlY2stY2lyY2xlJztcbiAgICB9XG4gICAgaWYgKGNzc0NsYXNzZXMuY29udGFpbnMoJ2FsZXJ0LXdhcm5pbmcnKSkge1xuICAgICAgcmV0dXJuICdpY29uLWV4Y2xhbWF0aW9uLXRyaWFuZ2xlJztcbiAgICB9XG4gICAgaWYgKGNzc0NsYXNzZXMuY29udGFpbnMoJ2FsZXJ0LWRhbmdlcicpKSB7XG4gICAgICByZXR1cm4gJ2ljb24tbWludXMtY2lyY2xlJztcbiAgICB9XG4gICAgaWYgKGNzc0NsYXNzZXMuY29udGFpbnMoJ2FsZXJ0LXRpcCcpKSB7XG4gICAgICByZXR1cm4gJ2ljb24tbGlnaHRidWxiJztcbiAgICB9XG4gICAgcmV0dXJuICdpY29uLWluZm8tY2lyY2xlJzsgLy8gcmV0dXJuIGRlZmF1bHQgaWNvbiBpZiB0aGVyZSBpcyBubyBtYXRjaFxuICB9XG59XG4iXX0=