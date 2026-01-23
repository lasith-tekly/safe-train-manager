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
const DF_MODULES = [
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
export class DfRootModule {
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
export class DfModule {
    /**
     * @return {?}
     */
    static forRoot() {
        return { ngModule: DfRootModule };
    }
}
DfModule.decorators = [
    { type: NgModule, args: [{ imports: DF_MODULES, exports: DF_MODULES },] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290Ijoibmc6Ly9kZXNpZ24tZmFjdG9yeS12Mi8iLCJzb3VyY2VzIjpbImxpYi9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLE9BQU8sRUFBdUIsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzlELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUN2RCxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFDN0QsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sd0NBQXdDLENBQUM7QUFDNUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ3hELE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUM5RCxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxvREFBb0QsQ0FBQztBQUN6RixPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSx3Q0FBd0MsQ0FBQztBQUMxRSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0saUNBQWlDLENBQUM7QUFDakUsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sMENBQTBDLENBQUM7QUFDL0UsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sbUNBQW1DLENBQUM7O0FBSXRFLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxNQUFNLDZDQUE2QyxDQUFDO0FBQ3ZGLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQzs7QUFHN0QsT0FBTyxFQUFFLDZCQUE2QixFQUFFLE1BQU0sZ0RBQWdELENBQUM7QUFDL0YsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sd0NBQXdDLENBQUM7O0FBRzVFLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQzs7QUFHeEQsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLCtCQUErQixDQUFDOztBQUcvRCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSx3Q0FBd0MsQ0FBQzs7QUFHMUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLCtCQUErQixDQUFDOztBQUc5RCxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxvREFBb0QsQ0FBQzs7QUFHekYsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sc0NBQXNDLENBQUM7QUFDNUUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sbUNBQW1DLENBQUM7O0FBR3RFLE9BQU8sRUFDTCwwQkFBMEIsRUFBRSw0QkFBNEIsRUFDekQsTUFBSywrQ0FBK0MsQ0FBQztBQUN0RCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0saUNBQWlDLENBQUM7QUFDakUsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLGtDQUFrQyxDQUFDOztBQUduRSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSwwQ0FBMEMsQ0FBQzs7QUFFL0UsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sOENBQThDLENBQUM7O01BRS9FLFVBQVUsR0FBRztJQUNqQixhQUFhO0lBQ2IsYUFBYTtJQUNiLGtCQUFrQjtJQUNsQixnQkFBZ0I7SUFDaEIsY0FBYztJQUNkLG1CQUFtQjtJQUNuQixpQkFBaUI7SUFDakIscUJBQXFCO0lBQ3JCLG1CQUFtQjtDQUNwQjtBQW1CRCxNQUFNLE9BQU8sWUFBWTs7O1lBakJ4QixRQUFRLFNBQUM7Z0JBQ1IsWUFBWSxFQUFFLEVBQUU7Z0JBQ2hCLE9BQU8sRUFBRTtvQkFDUCxTQUFTO29CQUNULGFBQWEsQ0FBQyxPQUFPLEVBQUU7b0JBQ3ZCLGFBQWEsQ0FBQyxPQUFPLEVBQUU7b0JBQ3ZCLGtCQUFrQixDQUFDLE9BQU8sRUFBRTtvQkFDNUIsVUFBVSxDQUFDLE9BQU8sRUFBRTtvQkFDcEIsZ0JBQWdCLENBQUMsT0FBTyxFQUFFO29CQUMxQixjQUFjLENBQUMsT0FBTyxFQUFFO29CQUN4QixtQkFBbUIsQ0FBQyxPQUFPLEVBQUU7b0JBQzdCLGlCQUFpQixDQUFDLE9BQU8sRUFBRTtvQkFDM0IscUJBQXFCLENBQUMsT0FBTyxFQUFFO29CQUMvQixtQkFBbUIsQ0FBQyxPQUFPLEVBQUU7aUJBQzlCO2dCQUNELE9BQU8sRUFBRSxVQUFVO2FBQ3BCOztBQUtELE1BQU0sT0FBTyxRQUFROzs7O0lBQ25CLE1BQU0sQ0FBQyxPQUFPO1FBQ1osT0FBTyxFQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUMsQ0FBQztJQUNsQyxDQUFDOzs7WUFKRixRQUFRLFNBQUMsRUFBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2R1bGVXaXRoUHJvdmlkZXJzLCBOZ01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgTmdiTW9kdWxlIH0gZnJvbSAnQG5nLWJvb3RzdHJhcC9uZy1ib290c3RyYXAnO1xuaW1wb3J0IHsgRGZBbGVydE1vZHVsZSB9IGZyb20gJy4vYW5ndWxhci9hbGVydC9hbGVydC5tb2R1bGUnO1xuaW1wb3J0IHsgRGZEYXRlUGlja2VyTW9kdWxlIH0gZnJvbSAnLi9hbmd1bGFyL2RhdGVwaWNrZXIvZGF0ZXBpY2tlci5tb2R1bGUnO1xuaW1wb3J0IHsgSWNvbk1vZHVsZSB9IGZyb20gJy4vYW5ndWxhci9pY29uL2ljb24ubW9kdWxlJztcbmltcG9ydCB7IERmTW9kYWxNb2R1bGUgfSBmcm9tICcuL2FuZ3VsYXIvbW9kYWwvbW9kYWwuc2VydmljZSc7XG5pbXBvcnQgeyBEZlJpZ2h0VG9MZWZ0TW9kdWxlIH0gZnJvbSAnLi9hbmd1bGFyL3JpZ2h0LXRvLWxlZnQvZGlyZWN0aW9uRGV0ZWN0aW9uLnNlcnZpY2UnO1xuaW1wb3J0IHsgQ3NzV3JhcHBlck1vZHVsZSB9IGZyb20gJy4vYW5ndWxhci9jc3N3cmFwcGVyL2Nzc3dyYXBwZXIubW9kdWxlJztcbmltcG9ydCB7IERmU2VsZWN0TW9kdWxlIH0gZnJvbSAnLi9hbmd1bGFyL3NlbGVjdHMvc2VsZWN0Lm1vZHVsZSc7XG5pbXBvcnQgeyBEZlByb2dyZXNzYmFyTW9kdWxlIH0gZnJvbSAnLi9hbmd1bGFyL3Byb2dyZXNzYmFyL3Byb2dyZXNzYmFyLm1vZHVsZSc7XG5pbXBvcnQgeyBEZklucHV0SWNvbk1vZHVsZSB9IGZyb20gJy4vYW5ndWxhci9pbnB1dHMvaW5wdXRpY29uLm1vZHVsZSc7XG5cblxuLy8gYWxlcnRcbmV4cG9ydCB7IEluc2VydEFsZXJ0SWNvbkRpcmVjdGl2ZSB9IGZyb20gJy4vYW5ndWxhci9hbGVydC9pbnNlcnQtYWxlcnQtaWNvbi5kaXJlY3RpdmUnO1xuZXhwb3J0IHsgRGZBbGVydE1vZHVsZSB9IGZyb20gJy4vYW5ndWxhci9hbGVydC9hbGVydC5tb2R1bGUnO1xuXG4vLyBkYXRlcGlja2VyXG5leHBvcnQgeyBDbG9zZUlucHV0RGF0ZVBpY2tlckRpcmVjdGl2ZSB9IGZyb20gJy4vYW5ndWxhci9kYXRlcGlja2VyL2Nsb3NlZGF0ZXBpY2tlci5kaXJlY3RpdmUnO1xuZXhwb3J0IHsgRGZEYXRlUGlja2VyTW9kdWxlIH0gZnJvbSAnLi9hbmd1bGFyL2RhdGVwaWNrZXIvZGF0ZXBpY2tlci5tb2R1bGUnO1xuXG4vLyBJY29uXG5leHBvcnQgeyBJY29uTW9kdWxlIH0gZnJvbSAnLi9hbmd1bGFyL2ljb24vaWNvbi5tb2R1bGUnO1xuXG4vLyBNb2RhbFxuZXhwb3J0IHsgRGZNb2RhbFNlcnZpY2UgfSBmcm9tICcuL2FuZ3VsYXIvbW9kYWwvbW9kYWwuc2VydmljZSc7XG5cbi8vIENTU3dyYXBwZXJcbmV4cG9ydCB7IENzc1dyYXBwZXJNb2R1bGUgfSBmcm9tICcuL2FuZ3VsYXIvY3Nzd3JhcHBlci9jc3N3cmFwcGVyLm1vZHVsZSc7XG5cbi8vIE1vZGFsXG5leHBvcnQgeyBEZk1vZGFsTW9kdWxlIH0gZnJvbSAnLi9hbmd1bGFyL21vZGFsL21vZGFsLnNlcnZpY2UnO1xuXG4vLyBSaWdodCB0byBsZWZ0IGZ1bmNpb25hbGl0eVxuZXhwb3J0IHsgRGZSaWdodFRvTGVmdE1vZHVsZSB9IGZyb20gJy4vYW5ndWxhci9yaWdodC10by1sZWZ0L2RpcmVjdGlvbkRldGVjdGlvbi5zZXJ2aWNlJztcblxuLy8gSW5wdXRJY29uIE1vZHVsZVxuZXhwb3J0IHsgRGZJbnB1dEljb25EaXJlY3RpdmUgfSBmcm9tICcuL2FuZ3VsYXIvaW5wdXRzL2lucHV0aWNvbi5kaXJlY3RpdmUnO1xuZXhwb3J0IHsgRGZJbnB1dEljb25Nb2R1bGUgfSBmcm9tICcuL2FuZ3VsYXIvaW5wdXRzL2lucHV0aWNvbi5tb2R1bGUnO1xuXG4vLyBTZWxlY3RzXG5leHBvcnQge1xuICBkZk1hbmFnZU5hdlNlbGVjdERpcmVjdGl2ZSwgZGZNYW5hZ2VCYWRnZUV2ZW50c0RpcmVjdGl2ZVxufWZyb20gJy4vYW5ndWxhci9zZWxlY3RzL21hbmFnZS1uYXYtc2VsZWN0LmRpcmVjdGl2ZSc7XG5leHBvcnQgeyBEZlNlbGVjdE1vZHVsZSB9IGZyb20gJy4vYW5ndWxhci9zZWxlY3RzL3NlbGVjdC5tb2R1bGUnO1xuZXhwb3J0IHsgRGZQb3BvdmVyQ29uZmlnIH0gZnJvbSAnLi9hbmd1bGFyL3BvcG92ZXIvcG9wb3Zlci5jb25maWcnO1xuXG4vLyBQcm9ncmVzc2JhclxuZXhwb3J0IHsgRGZQcm9ncmVzc2Jhck1vZHVsZSB9IGZyb20gJy4vYW5ndWxhci9wcm9ncmVzc2Jhci9wcm9ncmVzc2Jhci5tb2R1bGUnO1xuLy8gQWNjZXNzaWJpbGl0eVxuaW1wb3J0IHsgRGZBY2Nlc3NpYmlsaXR5TW9kdWxlIH0gZnJvbSAnLi9hbmd1bGFyL2FjY2Vzc2liaWxpdHkvYWNjZXNzaWJpbGl0eS5tb2R1bGUnO1xuXG5jb25zdCBERl9NT0RVTEVTID0gW1xuICBEZk1vZGFsTW9kdWxlLFxuICBEZkFsZXJ0TW9kdWxlLFxuICBEZkRhdGVQaWNrZXJNb2R1bGUsXG4gIENzc1dyYXBwZXJNb2R1bGUsXG4gIERmU2VsZWN0TW9kdWxlLFxuICBEZlByb2dyZXNzYmFyTW9kdWxlLFxuICBEZklucHV0SWNvbk1vZHVsZSxcbiAgRGZBY2Nlc3NpYmlsaXR5TW9kdWxlLFxuICBEZlJpZ2h0VG9MZWZ0TW9kdWxlXG5dO1xuXG5ATmdNb2R1bGUoe1xuICBkZWNsYXJhdGlvbnM6IFtdLFxuICBpbXBvcnRzOiBbXG4gICAgTmdiTW9kdWxlLFxuICAgIERmTW9kYWxNb2R1bGUuZm9yUm9vdCgpLFxuICAgIERmQWxlcnRNb2R1bGUuZm9yUm9vdCgpLFxuICAgIERmRGF0ZVBpY2tlck1vZHVsZS5mb3JSb290KCksXG4gICAgSWNvbk1vZHVsZS5mb3JSb290KCksXG4gICAgQ3NzV3JhcHBlck1vZHVsZS5mb3JSb290KCksXG4gICAgRGZTZWxlY3RNb2R1bGUuZm9yUm9vdCgpLFxuICAgIERmUHJvZ3Jlc3NiYXJNb2R1bGUuZm9yUm9vdCgpLFxuICAgIERmSW5wdXRJY29uTW9kdWxlLmZvclJvb3QoKSxcbiAgICBEZkFjY2Vzc2liaWxpdHlNb2R1bGUuZm9yUm9vdCgpLFxuICAgIERmUmlnaHRUb0xlZnRNb2R1bGUuZm9yUm9vdCgpXG4gIF0sXG4gIGV4cG9ydHM6IERGX01PRFVMRVNcbn0pXG5leHBvcnQgY2xhc3MgRGZSb290TW9kdWxlIHtcbn1cblxuQE5nTW9kdWxlKHtpbXBvcnRzOiBERl9NT0RVTEVTLCBleHBvcnRzOiBERl9NT0RVTEVTfSlcbmV4cG9ydCBjbGFzcyBEZk1vZHVsZSB7XG4gIHN0YXRpYyBmb3JSb290KCk6IE1vZHVsZVdpdGhQcm92aWRlcnMge1xuICAgIHJldHVybiB7bmdNb2R1bGU6IERmUm9vdE1vZHVsZX07XG4gIH1cbn1cbiJdfQ==