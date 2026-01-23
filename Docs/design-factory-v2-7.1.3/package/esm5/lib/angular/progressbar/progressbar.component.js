/**
 * @fileoverview added by tsickle
 * Generated from: lib/angular/progressbar/progressbar.component.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
var DfProgressbarComponent = /** @class */ (function () {
    function DfProgressbarComponent() {
        this.infiniteAnimation = false;
        /**
         * Current value of the progressBar. If 'maxValue' is not defined, value represents a percentage. Otherwise, progress
         * bar percentage value will be computed based on the ratio of 'value/maxValue'
         */
        this._value = 0;
        this._maxValue = 100;
        /**
         * Text to be displayed on top of the progressbar
         */
        this._text = '';
        this._percentageValue = 0;
        this.percentageValueEmitter = new EventEmitter();
        this.computedText = '';
        this.displayProgressBar = false;
        this.FADING_DELAY_MS = 1500; // if triggered by observables, number of milliseconds after progress bar disappears once stopped
        // store the result of 'setInterval' function so that we can clear it onDestroy
        this.animationOngoing = false;
    }
    Object.defineProperty(DfProgressbarComponent.prototype, "value", {
        get: /**
         * @return {?}
         */
        function () {
            return this._value;
        },
        set: /**
         * @param {?} newValue
         * @return {?}
         */
        function (newValue) {
            this._value = newValue;
            this.updatePercentageValue();
            this.updateText();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DfProgressbarComponent.prototype, "maxValue", {
        get: /**
         * @return {?}
         */
        function () {
            return this._maxValue;
        },
        set: /**
         * @param {?} newValue
         * @return {?}
         */
        function (newValue) {
            this._maxValue = newValue;
            this.updatePercentageValue();
            this.updateText();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DfProgressbarComponent.prototype, "text", {
        get: /**
         * @return {?}
         */
        function () {
            return this._text;
        },
        set: /**
         * @param {?} newText
         * @return {?}
         */
        function (newText) {
            this._text = newText;
            this.updateText();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DfProgressbarComponent.prototype, "percentageValue", {
        get: /**
         * @return {?}
         */
        function () {
            return this._percentageValue;
        },
        set: /**
         * @param {?} newValue
         * @return {?}
         */
        function (newValue) {
            this._percentageValue = newValue;
            this.percentageValueEmitter.emit(newValue);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @return {?}
     */
    DfProgressbarComponent.prototype.ngOnInit = /**
     * @return {?}
     */
    function () {
        var _this = this;
        /** @type {?} */
        var isTriggeredByObservables = this.start$ && this.end$;
        if (isTriggeredByObservables) {
            this.startSubscription = this.start$.subscribe((/**
             * @param {?} _
             * @return {?}
             */
            function (_) {
                _this.animationOngoing = true;
                _this.stopAutomaticIncrement();
                _this.resetProgressBarValues();
                _this.displayProgressBar = true;
                _this.startAutomaticIncrement();
            }));
            this.endSubscription = this.end$.subscribe((/**
             * @param {?} _
             * @return {?}
             */
            function (_) {
                if (_this.animationOngoing) {
                    _this.animationOngoing = false;
                    _this.stopAutomaticIncrement();
                    _this.value = 100;
                    setTimeout((/**
                     * @return {?}
                     */
                    function () {
                        _this.displayProgressBar = false;
                    }), _this.FADING_DELAY_MS);
                }
            }));
        }
        else {
            this.displayProgressBar = true;
        }
    };
    /**
     * @return {?}
     */
    DfProgressbarComponent.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        if (this.startSubscription) {
            this.startSubscription.unsubscribe();
        }
        if (this.endSubscription) {
            this.endSubscription.unsubscribe();
        }
        this.stopAutomaticIncrement();
    };
    /**
     * @private
     * @return {?}
     */
    DfProgressbarComponent.prototype.updateText = /**
     * @private
     * @return {?}
     */
    function () {
        /** @type {?} */
        var precentagePlaceholder = '%PERCENTAGE%';
        if (this.text.includes(precentagePlaceholder)) {
            /** @type {?} */
            var advancementInPercents = Math.floor(this.percentageValue) + "%";
            this.computedText = this.text.replace(precentagePlaceholder, advancementInPercents);
            return;
        }
        this.computedText = this.text;
    };
    /**
     * @private
     * @return {?}
     */
    DfProgressbarComponent.prototype.updatePercentageValue = /**
     * @private
     * @return {?}
     */
    function () {
        if (this.value > this.maxValue) {
            this.percentageValue = 100;
            return;
        }
        this.percentageValue = Math.floor((this.value / this.maxValue) * 100);
    };
    /**
     * Randomly increase the percentage but making sure that it can never reach 100%
     */
    /**
     * Randomly increase the percentage but making sure that it can never reach 100%
     * @private
     * @return {?}
     */
    DfProgressbarComponent.prototype.increasePercentage = /**
     * Randomly increase the percentage but making sure that it can never reach 100%
     * @private
     * @return {?}
     */
    function () {
        /** @type {?} */
        var maximumReachableValue = 90;
        /** @type {?} */
        var remainingPercentage = maximumReachableValue - this.value;
        /** @type {?} */
        var averageIncreaseRatio = 0.015;
        /** @type {?} */
        var randomIncreaseRatio = Math.random() * 2 * averageIncreaseRatio;
        this.value += randomIncreaseRatio * remainingPercentage;
        this.updatePercentageValue();
        this.updateText();
    };
    /**
     * Clears the 'setInterval' function so that the automatic increase of the progressbar stops
     */
    /**
     * Clears the 'setInterval' function so that the automatic increase of the progressbar stops
     * @private
     * @return {?}
     */
    DfProgressbarComponent.prototype.stopAutomaticIncrement = /**
     * Clears the 'setInterval' function so that the automatic increase of the progressbar stops
     * @private
     * @return {?}
     */
    function () {
        clearInterval(this.intervalId);
    };
    /**
     * Periodically calls a function which increments the value of the progressbar
     */
    /**
     * Periodically calls a function which increments the value of the progressbar
     * @private
     * @return {?}
     */
    DfProgressbarComponent.prototype.startAutomaticIncrement = /**
     * Periodically calls a function which increments the value of the progressbar
     * @private
     * @return {?}
     */
    function () {
        this.intervalId = setInterval(this.increasePercentage.bind(this), 50);
    };
    /**
     * @private
     * @return {?}
     */
    DfProgressbarComponent.prototype.resetProgressBarValues = /**
     * @private
     * @return {?}
     */
    function () {
        this.value = 0;
        this.maxValue = 100;
    };
    DfProgressbarComponent.decorators = [
        { type: Component, args: [{
                    selector: 'df-progressbar',
                    template: "<div *ngIf=\"displayProgressBar\" class=\"mt-3 mx-1\">\n  <div *ngIf=\"computedText\" class=\"progressbar-text mb-2\">{{ computedText }}</div>\n  <div class=\"progress\">\n    <ng-container *ngIf=\"infiniteAnimation; else withValue\">\n      <div class=\"progress-bar infinite-animation\" role=\"progressbar\" aria-valuetext=\"indeterminate\"></div>\n    </ng-container>\n    <ng-template #withValue>\n      <div [style.width.%]=\"percentageValue\" class=\"progress-bar\" role=\"progressbar\"\n           [attr.aria-valuenow]=\"value\" aria-valuemin=\"0\"\n           [attr.aria-valuemax]=\"maxValue\" [attr.aria-valuetext]=\"computedText ? computedText : null\"></div>\n    </ng-template>\n  </div>\n</div>\n\n"
                }] }
    ];
    DfProgressbarComponent.propDecorators = {
        infiniteAnimation: [{ type: Input }],
        value: [{ type: Input }],
        maxValue: [{ type: Input }],
        text: [{ type: Input }],
        start$: [{ type: Input }],
        end$: [{ type: Input }],
        percentageValueEmitter: [{ type: Output, args: ['percentageValue',] }]
    };
    return DfProgressbarComponent;
}());
export { DfProgressbarComponent };
if (false) {
    /** @type {?} */
    DfProgressbarComponent.prototype.infiniteAnimation;
    /**
     * Current value of the progressBar. If 'maxValue' is not defined, value represents a percentage. Otherwise, progress
     * bar percentage value will be computed based on the ratio of 'value/maxValue'
     * @type {?}
     * @private
     */
    DfProgressbarComponent.prototype._value;
    /**
     * @type {?}
     * @private
     */
    DfProgressbarComponent.prototype._maxValue;
    /**
     * Text to be displayed on top of the progressbar
     * @type {?}
     * @private
     */
    DfProgressbarComponent.prototype._text;
    /**
     * Observable used to trigger the start of the loading.
     * When emitting, progressbar will start to randomly increment toward 100%.
     * @type {?}
     */
    DfProgressbarComponent.prototype.start$;
    /**
     * Observable used to trigger the end of the loading.
     * When emitting, it forces the progressbar to reach 100%.
     * @type {?}
     */
    DfProgressbarComponent.prototype.end$;
    /**
     * @type {?}
     * @private
     */
    DfProgressbarComponent.prototype._percentageValue;
    /** @type {?} */
    DfProgressbarComponent.prototype.percentageValueEmitter;
    /** @type {?} */
    DfProgressbarComponent.prototype.computedText;
    /** @type {?} */
    DfProgressbarComponent.prototype.displayProgressBar;
    /** @type {?} */
    DfProgressbarComponent.prototype.FADING_DELAY_MS;
    /**
     * @type {?}
     * @private
     */
    DfProgressbarComponent.prototype.startSubscription;
    /**
     * @type {?}
     * @private
     */
    DfProgressbarComponent.prototype.endSubscription;
    /**
     * @type {?}
     * @private
     */
    DfProgressbarComponent.prototype.intervalId;
    /**
     * @type {?}
     * @private
     */
    DfProgressbarComponent.prototype.animationOngoing;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3Jlc3NiYXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6Im5nOi8vZGVzaWduLWZhY3RvcnktdjIvIiwic291cmNlcyI6WyJsaWIvYW5ndWxhci9wcm9ncmVzc2Jhci9wcm9ncmVzc2Jhci5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQXFCLE1BQU0sRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUMxRixPQUFPLEVBQUUsVUFBVSxFQUFnQixNQUFNLE1BQU0sQ0FBQztBQUVoRDtJQUFBO1FBT1csc0JBQWlCLEdBQUcsS0FBSyxDQUFDOzs7OztRQU8zQixXQUFNLEdBQUcsQ0FBQyxDQUFDO1FBYVgsY0FBUyxHQUFHLEdBQUcsQ0FBQzs7OztRQWdCaEIsVUFBSyxHQUFHLEVBQUUsQ0FBQztRQXdCWCxxQkFBZ0IsR0FBRyxDQUFDLENBQUM7UUFVRiwyQkFBc0IsR0FBRyxJQUFJLFlBQVksRUFBVSxDQUFDO1FBRXhFLGlCQUFZLEdBQUcsRUFBRSxDQUFDO1FBQ2xCLHVCQUFrQixHQUFHLEtBQUssQ0FBQztRQUMzQixvQkFBZSxHQUFHLElBQUksQ0FBQyxDQUFDLGlHQUFpRzs7UUFJeEgscUJBQWdCLEdBQUcsS0FBSyxDQUFDO0lBdUZuQyxDQUFDO0lBNUpDLHNCQUNJLHlDQUFLOzs7O1FBTVQ7WUFDRSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDckIsQ0FBQzs7Ozs7UUFURCxVQUNVLFFBQWdCO1lBQ3hCLElBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNwQixDQUFDOzs7T0FBQTtJQVFELHNCQUNJLDRDQUFROzs7O1FBTVo7WUFDRSxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDeEIsQ0FBQzs7Ozs7UUFURCxVQUNhLFFB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LFFBQVEsR0FBRyxHQUFHLENBQUM7SUFDdEIsQ0FBQzs7Z0JBM0tGLFNBQVMsU0FBQztvQkFDVCxRQUFRLEVBQUUsZ0JBQWdCO29CQUMxQixtdEJBQXlDO2lCQUMxQzs7O29DQUlFLEtBQUs7d0JBU0wsS0FBSzsyQkFhTCxLQUFLO3VCQWdCTCxLQUFLO3lCQWNMLEtBQUs7dUJBTUwsS0FBSzt5Q0FZTCxNQUFNLFNBQUMsaUJBQWlCOztJQStGM0IsNkJBQUM7Q0FBQSxBQTVLRCxJQTRLQztTQXZLWSxzQkFBc0I7OztJQUVqQyxtREFBbUM7Ozs7Ozs7SUFPbkMsd0NBQW1COzs7OztJQWFuQiwyQ0FBd0I7Ozs7OztJQWdCeEIsdUNBQW1COzs7Ozs7SUFnQm5CLHdDQUFpQzs7Ozs7O0lBTWpDLHNDQUErQjs7Ozs7SUFFL0Isa0RBQTZCOztJQVU3Qix3REFBK0U7O0lBRS9FLDhDQUF5Qjs7SUFDekIsb0RBQWtDOztJQUNsQyxpREFBOEI7Ozs7O0lBQzlCLG1EQUF3Qzs7Ozs7SUFDeEMsaURBQXNDOzs7OztJQUN0Qyw0Q0FBd0I7Ozs7O0lBQ3hCLGtEQUFpQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgRXZlbnRFbWl0dGVyLCBJbnB1dCwgT25EZXN0cm95LCBPbkluaXQsIE91dHB1dCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2RmLXByb2dyZXNzYmFyJyxcbiAgdGVtcGxhdGVVcmw6ICdwcm9ncmVzc2Jhci5jb21wb25lbnQuaHRtbCdcbn0pXG5cbmV4cG9ydCBjbGFzcyBEZlByb2dyZXNzYmFyQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3kge1xuXG4gIEBJbnB1dCgpIGluZmluaXRlQW5pbWF0aW9uID0gZmFsc2U7XG5cblxuICAvKipcbiAgICogQ3VycmVudCB2YWx1ZSBvZiB0aGUgcHJvZ3Jlc3NCYXIuIElmICdtYXhWYWx1ZScgaXMgbm90IGRlZmluZWQsIHZhbHVlIHJlcHJlc2VudHMgYSBwZXJjZW50YWdlLiBPdGhlcndpc2UsIHByb2dyZXNzXG4gICAqIGJhciBwZXJjZW50YWdlIHZhbHVlIHdpbGwgYmUgY29tcHV0ZWQgYmFzZWQgb24gdGhlIHJhdGlvIG9mICd2YWx1ZS9tYXhWYWx1ZSdcbiAgICovXG4gIHByaXZhdGUgX3ZhbHVlID0gMDtcblxuICBASW5wdXQoKVxuICBzZXQgdmFsdWUobmV3VmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuX3ZhbHVlID0gbmV3VmFsdWU7XG4gICAgdGhpcy51cGRhdGVQZXJjZW50YWdlVmFsdWUoKTtcbiAgICB0aGlzLnVwZGF0ZVRleHQoKTtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgfVxuXG4gIHByaXZhdGUgX21heFZhbHVlID0gMTAwO1xuXG4gIEBJbnB1dCgpXG4gIHNldCBtYXhWYWx1ZShuZXdWYWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fbWF4VmFsdWUgPSBuZXdWYWx1ZTtcbiAgICB0aGlzLnVwZGF0ZVBlcmNlbnRhZ2VWYWx1ZSgpO1xuICAgIHRoaXMudXBkYXRlVGV4dCgpO1xuICB9XG5cbiAgZ2V0IG1heFZhbHVlKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX21heFZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFRleHQgdG8gYmUgZGlzcGxheWVkIG9uIHRvcCBvZiB0aGUgcHJvZ3Jlc3NiYXJcbiAgICovXG4gIHByaXZhdGUgX3RleHQgPSAnJztcblxuICBASW5wdXQoKVxuICBzZXQgdGV4dChuZXdUZXh0OiBzdHJpbmcpIHtcbiAgICB0aGlzLl90ZXh0ID0gbmV3VGV4dDtcbiAgICB0aGlzLnVwZGF0ZVRleHQoKTtcbiAgfVxuXG4gIGdldCB0ZXh0KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX3RleHQ7XG4gIH1cblxuICAvKipcbiAgICogT2JzZXJ2YWJsZSB1c2VkIHRvIHRyaWdnZXIgdGhlIHN0YXJ0IG9mIHRoZSBsb2FkaW5nLlxuICAgKiBXaGVuIGVtaXR0aW5nLCBwcm9ncmVzc2JhciB3aWxsIHN0YXJ0IHRvIHJhbmRvbWx5IGluY3JlbWVudCB0b3dhcmQgMTAwJS5cbiAgICovXG4gIEBJbnB1dCgpIHN0YXJ0JDogT2JzZXJ2YWJsZTxhbnk+O1xuXG4gIC8qKlxuICAgKiBPYnNlcnZhYmxlIHVzZWQgdG8gdHJpZ2dlciB0aGUgZW5kIG9mIHRoZSBsb2FkaW5nLlxuICAgKiBXaGVuIGVtaXR0aW5nLCBpdCBmb3JjZXMgdGhlIHByb2dyZXNzYmFyIHRvIHJlYWNoIDEwMCUuXG4gICAqL1xuICBASW5wdXQoKSBlbmQkOiBPYnNlcnZhYmxlPGFueT47XG5cbiAgcHJpdmF0ZSBfcGVyY2VudGFnZVZhbHVlID0gMDtcbiAgc2V0IHBlcmNlbnRhZ2VWYWx1ZShuZXdWYWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fcGVyY2VudGFnZVZhbHVlID0gbmV3VmFsdWU7XG4gICAgdGhpcy5wZXJjZW50YWdlVmFsdWVFbWl0dGVyLmVtaXQobmV3VmFsdWUpO1xuICB9XG5cbiAgZ2V0IHBlcmNlbnRhZ2VWYWx1ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9wZXJjZW50YWdlVmFsdWU7XG4gIH1cblxuICBAT3V0cHV0KCdwZXJjZW50YWdlVmFsdWUnKSBwZXJjZW50YWdlVmFsdWVFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KCk7XG5cbiAgcHVibGljIGNvbXB1dGVkVGV4dCA9ICcnO1xuICBwdWJsaWMgZGlzcGxheVByb2dyZXNzQmFyID0gZmFsc2U7XG4gIHB1YmxpYyBGQURJTkdfREVMQVlfTVMgPSAxNTAwOyAvLyBpZiB0cmlnZ2VyZWQgYnkgb2JzZXJ2YWJsZXMsIG51bWJlciBvZiBtaWxsaXNlY29uZHMgYWZ0ZXIgcHJvZ3Jlc3MgYmFyIGRpc2FwcGVhcnMgb25jZSBzdG9wcGVkXG4gIHByaXZhdGUgc3RhcnRTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbjtcbiAgcHJpdmF0ZSBlbmRTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbjtcbiAgcHJpdmF0ZSBpbnRlcnZhbElkOiBhbnk7IC8vIHN0b3JlIHRoZSByZXN1bHQgb2YgJ3NldEludGVydmFsJyBmdW5jdGlvbiBzbyB0aGF0IHdlIGNhbiBjbGVhciBpdCBvbkRlc3Ryb3lcbiAgcHJpdmF0ZSBhbmltYXRpb25PbmdvaW5nID0gZmFsc2U7XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgY29uc3QgaXNUcmlnZ2VyZWRCeU9ic2VydmFibGVzID0gdGhpcy5zdGFydCQgJiYgdGhpcy5lbmQkO1xuICAgIGlmIChpc1RyaWdnZXJlZEJ5T2JzZXJ2YWJsZXMpIHtcbiAgICAgIHRoaXMuc3RhcnRTdWJzY3JpcHRpb24gPSB0aGlzLnN0YXJ0JC5zdWJzY3JpYmUoXyA9PiB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9uT25nb2luZyA9IHRydWU7XG4gICAgICAgIHRoaXMuc3RvcEF1dG9tYXRpY0luY3JlbWVudCgpO1xuICAgICAgICB0aGlzLnJlc2V0UHJvZ3Jlc3NCYXJWYWx1ZXMoKTtcbiAgICAgICAgdGhpcy5kaXNwbGF5UHJvZ3Jlc3NCYXIgPSB0cnVlO1xuICAgICAgICB0aGlzLnN0YXJ0QXV0b21hdGljSW5jcmVtZW50KCk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuZW5kU3Vic2NyaXB0aW9uID0gdGhpcy5lbmQkLnN1YnNjcmliZShfID0+IHtcbiAgICAgICAgaWYgKHRoaXMuYW5pbWF0aW9uT25nb2luZykge1xuICAgICAgICAgIHRoaXMuYW5pbWF0aW9uT25nb2luZyA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMuc3RvcEF1dG9tYXRpY0luY3JlbWVudCgpO1xuICAgICAgICAgIHRoaXMudmFsdWUgPSAxMDA7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXlQcm9ncmVzc0JhciA9IGZhbHNlO1xuICAgICAgICAgIH0sIHRoaXMuRkFESU5HX0RFTEFZX01TKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGlzcGxheVByb2dyZXNzQmFyID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5zdGFydFN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5zdGFydFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5lbmRTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuZW5kU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgfVxuICAgIHRoaXMuc3RvcEF1dG9tYXRpY0luY3JlbWVudCgpO1xuXG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZVRleHQoKSB7XG4gICAgY29uc3QgcHJlY2VudGFnZVBsYWNlaG9sZGVyID0gJyVQRVJDRU5UQUdFJSc7XG4gICAgaWYgKHRoaXMudGV4dC5pbmNsdWRlcyhwcmVjZW50YWdlUGxhY2Vob2xkZXIpKSB7XG4gICAgICBjb25zdCBhZHZhbmNlbWVudEluUGVyY2VudHMgPSBgJHtNYXRoLmZsb29yKHRoaXMucGVyY2VudGFnZVZhbHVlKX0lYDtcbiAgICAgIHRoaXMuY29tcHV0ZWRUZXh0ID0gdGhpcy50ZXh0LnJlcGxhY2UocHJlY2VudGFnZVBsYWNlaG9sZGVyLCBhZHZhbmNlbWVudEluUGVyY2VudHMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmNvbXB1dGVkVGV4dCA9IHRoaXMudGV4dDtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlUGVyY2VudGFnZVZhbHVlKCkge1xuICAgIGlmICh0aGlzLnZhbHVlID4gdGhpcy5tYXhWYWx1ZSkge1xuICAgICAgdGhpcy5wZXJjZW50YWdlVmFsdWUgPSAxMDA7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMucGVyY2VudGFnZVZhbHVlID0gTWF0aC5mbG9vcigodGhpcy52YWx1ZSAvIHRoaXMubWF4VmFsdWUpICogMTAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSYW5kb21seSBpbmNyZWFzZSB0aGUgcGVyY2VudGFnZSBidXQgbWFraW5nIHN1cmUgdGhhdCBpdCBjYW4gbmV2ZXIgcmVhY2ggMTAwJVxuICAgKi9cbiAgcHJpdmF0ZSBpbmNyZWFzZVBlcmNlbnRhZ2UoKSB7XG4gICAgY29uc3QgbWF4aW11bVJlYWNoYWJsZVZhbHVlID0gOTA7XG4gICAgY29uc3QgcmVtYWluaW5nUGVyY2VudGFnZSA9IG1heGltdW1SZWFjaGFibGVWYWx1ZSAtIHRoaXMudmFsdWU7XG4gICAgY29uc3QgYXZlcmFnZUluY3JlYXNlUmF0aW8gPSAwLjAxNTtcbiAgICBjb25zdCByYW5kb21JbmNyZWFzZVJhdGlvID0gTWF0aC5yYW5kb20oKSAqIDIgKiBhdmVyYWdlSW5jcmVhc2VSYXRpbztcbiAgICB0aGlzLnZhbHVlICs9IHJhbmRvbUluY3JlYXNlUmF0aW8gKiByZW1haW5pbmdQZXJjZW50YWdlO1xuICAgIHRoaXMudXBkYXRlUGVyY2VudGFnZVZhbHVlKCk7XG4gICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIHRoZSAnc2V0SW50ZXJ2YWwnIGZ1bmN0aW9uIHNvIHRoYXQgdGhlIGF1dG9tYXRpYyBpbmNyZWFzZSBvZiB0aGUgcHJvZ3Jlc3NiYXIgc3RvcHNcbiAgICovXG4gIHByaXZhdGUgc3RvcEF1dG9tYXRpY0luY3JlbWVudCgpIHtcbiAgICBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWxJZCk7XG4gIH1cblxuICAvKipcbiAgICogUGVyaW9kaWNhbGx5IGNhbGxzIGEgZnVuY3Rpb24gd2hpY2ggaW5jcmVtZW50cyB0aGUgdmFsdWUgb2YgdGhlIHByb2dyZXNzYmFyXG4gICAqL1xuICBwcml2YXRlIHN0YXJ0QXV0b21hdGljSW5jcmVtZW50KCkge1xuICAgIHRoaXMuaW50ZXJ2YWxJZCA9IHNldEludGVydmFsKHRoaXMuaW5jcmVhc2VQZXJjZW50YWdlLmJpbmQodGhpcyksIDUwKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVzZXRQcm9ncmVzc0JhclZhbHVlcygpIHtcbiAgICB0aGlzLnZhbHVlID0gMDtcbiAgICB0aGlzLm1heFZhbHVlID0gMTAwO1xuICB9XG59XG4iXX0=