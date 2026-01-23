/**
 * @fileoverview added by tsickle
 * Generated from: lib/index.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DfAlertModule } from './angular/alert/alert.module';
import { DfDatePickerModule } from './angular/datepicker/datepicker.module';
import { IconModule } from './angular/icon/icon.module';
import { DfModalModule } from './angular/modal/modal.service';
import { DfRightToLeftModule } from './angular/right-to-left/directionDetection.service';
import { CssWrapperModule } from './angular/csswrapper/csswrapper.module';
import { DfSelectModule } from './angular/selects/select.module';
import { DfProgressbarModule } from './angular/progressbar/progressbar.module';
import { DfInputIconModule } from './angular/inputs/inputicon.module';
// alert
export { InsertAlertIconDirective } from './angular/alert/insert-alert-icon.directive';
export { DfAlertModule } from './angular/alert/alert.module';
// datepicker
export { CloseInputDatePickerDirective } from './angular/datepicker/closedatepicker.directive';
export { DfDatePickerModule } from './angular/datepicker/datepicker.module';
// Icon
export { IconModule } from './angular/icon/icon.module';
// Modal
export { DfModalService } from './angular/modal/modal.service';
// CSSwrapper
export { CssWrapperModule } from './angular/csswrapper/csswrapper.module';
// Modal
export { DfModalModule } from './angular/modal/modal.service';
// Right to left funcionality
export { DfRightToLeftModule } from './angular/right-to-left/directionDetection.service';
// InputIcon Module
export { DfInputIconDirective } from './angular/inputs/inputicon.directive';
export { DfInputIconModule } from './angular/inputs/inputicon.module';
// Selects
export { dfManageNavSelectDirective, dfManageBadgeEventsDirective } from './angular/selects/manage-nav-select.directive';
export { DfSelectModule } from './angular/selects/select.module';
export { DfPopoverConfig } from './angular/popover/popover.config';
// Progressbar
export { DfProgressbarModule } from './angular/progressbar/progressbar.module';
// Accessibility
import { DfAccessibilityModule } from './angular/accessibility/accessibility.module';
/** @type {?} */
var DF_MODULES = [
    DfModalModule,
    DfAlertModule,
    DfDatePickerModule,
    CssWrapperModule,
    DfSelectModule,
    DfProgressbarModule,
    DfInputIconModule,
    DfAccessibilityModule,
    DfRightToLeftModule
];
var DfRootModule = /** @class */ (function () {
    function DfRootModule() {
    }
    DfRootModule.decorators = [
        { type: NgModule, args: [{
                    declarations: [],
                    imports: [
                        NgbModule,
                        DfModalModule.forRoot(),
                        DfAlertModule.forRoot(),
                        DfDatePickerModule.forRoot(),
                        IconModule.forRoot(),
                        CssWrapperModule.forRoot(),
                        DfSelectModule.forRoot(),
                        DfProgressbarModule.forRoot(),
                        DfInputIconModule.forRoot(),
                        DfAccessibilityModule.forRoot(),
                        DfRightToLeftModule.forRoot()
                    ],
                    exports: DF_MODULES
                },] }
    ];
    return DfRootModule;
}());
export { DfRootModule };
var DfModule = /** @class */ (function () {
    function DfModule() {
    }
    /**
     * @return {?}
     */
    DfModule.forRoot = /**
     * @return {?}
     */
    function () {
        return { ngModule: DfRootModule };
    };
    DfModule.decorators = [
        { type: NgModule, args: [{ imports: DF_MODULES, exports: DF_MODULES },] }
    ];
    return DfModule;
}());
export { DfModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290Ijoibmc6Ly9kZXNpZ24tZmFjdG9yeS12Mi8iLCJzb3VyY2VzIjpbImxpYi9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLE9BQU8sRUFBdUIsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzlELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUN2RCxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFDN0QsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sd0NBQXdDLENBQUM7QUFDNUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ3hELE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUM5RCxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxvREFBb0QsQ0FBQztBQUN6RixPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSx3Q0FBd0MsQ0FBQztBQUMxRSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0saUNBQWlDLENBQUM7QUFDakUsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sMENBQTBDLENBQUM7QUFDL0UsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sbUNBQW1DLENBQUM7O0FBSXRFLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxNQUFNLDZDQUE2QyxDQUFDO0FBQ3ZGLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQzs7QUFHN0QsT0FBTyxFQUFFLDZCQUE2QixFQUFFLE1BQU0sZ0RBQWdELENBQUM7QUFDL0YsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sd0NBQXdDLENBQUM7O0FBRzVFLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQzs7QUFHeEQsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLCtCQUErQixDQUFDOztBQUcvRCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSx3Q0FBd0MsQ0FBQzs7QUFHMUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLCtCQUErQixDQUFDOztBQUc5RCxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxvREFBb0QsQ0FBQzs7QUFHekYsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sc0NBQXNDLENBQUM7QUFDNUUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sbUNBQW1DLENBQUM7O0FBR3RFLE9BQU8sRUFDTCwwQkFBMEIsRUFBRSw0QkFBNEIsRUFDekQsTUFBSywrQ0FBK0MsQ0FBQztBQUN0RCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0saUNBQWlDLENBQUM7QUFDakUsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLGtDQUFrQyxDQUFDOztBQUduRSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSwwQ0FBMEMsQ0FBQzs7QUFFL0UsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sOENBQThDLENBQUM7O0lBRS9FLFVBQVUsR0FBRztJQUNqQixhQUFhO0lBQ2IsYUFBYTtJQUNiLGtCQUFrQjtJQUNsQixnQkFBZ0I7SUFDaEIsY0FBYztJQUNkLG1CQUFtQjtJQUNuQixpQkFBaUI7SUFDakIscUJBQXFCO0lBQ3JCLG1CQUFtQjtDQUNwQjtBQUVEO0lBQUE7SUFrQkEsQ0FBQzs7Z0JBbEJBLFFBQVEsU0FBQztvQkFDUixZQUFZLEVBQUUsRUFBRTtvQkFDaEIsT0FBTyxFQUFFO3dCQUNQLFNBQVM7d0JBQ1QsYUFBYSxDQUFDLE9BQU8sRUFBRTt3QkFDdkIsYUFBYSxDQUFDLE9BQU8sRUFBRTt3QkFDdkIsa0JBQWtCLENBQUMsT0FBTyxFQUFFO3dCQUM1QixVQUFVLENBQUMsT0FBTyxFQUFFO3dCQUNwQixnQkFBZ0IsQ0FBQyxPQUFPLEVBQUU7d0JBQzFCLGNBQWMsQ0FBQyxPQUFPLEVBQUU7d0JBQ3hCLG1CQUFtQixDQUFDLE9BQU8sRUFBRTt3QkFDN0IsaUJBQWlCLENBQUMsT0FBTyxFQUFFO3dCQUMzQixxQkFBcUIsQ0FBQyxPQUFPLEVBQUU7d0JBQy9CLG1CQUFtQixDQUFDLE9BQU8sRUFBRTtxQkFDOUI7b0JBQ0QsT0FBTyxFQUFFLFVBQVU7aUJBQ3BCOztJQUVELG1CQUFDO0NBQUEsQUFsQkQsSUFrQkM7U0FEWSxZQUFZO0FBR3pCO0lBQUE7SUFLQSxDQUFDOzs7O0lBSFEsZ0JBQU87OztJQUFkO1FBQ0UsT0FBTyxFQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUMsQ0FBQztJQUNsQyxDQUFDOztnQkFKRixRQUFRLFNBQUMsRUFBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUM7O0lBS3BELGVBQUM7Q0FBQSxBQUxELElBS0M7U0FKWSxRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kdWxlV2l0aFByb3ZpZGVycywgTmdNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE5nYk1vZHVsZSB9IGZyb20gJ0BuZy1ib290c3RyYXAvbmctYm9vdHN0cmFwJztcbmltcG9ydCB7IERmQWxlcnRNb2R1bGUgfSBmcm9tICcuL2FuZ3VsYXIvYWxlcnQvYWxlcnQubW9kdWxlJztcbmltcG9ydCB7IERmRGF0ZVBpY2tlck1vZHVsZSB9IGZyb20gJy4vYW5ndWxhci9kYXRlcGlja2VyL2RhdGVwaWNrZXIubW9kdWxlJztcbmltcG9ydCB7IEljb25Nb2R1bGUgfSBmcm9tICcuL2FuZ3VsYXIvaWNvbi9pY29uLm1vZHVsZSc7XG5pbXBvcnQgeyBEZk1vZGFsTW9kdWxlIH0gZnJvbSAnLi9hbmd1bGFyL21vZGFsL21vZGFsLnNlcnZpY2UnO1xuaW1wb3J0IHsgRGZSaWdodFRvTGVmdE1vZHVsZSB9IGZyb20gJy4vYW5ndWxhci9yaWdodC10by1sZWZ0L2RpcmVjdGlvbkRldGVjdGlvbi5zZXJ2aWNlJztcbmltcG9ydCB7IENzc1dyYXBwZXJNb2R1bGUgfSBmcm9tICcuL2FuZ3VsYXIvY3Nzd3JhcHBlci9jc3N3cmFwcGVyLm1vZHVsZSc7XG5pbXBvcnQgeyBEZlNlbGVjdE1vZHVsZSB9IGZyb20gJy4vYW5ndWxhci9zZWxlY3RzL3NlbGVjdC5tb2R1bGUnO1xuaW1wb3J0IHsgRGZQcm9ncmVzc2Jhck1vZHVsZSB9IGZyb20gJy4vYW5ndWxhci9wcm9ncmVzc2Jhci9wcm9ncmVzc2Jhci5tb2R1bGUnO1xuaW1wb3J0IHsgRGZJbnB1dEljb25Nb2R1bGUgfSBmcm9tICcuL2FuZ3VsYXIvaW5wdXRzL2lucHV0aWNvbi5tb2R1bGUnO1xuXG5cbi8vIGFsZXJ0XG5leHBvcnQgeyBJbnNlcnRBbGVydEljb25EaXJlY3RpdmUgfSBmcm9tICcuL2FuZ3VsYXIvYWxlcnQvaW5zZXJ0LWFsZXJ0LWljb24uZGlyZWN0aXZlJztcbmV4cG9ydCB7IERmQWxlcnRNb2R1bGUgfSBmcm9tICcuL2FuZ3VsYXIvYWxlcnQvYWxlcnQubW9kdWxlJztcblxuLy8gZGF0ZXBpY2tlclxuZXhwb3J0IHsgQ2xvc2VJbnB1dERhdGVQaWNrZXJEaXJlY3RpdmUgfSBmcm9tICcuL2FuZ3VsYXIvZGF0ZXBpY2tlci9jbG9zZWRhdGVwaWNrZXIuZGlyZWN0aXZlJztcbmV4cG9ydCB7IERmRGF0ZVBpY2tlck1vZHVsZSB9IGZyb20gJy4vYW5ndWxhci9kYXRlcGlja2VyL2RhdGVwaWNrZXIubW9kdWxlJztcblxuLy8gSWNvblxuZXhwb3J0IHsgSWNvbk1vZHVsZSB9IGZyb20gJy4vYW5ndWxhci9pY29uL2ljb24ubW9kdWxlJztcblxuLy8gTW9kYWxcbmV4cG9ydCB7IERmTW9kYWxTZXJ2aWNlIH0gZnJvbSAnLi9hbmd1bGFyL21vZGFsL21vZGFsLnNlcnZpY2UnO1xuXG4vLyBDU1N3cmFwcGVyXG5leHBvcnQgeyBDc3NXcmFwcGVyTW9kdWxlIH0gZnJvbSAnLi9hbmd1bGFyL2Nzc3dyYXBwZXIvY3Nzd3JhcHBlci5tb2R1bGUnO1xuXG4vLyBNb2RhbFxuZXhwb3J0IHsgRGZNb2RhbE1vZHVsZSB9IGZyb20gJy4vYW5ndWxhci9tb2RhbC9tb2RhbC5zZXJ2aWNlJztcblxuLy8gUmlnaHQgdG8gbGVmdCBmdW5jaW9uYWxpdHlcbmV4cG9ydCB7IERmUmlnaHRUb0xlZnRNb2R1bGUgfSBmcm9tICcuL2FuZ3VsYXIvcmlnaHQtdG8tbGVmdC9kaXJlY3Rpb25EZXRlY3Rpb24uc2VydmljZSc7XG5cbi8vIElucHV0SWNvbiBNb2R1bGVcbmV4cG9ydCB7IERmSW5wdXRJY29uRGlyZWN0aXZlIH0gZnJvbSAnLi9hbmd1bGFyL2lucHV0cy9pbnB1dGljb24uZGlyZWN0aXZlJztcbmV4cG9ydCB7IERmSW5wdXRJY29uTW9kdWxlIH0gZnJvbSAnLi9hbmd1bGFyL2lucHV0cy9pbnB1dGljb24ubW9kdWxlJztcblxuLy8gU2VsZWN0c1xuZXhwb3J0IHtcbiAgZGZNYW5hZ2VOYXZTZWxlY3REaXJlY3RpdmUsIGRmTWFuYWdlQmFkZ2VFdmVudHNEaXJlY3RpdmVcbn1mcm9tICcuL2FuZ3VsYXIvc2VsZWN0cy9tYW5hZ2UtbmF2LXNlbGVjdC5kaXJlY3RpdmUnO1xuZXhwb3J0IHsgRGZTZWxlY3RNb2R1bGUgfSBmcm9tICcuL2FuZ3VsYXIvc2VsZWN0cy9zZWxlY3QubW9kdWxlJztcbmV4cG9ydCB7IERmUG9wb3ZlckNvbmZpZyB9IGZyb20gJy4vYW5ndWxhci9wb3BvdmVyL3BvcG92ZXIuY29uZmlnJztcblxuLy8gUHJvZ3Jlc3NiYXJcbmV4cG9ydCB7IERmUHJvZ3Jlc3NiYXJNb2R1bGUgfSBmcm9tICcuL2FuZ3VsYXIvcHJvZ3Jlc3NiYXIvcHJvZ3Jlc3NiYXIubW9kdWxlJztcbi8vIEFjY2Vzc2liaWxpdHlcbmltcG9ydCB7IERmQWNjZXNzaWJpbGl0eU1vZHVsZSB9IGZyb20gJy4vYW5ndWxhci9hY2Nlc3NpYmlsaXR5L2FjY2Vzc2liaWxpdHkubW9kdWxlJztcblxuY29uc3QgREZfTU9EVUxFUyA9IFtcbiAgRGZNb2RhbE1vZHVsZSxcbiAgRGZBbGVydE1vZHVsZSxcbiAgRGZEYXRlUGlja2VyTW9kdWxlLFxuICBDc3NXcmFwcGVyTW9kdWxlLFxuICBEZlNlbGVjdE1vZHVsZSxcbiAgRGZQcm9ncmVzc2Jhck1vZHVsZSxcbiAgRGZJbnB1dEljb25Nb2R1bGUsXG4gIERmQWNjZXNzaWJpbGl0eU1vZHVsZSxcbiAgRGZSaWdodFRvTGVmdE1vZHVsZVxuXTtcblxuQE5nTW9kdWxlKHtcbiAgZGVjbGFyYXRpb25zOiBbXSxcbiAgaW1wb3J0czogW1xuICAgIE5nYk1vZHVsZSxcbiAgICBEZk1vZGFsTW9kdWxlLmZvclJvb3QoKSxcbiAgICBEZkFsZXJ0TW9kdWxlLmZvclJvb3QoKSxcbiAgICBEZkRhdGVQaWNrZXJNb2R1bGUuZm9yUm9vdCgpLFxuICAgIEljb25Nb2R1bGUuZm9yUm9vdCgpLFxuICAgIENzc1dyYXBwZXJNb2R1bGUuZm9yUm9vdCgpLFxuICAgIERmU2VsZWN0TW9kdWxlLmZvclJvb3QoKSxcbiAgICBEZlByb2dyZXNzYmFyTW9kdWxlLmZvclJvb3QoKSxcbiAgICBEZklucHV0SWNvbk1vZHVsZS5mb3JSb290KCksXG4gICAgRGZBY2Nlc3NpYmlsaXR5TW9kdWxlLmZvclJvb3QoKSxcbiAgICBEZlJpZ2h0VG9MZWZ0TW9kdWxlLmZvclJvb3QoKVxuICBdLFxuICBleHBvcnRzOiBERl9NT0RVTEVTXG59KVxuZXhwb3J0IGNsYXNzIERmUm9vdE1vZHVsZSB7XG59XG5cbkBOZ01vZHVsZSh7aW1wb3J0czogREZfTU9EVUxFUywgZXhwb3J0czogREZfTU9EVUxFU30pXG5leHBvcnQgY2xhc3MgRGZNb2R1bGUge1xuICBzdGF0aWMgZm9yUm9vdCgpOiBNb2R1bGVXaXRoUHJvdmlkZXJzIHtcbiAgICByZXR1cm4ge25nTW9kdWxlOiBEZlJvb3RNb2R1bGV9O1xuICB9XG59XG4iXX0=