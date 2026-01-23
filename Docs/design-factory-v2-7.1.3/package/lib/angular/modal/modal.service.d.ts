import { NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap/modal/modal.module';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RendererFactory2, ModuleWithProviders } from '@angular/core';
export declare class DfModalService {
    private modalService;
    private rendererFactory;
    private renderer;
    constructor(modalService: NgbModal, rendererFactory: RendererFactory2);
    open(content: any, options?: NgbModalOptions): NgbModalRef;
}
export declare class DfModalModule {
    static forRoot(): ModuleWithProviders;
}
