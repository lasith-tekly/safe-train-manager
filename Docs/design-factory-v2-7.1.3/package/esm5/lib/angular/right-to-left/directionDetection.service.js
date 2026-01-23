/**
 * @fileoverview added by tsickle
 * Generated from: lib/angular/right-to-left/directionDetection.service.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { Injectable, NgModule } from '@angular/core';
/** @enum {string} */
var RightToLeftDirectionEnum = {
    LeftToRight: "ltr",
    RightToLeft: "rtl",
    Auto: "auto",
};
export { RightToLeftDirectionEnum };
var DfDirectionDetectionService = /** @class */ (function () {
    function DfDirectionDetectionService() {
    }
    /**
     * @param {?} element
     * @return {?}
     */
    DfDirectionDetectionService.prototype.getPageDirection = /**
     * @param {?} element
     * @return {?}
     */
    function (element) {
        /** @type {?} */
        var curElement = element.nativeElement;
        while (curElement !== null) {
            if (curElement.getAttribute('dir') === RightToLeftDirectionEnum.RightToLeft) {
                return RightToLeftDirectionEnum.RightToLeft;
            }
            else if (curElement.getAttribute('dir') === RightToLeftDirectionEnum.LeftToRight) {
                return RightToLeftDirectionEnum.LeftToRight;
            }
            curElement = curElement.parentElement;
        }
        return RightToLeftDirectionEnum.LeftToRight;
    };
    DfDirectionDetectionService.decorators = [
        { type: Injectable }
    ];
    return DfDirectionDetectionService;
}());
export { DfDirectionDetectionService };
var DfRightToLeftModule = /** @class */ (function () {
    function DfRightToLeftModule() {
    }
    /**
     * @return {?}
     */
    DfRightToLeftModule.forRoot = /**
     * @return {?}
     */
    function () { return { ngModule: DfRightToLeftModule, providers: [DfDirectionDetectionService] }; };
    DfRightToLeftModule.decorators = [
        { type: NgModule, args: [{
                    declarations: [],
                    entryComponents: [],
                    providers: [DfDirectionDetectionService]
                },] }
    ];
    return DfRightToLeftModule;
}());
export { DfRightToLeftModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aW9uRGV0ZWN0aW9uLnNlcnZpY2UuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9kZXNpZ24tZmFjdG9yeS12Mi8iLCJzb3VyY2VzIjpbImxpYi9hbmd1bGFyL3JpZ2h0LXRvLWxlZnQvZGlyZWN0aW9uRGV0ZWN0aW9uLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFjLFFBQVEsRUFBdUIsTUFBTSxlQUFlLENBQUM7O0FBRXRGLElBQVksd0JBQXdCO0lBQ2xDLFdBQVcsT0FBUTtJQUNuQixXQUFXLE9BQVE7SUFDbkIsSUFBSSxRQUFTO0VBQ2Q7O0FBRUQ7SUFBQTtJQWdCQSxDQUFDOzs7OztJQWJDLHNEQUFnQjs7OztJQUFoQixVQUFpQixPQUFtQjs7WUFDOUIsVUFBVSxHQUFHLE9BQU8sQ0FBQyxhQUFhO1FBQ3RDLE9BQU8sVUFBVSxLQUFLLElBQUksRUFBRTtZQUMxQixJQUFJLFVBQVUsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEtBQUssd0JBQXdCLENBQUMsV0FBVyxFQUFFO2dCQUMzRSxPQUFPLHdCQUF3QixDQUFDLFdBQVcsQ0FBQzthQUM3QztpQkFBTSxJQUFJLFVBQVUsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEtBQUssd0JBQXdCLENBQUMsV0FBVyxFQUFFO2dCQUNsRixPQUFRLHdCQUF3QixDQUFDLFdBQVcsQ0FBQzthQUM5QztZQUNELFVBQVUsR0FBRyxVQUFVLENBQUMsYUFBYSxDQUFDO1NBQ3ZDO1FBQ0QsT0FBUSx3QkFBd0IsQ0FBQyxXQUFXLENBQUM7SUFDL0MsQ0FBQzs7Z0JBZEYsVUFBVTs7SUFnQlgsa0NBQUM7Q0FBQSxBQWhCRCxJQWdCQztTQWZZLDJCQUEyQjtBQWlCeEM7SUFBQTtJQU9BLENBQUM7Ozs7SUFEUSwyQkFBTzs7O0lBQWQsY0FBd0MsT0FBTyxFQUFDLFFBQVEsRUFBRSxtQkFBbUIsRUFBRSxTQUFTLEVBQUUsQ0FBQywyQkFBMkIsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDOztnQkFONUgsUUFBUSxTQUFDO29CQUNSLFlBQVksRUFBRSxFQUFFO29CQUNoQixlQUFlLEVBQUUsRUFBRTtvQkFDbkIsU0FBUyxFQUFFLENBQUMsMkJBQTJCLENBQUM7aUJBQ3pDOztJQUdELDBCQUFDO0NBQUEsQUFQRCxJQU9DO1NBRlksbUJBQW1CIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgRWxlbWVudFJlZiwgTmdNb2R1bGUsIE1vZHVsZVdpdGhQcm92aWRlcnMgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuZXhwb3J0IGVudW0gUmlnaHRUb0xlZnREaXJlY3Rpb25FbnVtIHtcbiAgTGVmdFRvUmlnaHQgPSAnbHRyJyxcbiAgUmlnaHRUb0xlZnQgPSAncnRsJyxcbiAgQXV0byA9ICdhdXRvJ1xufVxuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgRGZEaXJlY3Rpb25EZXRlY3Rpb25TZXJ2aWNlIHtcblxuICBnZXRQYWdlRGlyZWN0aW9uKGVsZW1lbnQ6IEVsZW1lbnRSZWYpOiBzdHJpbmcge1xuICAgIGxldCBjdXJFbGVtZW50ID0gZWxlbWVudC5uYXRpdmVFbGVtZW50O1xuICAgIHdoaWxlIChjdXJFbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICBpZiAoY3VyRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RpcicpID09PSBSaWdodFRvTGVmdERpcmVjdGlvbkVudW0uUmlnaHRUb0xlZnQpIHtcbiAgICAgICAgcmV0dXJuIFJpZ2h0VG9MZWZ0RGlyZWN0aW9uRW51bS5SaWdodFRvTGVmdDtcbiAgICAgIH0gZWxzZSBpZiAoY3VyRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RpcicpID09PSBSaWdodFRvTGVmdERpcmVjdGlvbkVudW0uTGVmdFRvUmlnaHQpIHtcbiAgICAgICAgcmV0dXJuICBSaWdodFRvTGVmdERpcmVjdGlvbkVudW0uTGVmdFRvUmlnaHQ7XG4gICAgICB9XG4gICAgICBjdXJFbGVtZW50ID0gY3VyRWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICAgIH1cbiAgICByZXR1cm4gIFJpZ2h0VG9MZWZ0RGlyZWN0aW9uRW51bS5MZWZ0VG9SaWdodDtcbiAgfVxuXG59XG5cbkBOZ01vZHVsZSh7XG4gIGRlY2xhcmF0aW9uczogW10sXG4gIGVudHJ5Q29tcG9uZW50czogW10sXG4gIHByb3ZpZGVyczogW0RmRGlyZWN0aW9uRGV0ZWN0aW9uU2VydmljZV1cbn0pXG5leHBvcnQgY2xhc3MgRGZSaWdodFRvTGVmdE1vZHVsZSB7XG4gIHN0YXRpYyBmb3JSb290KCk6IE1vZHVsZVdpdGhQcm92aWRlcnMgeyByZXR1cm4ge25nTW9kdWxlOiBEZlJpZ2h0VG9MZWZ0TW9kdWxlLCBwcm92aWRlcnM6IFtEZkRpcmVjdGlvbkRldGVjdGlvblNlcnZpY2VdfTsgfVxufVxuIl19