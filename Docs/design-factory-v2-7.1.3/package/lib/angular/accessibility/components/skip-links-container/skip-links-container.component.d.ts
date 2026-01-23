import { AfterContentInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
export declare class SkipLinksContainerComponent implements AfterContentInit, OnDestroy {
    private changeDetector;
    private links;
    _inFocus: boolean;
    private focusSubscription;
    constructor(changeDetector: ChangeDetectorRef);
    ngAfterContentInit(): void;
    ngOnDestroy(): void;
}
