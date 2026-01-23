import { ElementRef, ModuleWithProviders } from '@angular/core';
export declare enum RightToLeftDirectionEnum {
    LeftToRight = "ltr",
    RightToLeft = "rtl",
    Auto = "auto"
}
export declare class DfDirectionDetectionService {
    getPageDirection(element: ElementRef): string;
}
export declare class DfRightToLeftModule {
    static forRoot(): ModuleWithProviders;
}
