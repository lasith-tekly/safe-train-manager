/**
 * @fileoverview added by tsickle
 * Generated from: lib/angular/right-to-left/directionDetection.service.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { Injectable, NgModule } from '@angular/core';
/** @enum {string} */
const RightToLeftDirectionEnum = {
    LeftToRight: "ltr",
    RightToLeft: "rtl",
    Auto: "auto",
};
export { RightToLeftDirectionEnum };
export class DfDirectionDetectionService {
    /**
     * @param {?} element
     * @return {?}
     */
    getPageDirection(element) {
        /** @type {?} */
        let curElement = element.nativeElement;
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
    }
}
DfDirectionDetectionService.decorators = [
    { type: Injectable }
];
export class DfRightToLeftModule {
    /**
     * @return {?}
     */
    static forRoot() { return { ngModule: DfRightToLeftModule, providers: [DfDirectionDetectionService] }; }
}
DfRightToLeftModule.decorators = [
    { type: NgModule, args: [{
                declarations: [],
                entryComponents: [],
                providers: [DfDirectionDetectionService]
            },] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aW9uRGV0ZWN0aW9uLnNlcnZpY2UuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9kZXNpZ24tZmFjdG9yeS12Mi8iLCJzb3VyY2VzIjpbImxpYi9hbmd1bGFyL3JpZ2h0LXRvLWxlZnQvZGlyZWN0aW9uRGV0ZWN0aW9uLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFjLFFBQVEsRUFBdUIsTUFBTSxlQUFlLENBQUM7O0FBRXRGLE1BQVksd0JBQXdCO0lBQ2xDLFdBQVcsT0FBUTtJQUNuQixXQUFXLE9BQVE7SUFDbkIsSUFBSSxRQUFTO0VBQ2Q7O0FBR0QsTUFBTSxPQUFPLDJCQUEyQjs7Ozs7SUFFdEMsZ0JBQWdCLENBQUMsT0FBbUI7O1lBQzlCLFVBQVUsR0FBRyxPQUFPLENBQUMsYUFBYTtRQUN0QyxPQUFPLFVBQVUsS0FBSyxJQUFJLEVBQUU7WUFDMUIsSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxLQUFLLHdCQUF3QixDQUFDLFdBQVcsRUFBRTtnQkFDM0UsT0FBTyx3QkFBd0IsQ0FBQyxXQUFXLENBQUM7YUFDN0M7aUJBQU0sSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxLQUFLLHdCQUF3QixDQUFDLFdBQVcsRUFBRTtnQkFDbEYsT0FBUSx3QkFBd0IsQ0FBQyxXQUFXLENBQUM7YUFDOUM7WUFDRCxVQUFVLEdBQUcsVUFBVSxDQUFDLGFBQWEsQ0FBQztTQUN2QztRQUNELE9BQVEsd0JBQXdCLENBQUMsV0FBVyxDQUFDO0lBQy9DLENBQUM7OztZQWRGLFVBQVU7O0FBdUJYLE1BQU0sT0FBTyxtQkFBbUI7Ozs7SUFDOUIsTUFBTSxDQUFDLE9BQU8sS0FBMEIsT0FBTyxFQUFDLFFBQVEsRUFBRSxtQkFBbUIsRUFBRSxTQUFTLEVBQUUsQ0FBQywyQkFBMkIsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDOzs7WUFONUgsUUFBUSxTQUFDO2dCQUNSLFlBQVksRUFBRSxFQUFFO2dCQUNoQixlQUFlLEVBQUUsRUFBRTtnQkFDbkIsU0FBUyxFQUFFLENBQUMsMkJBQTJCLENBQUM7YUFDekMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlLCBFbGVtZW50UmVmLCBOZ01vZHVsZSwgTW9kdWxlV2l0aFByb3ZpZGVycyB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5leHBvcnQgZW51bSBSaWdodFRvTGVmdERpcmVjdGlvbkVudW0ge1xuICBMZWZ0VG9SaWdodCA9ICdsdHInLFxuICBSaWdodFRvTGVmdCA9ICdydGwnLFxuICBBdXRvID0gJ2F1dG8nXG59XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBEZkRpcmVjdGlvbkRldGVjdGlvblNlcnZpY2Uge1xuXG4gIGdldFBhZ2VEaXJlY3Rpb24oZWxlbWVudDogRWxlbWVudFJlZik6IHN0cmluZyB7XG4gICAgbGV0IGN1ckVsZW1lbnQgPSBlbGVtZW50Lm5hdGl2ZUVsZW1lbnQ7XG4gICAgd2hpbGUgKGN1ckVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgIGlmIChjdXJFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGlyJykgPT09IFJpZ2h0VG9MZWZ0RGlyZWN0aW9uRW51bS5SaWdodFRvTGVmdCkge1xuICAgICAgICByZXR1cm4gUmlnaHRUb0xlZnREaXJlY3Rpb25FbnVtLlJpZ2h0VG9MZWZ0O1xuICAgICAgfSBlbHNlIGlmIChjdXJFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGlyJykgPT09IFJpZ2h0VG9MZWZ0RGlyZWN0aW9uRW51bS5MZWZ0VG9SaWdodCkge1xuICAgICAgICByZXR1cm4gIFJpZ2h0VG9MZWZ0RGlyZWN0aW9uRW51bS5MZWZ0VG9SaWdodDtcbiAgICAgIH1cbiAgICAgIGN1ckVsZW1lbnQgPSBjdXJFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG4gICAgfVxuICAgIHJldHVybiAgUmlnaHRUb0xlZnREaXJlY3Rpb25FbnVtLkxlZnRUb1JpZ2h0O1xuICB9XG5cbn1cblxuQE5nTW9kdWxlKHtcbiAgZGVjbGFyYXRpb25zOiBbXSxcbiAgZW50cnlDb21wb25lbnRzOiBbXSxcbiAgcHJvdmlkZXJzOiBbRGZEaXJlY3Rpb25EZXRlY3Rpb25TZXJ2aWNlXVxufSlcbmV4cG9ydCBjbGFzcyBEZlJpZ2h0VG9MZWZ0TW9kdWxlIHtcbiAgc3RhdGljIGZvclJvb3QoKTogTW9kdWxlV2l0aFByb3ZpZGVycyB7IHJldHVybiB7bmdNb2R1bGU6IERmUmlnaHRUb0xlZnRNb2R1bGUsIHByb3ZpZGVyczogW0RmRGlyZWN0aW9uRGV0ZWN0aW9uU2VydmljZV19OyB9XG59XG4iXX0=