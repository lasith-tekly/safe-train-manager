/**
 * @fileoverview added by tsickle
 * Generated from: lib/angular/alert/insert-alert-icon.directive.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { Directive, ElementRef, Renderer2 } from '@angular/core';
var InsertAlertIconDirective = /** @class */ (function () {
    function InsertAlertIconDirective(el, renderer) {
        this.el = el;
        this.renderer = renderer;
    }
    /**
     * @return {?}
     */
    InsertAlertIconDirective.prototype.ngAfterViewInit = /**
     * @return {?}
     */
    function () {
        /** @type {?} */
        var alertClasses = this.el.nativeElement.classList;
        // we create the HTML icon element with the renderer
        /** @type {?} */
        var iconEl = this.renderer.createElement('span');
        this.renderer.addClass(iconEl, 'alert-icon');
        this.renderer.addClass(iconEl, this.getIconClassFromAlertClasses(alertClasses));
        this.renderer.setAttribute(iconEl, 'aria-hidden', 'true');
        // we insert the icon element inside the DOM of the alert element
        this.renderer.insertBefore(this.el.nativeElement, iconEl, this.el.nativeElement.firstChild);
    };
    /**
     * @param {?} cssClasses
     * @return {?}
     */
    InsertAlertIconDirective.prototype.getIconClassFromAlertClasses = /**
     * @param {?} cssClasses
     * @return {?}
     */
    function (cssClasses) {
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
    };
    InsertAlertIconDirective.decorators = [
        { type: Directive, args: [{
                    selector: 'ngb-alert[insert-alert-icon]'
                },] }
    ];
    /** @nocollapse */
    InsertAlertIconDirective.ctorParameters = function () { return [
        { type: ElementRef },
        { type: Renderer2 }
    ]; };
    return InsertAlertIconDirective;
}());
export { InsertAlertIconDirective };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zZXJ0LWFsZXJ0LWljb24uZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vZGVzaWduLWZhY3RvcnktdjIvIiwic291cmNlcyI6WyJsaWIvYW5ndWxhci9hbGVydC9pbnNlcnQtYWxlcnQtaWNvbi5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQWlCLE1BQU0sZUFBZSxDQUFDO0FBRWhGO0lBSUUsa0NBQW9CLEVBQWMsRUFBVSxRQUFtQjtRQUEzQyxPQUFFLEdBQUYsRUFBRSxDQUFZO1FBQVUsYUFBUSxHQUFSLFFBQVEsQ0FBVztJQUMvRCxDQUFDOzs7O0lBRUQsa0RBQWU7OztJQUFmOztZQUVRLFlBQVksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxTQUFTOzs7WUFHOUMsTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQztRQUNsRCxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ2hGLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFMUQsaUVBQWlFO1FBQ2pFLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUM5RixDQUFDOzs7OztJQUVELCtEQUE0Qjs7OztJQUE1QixVQUE2QixVQUFVO1FBQ3JDLElBQUksVUFBVSxJQUFJLElBQUksRUFBRTtZQUN0QixPQUFPLGtCQUFrQixDQUFDO1NBQzNCO1FBQ0QsSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztlQUNuSCxVQUFVLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDM0UsT0FBTyxrQkFBa0IsQ0FBQztTQUMzQjtRQUNELElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFBRTtZQUN4QyxPQUFPLG1CQUFtQixDQUFDO1NBQzVCO1FBQ0QsSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxFQUFFO1lBQ3hDLE9BQU8sMkJBQTJCLENBQUM7U0FDcEM7UUFDRCxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUU7WUFDdkMsT0FBTyxtQkFBbUIsQ0FBQztTQUM1QjtRQUNELElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUNwQyxPQUFPLGdCQUFnQixDQUFDO1NBQ3pCO1FBQ0QsT0FBTyxrQkFBa0IsQ0FBQyxDQUFDLDJDQUEyQztJQUN4RSxDQUFDOztnQkExQ0YsU0FBUyxTQUFDO29CQUNULFFBQVEsRUFBRSw4QkFBOEI7aUJBQ3pDOzs7O2dCQUptQixVQUFVO2dCQUFFLFNBQVM7O0lBNkN6QywrQkFBQztDQUFBLEFBM0NELElBMkNDO1NBeENZLHdCQUF3Qjs7Ozs7O0lBQ3ZCLHNDQUFzQjs7Ozs7SUFBRSw0Q0FBMkIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXJlY3RpdmUsIEVsZW1lbnRSZWYsIFJlbmRlcmVyMiwgQWZ0ZXJWaWV3SW5pdCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICduZ2ItYWxlcnRbaW5zZXJ0LWFsZXJ0LWljb25dJ1xufSlcbmV4cG9ydCBjbGFzcyBJbnNlcnRBbGVydEljb25EaXJlY3RpdmUgaW1wbGVtZW50cyBBZnRlclZpZXdJbml0IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBlbDogRWxlbWVudFJlZiwgcHJpdmF0ZSByZW5kZXJlcjogUmVuZGVyZXIyKSB7XG4gIH1cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG5cbiAgICBjb25zdCBhbGVydENsYXNzZXMgPSB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQuY2xhc3NMaXN0O1xuXG4gICAgLy8gd2UgY3JlYXRlIHRoZSBIVE1MIGljb24gZWxlbWVudCB3aXRoIHRoZSByZW5kZXJlclxuICAgIGNvbnN0IGljb25FbCA9IHRoaXMucmVuZGVyZXIuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHRoaXMucmVuZGVyZXIuYWRkQ2xhc3MoaWNvbkVsLCAnYWxlcnQtaWNvbicpO1xuICAgIHRoaXMucmVuZGVyZXIuYWRkQ2xhc3MoaWNvbkVsLCB0aGlzLmdldEljb25DbGFzc0Zyb21BbGVydENsYXNzZXMoYWxlcnRDbGFzc2VzKSk7XG4gICAgdGhpcy5yZW5kZXJlci5zZXRBdHRyaWJ1dGUoaWNvbkVsLCAnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuXG4gICAgLy8gd2UgaW5zZXJ0IHRoZSBpY29uIGVsZW1lbnQgaW5zaWRlIHRoZSBET00gb2YgdGhlIGFsZXJ0IGVsZW1lbnRcbiAgICB0aGlzLnJlbmRlcmVyLmluc2VydEJlZm9yZSh0aGlzLmVsLm5hdGl2ZUVsZW1lbnQsIGljb25FbCwgdGhpcy5lbC5uYXRpdmVFbGVtZW50LmZpcnN0Q2hpbGQpO1xuICB9XG5cbiAgZ2V0SWNvbkNsYXNzRnJvbUFsZXJ0Q2xhc3Nlcyhjc3NDbGFzc2VzKTogc3RyaW5nIHtcbiAgICBpZiAoY3NzQ2xhc3NlcyA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gJ2ljb24taW5mby1jaXJjbGUnO1xuICAgIH1cbiAgICBpZiAoY3NzQ2xhc3Nlcy5jb250YWlucygnYWxlcnQtaW5mbycpIHx8IGNzc0NsYXNzZXMuY29udGFpbnMoJ2FsZXJ0LXByaW1hcnknKSB8fCBjc3NDbGFzc2VzLmNvbnRhaW5zKCdhbGVydC1zZWNvbmRhcnknKVxuICAgICB8fCBjc3NDbGFzc2VzLmNvbnRhaW5zKCdhbGVydC1saWdodCcpIHx8IGNzc0NsYXNzZXMuY29udGFpbnMoJ2FsZXJ0LWRhcmsnKSkge1xuICAgICAgcmV0dXJuICdpY29uLWluZm8tY2lyY2xlJztcbiAgICB9XG4gICAgaWYgKGNzc0NsYXNzZXMuY29udGFpbnMoJ2FsZXJ0LXN1Y2Nlc3MnKSkge1xuICAgICAgcmV0dXJuICdpY29uLWNoZWNrLWNpcmNsZSc7XG4gICAgfVxuICAgIGlmIChjc3NDbGFzc2VzLmNvbnRhaW5zKCdhbGVydC13YXJuaW5nJykpIHtcbiAgICAgIHJldHVybiAnaWNvbi1leGNsYW1hdGlvbi10cmlhbmdsZSc7XG4gICAgfVxuICAgIGlmIChjc3NDbGFzc2VzLmNvbnRhaW5zKCdhbGVydC1kYW5nZXInKSkge1xuICAgICAgcmV0dXJuICdpY29uLW1pbnVzLWNpcmNsZSc7XG4gICAgfVxuICAgIGlmIChjc3NDbGFzc2VzLmNvbnRhaW5zKCdhbGVydC10aXAnKSkge1xuICAgICAgcmV0dXJuICdpY29uLWxpZ2h0YnVsYic7XG4gICAgfVxuICAgIHJldHVybiAnaWNvbi1pbmZvLWNpcmNsZSc7IC8vIHJldHVybiBkZWZhdWx0IGljb24gaWYgdGhlcmUgaXMgbm8gbWF0Y2hcbiAgfVxufVxuIl19