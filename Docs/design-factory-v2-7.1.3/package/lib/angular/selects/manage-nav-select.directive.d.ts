import { ElementRef, Renderer2, AfterViewInit, OnInit } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import { DfDirectionDetectionService } from '../right-to-left/directionDetection.service';
export declare class dfManageBadgeEventsDirective implements AfterViewInit {
    private renderer;
    private element;
    dfManageBadgeEventsSelect: [Function, any];
    constructor(renderer: Renderer2, element: ElementRef);
    ngAfterViewInit(): void;
    tabindex: string;
    handleKeyDownBackspace(event: any): void;
    handleClick(event: any): void;
    handleKeyDownEnter(event: any): void;
    handleKeyDownDelete(event: any): void;
}
export declare class dfManageNavSelectDirective implements OnInit {
    private select;
    private element;
    private rtlDirectionService;
    private direction;
    constructor(select: NgSelectComponent, element: ElementRef, rtlDirectionService: DfDirectionDetectionService);
    ngOnInit(): void;
    handleKeyDown(event: any): void;
    handleKeyDownBackspace(event: any): void;
    handleKeyDownRight(event: any): void;
    arrowRightInnerHandler(event: any): void;
    arrowLeftInnerHandler(event: any): void;
}
