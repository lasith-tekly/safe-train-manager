/**
 * @fileoverview added by tsickle
 * Generated from: lib/angular/selects/select.module.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { NgModule } from '@angular/core';
import { dfManageNavSelectDirective, dfManageBadgeEventsDirective } from './manage-nav-select.directive';
import { DfRightToLeftModule } from '../right-to-left/directionDetection.service';
export class DfSelectModule {
    /**
     * @return {?}
     */
    static forRoot() { return { ngModule: DfSelectModule, providers: [] }; }
}
DfSelectModule.decorators = [
    { type: NgModule, args: [{
                imports: [DfRightToLeftModule],
                declarations: [dfManageNavSelectDirective, dfManageBadgeEventsDirective],
                exports: [dfManageNavSelectDirective, dfManageBadgeEventsDirective]
            },] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0Lm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL2Rlc2lnbi1mYWN0b3J5LXYyLyIsInNvdXJjZXMiOlsibGliL2FuZ3VsYXIvc2VsZWN0cy9zZWxlY3QubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsT0FBTyxFQUFFLFFBQVEsRUFBdUIsTUFBTSxlQUFlLENBQUM7QUFDOUQsT0FBTyxFQUFFLDBCQUEwQixFQUFFLDRCQUE0QixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDeEcsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sNkNBQTZDLENBQUM7QUFPbEYsTUFBTSxPQUFPLGNBQWM7Ozs7SUFDekIsTUFBTSxDQUFDLE9BQU8sS0FBMEIsT0FBTyxFQUFDLFFBQVEsRUFBRSxjQUFjLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQzs7O1lBTjVGLFFBQVEsU0FBQztnQkFDTixPQUFPLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQztnQkFDOUIsWUFBWSxFQUFFLENBQUMsMEJBQTBCLEVBQUUsNEJBQTRCLENBQUM7Z0JBQ3hFLE9BQU8sRUFBRSxDQUFDLDBCQUEwQixFQUFFLDRCQUE0QixDQUFDO2FBQ3RFIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmdNb2R1bGUsIE1vZHVsZVdpdGhQcm92aWRlcnMgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IGRmTWFuYWdlTmF2U2VsZWN0RGlyZWN0aXZlLCBkZk1hbmFnZUJhZGdlRXZlbnRzRGlyZWN0aXZlfSBmcm9tICcuL21hbmFnZS1uYXYtc2VsZWN0LmRpcmVjdGl2ZSc7XG5pbXBvcnQgeyBEZlJpZ2h0VG9MZWZ0TW9kdWxlIH0gZnJvbSAnLi4vcmlnaHQtdG8tbGVmdC9kaXJlY3Rpb25EZXRlY3Rpb24uc2VydmljZSc7XG5cbkBOZ01vZHVsZSh7XG4gICAgaW1wb3J0czogW0RmUmlnaHRUb0xlZnRNb2R1bGVdLFxuICAgIGRlY2xhcmF0aW9uczogW2RmTWFuYWdlTmF2U2VsZWN0RGlyZWN0aXZlLCBkZk1hbmFnZUJhZGdlRXZlbnRzRGlyZWN0aXZlXSxcbiAgICBleHBvcnRzOiBbZGZNYW5hZ2VOYXZTZWxlY3REaXJlY3RpdmUsIGRmTWFuYWdlQmFkZ2VFdmVudHNEaXJlY3RpdmVdXG59KVxuZXhwb3J0IGNsYXNzIERmU2VsZWN0TW9kdWxlIHtcbiAgc3RhdGljIGZvclJvb3QoKTogTW9kdWxlV2l0aFByb3ZpZGVycyB7IHJldHVybiB7bmdNb2R1bGU6IERmU2VsZWN0TW9kdWxlLCBwcm92aWRlcnM6IFtdfTsgfVxufVxuIl19