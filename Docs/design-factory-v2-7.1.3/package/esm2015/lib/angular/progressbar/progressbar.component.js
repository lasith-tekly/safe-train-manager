/**
 * @fileoverview added by tsickle
 * Generated from: lib/angular/progressbar/progressbar.component.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
export class DfProgressbarComponent {
    constructor() {
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
    /**
     * @param {?} newValue
     * @return {?}
     */
    set value(newValue) {
        this._value = newValue;
        this.updatePercentageValue();
        this.updateText();
    }
    /**
     * @return {?}
     */
    get value() {
        return this._value;
    }
    /**
     * @param {?} newValue
     * @return {?}
     */
    set maxValue(newValue) {
        this._maxValue = newValue;
        this.updatePercentageValue();
        this.updateText();
    }
    /**
     * @return {?}
     */
    get maxValue() {
        return this._maxValue;
    }
    /**
     * @param {?} newText
     * @return {?}
     */
    set text(newText) {
        this._text = newText;
        this.updateText();
    }
    /**
     * @return {?}
     */
    get text() {
        return this._text;
    }
    /**
     * @param {?} newValue
     * @return {?}
     */
    set percentageValue(newValue) {
        this._percentageValue = newValue;
        this.percentageValueEmitter.emit(newValue);
    }
    /**
     * @return {?}
     */
    get percentageValue() {
        return this._percentageValue;
    }
    /**
     * @return {?}
     */
    ngOnInit() {
        /** @type {?} */
        const isTriggeredByObservables = this.start$ && this.end$;
        if (isTriggeredByObservables) {
            this.startSubscription = this.start$.subscribe((/**
             * @param {?} _
             * @return {?}
             */
            _ => {
                this.animationOngoing = true;
                this.stopAutomaticIncrement();
                this.resetProgressBarValues();
                this.displayProgressBar = true;
                this.startAutomaticIncrement();
            }));
            this.endSubscription = this.end$.subscribe((/**
             * @param {?} _
             * @return {?}
             */
            _ => {
                if (this.animationOngoing) {
                    this.animationOngoing = false;
                    this.stopAutomaticIncrement();
                    this.value = 100;
                    setTimeout((/**
                     * @return {?}
                     */
                    () => {
                        this.displayProgressBar = false;
                    }), this.FADING_DELAY_MS);
                }
            }));
        }
        else {
            this.displayProgressBar = true;
        }
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        if (this.startSubscription) {
            this.startSubscription.unsubscribe();
        }
        if (this.endSubscription) {
            this.endSubscription.unsubscribe();
        }
        this.stopAutomaticIncrement();
    }
    /**
     * @private
     * @return {?}
     */
    updateText() {
        /** @type {?} */
        const precentagePlaceholder = '%PERCENTAGE%';
        if (this.text.includes(precentagePlaceholder)) {
            /** @type {?} */
            const advancementInPercents = `${Math.floor(this.percentageValue)}%`;
            this.computedText = this.text.replace(precentagePlaceholder, advancementInPercents);
            return;
        }
        this.computedText = this.text;
    }
    /**
     * @private
     * @return {?}
     */
    updatePercentageValue() {
        if (this.value > this.maxValue) {
            this.percentageValue = 100;
            return;
        }
        this.percentageValue = Math.floor((this.value / this.maxValue) * 100);
    }
    /**
     * Randomly increase the percentage but making sure that it can never reach 100%
     * @private
     * @return {?}
     */
    increasePercentage() {
        /** @type {?} */
        const maximumReachableValue = 90;
        /** @type {?} */
        const remainingPercentage = maximumReachableValue - this.value;
        /** @type {?} */
        const averageIncreaseRatio = 0.015;
        /** @type {?} */
        const randomIncreaseRatio = Math.random() * 2 * averageIncreaseRatio;
        this.value += randomIncreaseRatio * remainingPercentage;
        this.updatePercentageValue();
        this.updateText();
    }
    /**
     * Clears the 'setInterval' function so that the automatic increase of the progressbar stops
     * @private
     * @return {?}
     */
    stopAutomaticIncrement() {
        clearInterval(this.intervalId);
    }
    /**
     * Periodically calls a function which increments the value of the progressbar
     * @private
     * @return {?}
     */
    startAutomaticIncrement() {
        this.intervalId = setInterval(this.increasePercentage.bind(this), 50);
    }
    /**
     * @private
     * @return {?}
     */
    resetProgressBarValues() {
        this.value = 0;
        this.maxValue = 100;
    }
}
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3Jlc3NiYXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6Im5nOi8vZGVzaWduLWZhY3RvcnktdjIvIiwic291cmNlcyI6WyJsaWIvYW5ndWxhci9wcm9ncmVzc2Jhci9wcm9ncmVzc2Jhci5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQXFCLE1BQU0sRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUMxRixPQUFPLEVBQUUsVUFBVSxFQUFnQixNQUFNLE1BQU0sQ0FBQztBQU9oRCxNQUFNLE9BQU8sc0JBQXNCO0lBTG5DO1FBT1csc0JBQWlCLEdBQUcsS0FBSyxDQUFDOzs7OztRQU8zQixXQUFNLEdBQUcsQ0FBQyxDQUFDO1FBYVgsY0FBUyxHQUFHLEdBQUcsQ0FBQzs7OztRQWdCaEIsVUFBSyxHQUFHLEVBQUUsQ0FBQztRQXdCWCxxQkFBZ0IsR0FBRyxDQUFDLENBQUM7UUFVRiwyQkFBc0IsR0FBRyxJQUFJLFlBQVksRUFBVSxDQUFDO1FBRXhFLGlCQUFZLEdBQUcsRUFBRSxDQUFDO1FBQ2xCLHVCQUFrQixHQUFHLEtBQUssQ0FBQztRQUMzQixvQkFBZSxHQUFHLElBQUksQ0FBQyxDQUFDLGlHQUFpRzs7UUFJeEgscUJBQWdCLEdBQUcsS0FBSyxDQUFDO0lBdUZuQyxDQUFDOzs7OztJQTVKQyxJQUNJLEtBQUssQ0FBQyxRQUFnQjtRQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQztRQUN2QixJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUM3QixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDcEIsQ0FBQzs7OztJQUVELElBQUksS0FBSztRQUNQLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNyQixDQUFDOzs7OztJQUlELElBQ0ksUUFBUSxDQUFDLFFBQWdCO1FBQzNCLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FB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MUM7OztnQ0FJRSxLQUFLO29CQVNMLEtBQUs7dUJBYUwsS0FBSzttQkFnQkwsS0FBSztxQkFjTCxLQUFLO21CQU1MLEtBQUs7cUNBWUwsTUFBTSxTQUFDLGlCQUFpQjs7OztJQXRFekIsbURBQW1DOzs7Ozs7O0lBT25DLHdDQUFtQjs7Ozs7SUFhbkIsMkNBQXdCOzs7Ozs7SUFnQnhCLHVDQUFtQjs7Ozs7O0lBZ0JuQix3Q0FBaUM7Ozs7OztJQU1qQyxzQ0FBK0I7Ozs7O0lBRS9CLGtEQUE2Qjs7SUFVN0Isd0RBQStFOztJQUUvRSw4Q0FBeUI7O0lBQ3pCLG9EQUFrQzs7SUFDbEMsaURBQThCOzs7OztJQUM5QixtREFBd0M7Ozs7O0lBQ3hDLGlEQUFzQzs7Ozs7SUFDdEMsNENBQXdCOzs7OztJQUN4QixrREFBaUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIEV2ZW50RW1pdHRlciwgSW5wdXQsIE9uRGVzdHJveSwgT25Jbml0LCBPdXRwdXQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUsIFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdkZi1wcm9ncmVzc2JhcicsXG4gIHRlbXBsYXRlVXJsOiAncHJvZ3Jlc3NiYXIuY29tcG9uZW50Lmh0bWwnXG59KVxuXG5leHBvcnQgY2xhc3MgRGZQcm9ncmVzc2JhckNvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95IHtcblxuICBASW5wdXQoKSBpbmZpbml0ZUFuaW1hdGlvbiA9IGZhbHNlO1xuXG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgdmFsdWUgb2YgdGhlIHByb2dyZXNzQmFyLiBJZiAnbWF4VmFsdWUnIGlzIG5vdCBkZWZpbmVkLCB2YWx1ZSByZXByZXNlbnRzIGEgcGVyY2VudGFnZS4gT3RoZXJ3aXNlLCBwcm9ncmVzc1xuICAgKiBiYXIgcGVyY2VudGFnZSB2YWx1ZSB3aWxsIGJlIGNvbXB1dGVkIGJhc2VkIG9uIHRoZSByYXRpbyBvZiAndmFsdWUvbWF4VmFsdWUnXG4gICAqL1xuICBwcml2YXRlIF92YWx1ZSA9IDA7XG5cbiAgQElucHV0KClcbiAgc2V0IHZhbHVlKG5ld1ZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl92YWx1ZSA9IG5ld1ZhbHVlO1xuICAgIHRoaXMudXBkYXRlUGVyY2VudGFnZVZhbHVlKCk7XG4gICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gIH1cblxuICBnZXQgdmFsdWUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gIH1cblxuICBwcml2YXRlIF9tYXhWYWx1ZSA9IDEwMDtcblxuICBASW5wdXQoKVxuICBzZXQgbWF4VmFsdWUobmV3VmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuX21heFZhbHVlID0gbmV3VmFsdWU7XG4gICAgdGhpcy51cGRhdGVQZXJjZW50YWdlVmFsdWUoKTtcbiAgICB0aGlzLnVwZGF0ZVRleHQoKTtcbiAgfVxuXG4gIGdldCBtYXhWYWx1ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9tYXhWYWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUZXh0IHRvIGJlIGRpc3BsYXllZCBvbiB0b3Agb2YgdGhlIHByb2dyZXNzYmFyXG4gICAqL1xuICBwcml2YXRlIF90ZXh0ID0gJyc7XG5cbiAgQElucHV0KClcbiAgc2V0IHRleHQobmV3VGV4dDogc3RyaW5nKSB7XG4gICAgdGhpcy5fdGV4dCA9IG5ld1RleHQ7XG4gICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gIH1cblxuICBnZXQgdGV4dCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl90ZXh0O1xuICB9XG5cbiAgLyoqXG4gICAqIE9ic2VydmFibGUgdXNlZCB0byB0cmlnZ2VyIHRoZSBzdGFydCBvZiB0aGUgbG9hZGluZy5cbiAgICogV2hlbiBlbWl0dGluZywgcHJvZ3Jlc3NiYXIgd2lsbCBzdGFydCB0byByYW5kb21seSBpbmNyZW1lbnQgdG93YXJkIDEwMCUuXG4gICAqL1xuICBASW5wdXQoKSBzdGFydCQ6IE9ic2VydmFibGU8YW55PjtcblxuICAvKipcbiAgICogT2JzZXJ2YWJsZSB1c2VkIHRvIHRyaWdnZXIgdGhlIGVuZCBvZiB0aGUgbG9hZGluZy5cbiAgICogV2hlbiBlbWl0dGluZywgaXQgZm9yY2VzIHRoZSBwcm9ncmVzc2JhciB0byByZWFjaCAxMDAlLlxuICAgKi9cbiAgQElucHV0KCkgZW5kJDogT2JzZXJ2YWJsZTxhbnk+O1xuXG4gIHByaXZhdGUgX3BlcmNlbnRhZ2VWYWx1ZSA9IDA7XG4gIHNldCBwZXJjZW50YWdlVmFsdWUobmV3VmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuX3BlcmNlbnRhZ2VWYWx1ZSA9IG5ld1ZhbHVlO1xuICAgIHRoaXMucGVyY2VudGFnZVZhbHVlRW1pdHRlci5lbWl0KG5ld1ZhbHVlKTtcbiAgfVxuXG4gIGdldCBwZXJjZW50YWdlVmFsdWUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fcGVyY2VudGFnZVZhbHVlO1xuICB9XG5cbiAgQE91dHB1dCgncGVyY2VudGFnZVZhbHVlJykgcGVyY2VudGFnZVZhbHVlRW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPigpO1xuXG4gIHB1YmxpYyBjb21wdXRlZFRleHQgPSAnJztcbiAgcHVibGljIGRpc3BsYXlQcm9ncmVzc0JhciA9IGZhbHNlO1xuICBwdWJsaWMgRkFESU5HX0RFTEFZX01TID0gMTUwMDsgLy8gaWYgdHJpZ2dlcmVkIGJ5IG9ic2VydmFibGVzLCBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGFmdGVyIHByb2dyZXNzIGJhciBkaXNhcHBlYXJzIG9uY2Ugc3RvcHBlZFxuICBwcml2YXRlIHN0YXJ0U3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG4gIHByaXZhdGUgZW5kU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG4gIHByaXZhdGUgaW50ZXJ2YWxJZDogYW55OyAvLyBzdG9yZSB0aGUgcmVzdWx0IG9mICdzZXRJbnRlcnZhbCcgZnVuY3Rpb24gc28gdGhhdCB3ZSBjYW4gY2xlYXIgaXQgb25EZXN0cm95XG4gIHByaXZhdGUgYW5pbWF0aW9uT25nb2luZyA9IGZhbHNlO1xuXG4gIG5nT25Jbml0KCkge1xuICAgIGNvbnN0IGlzVHJpZ2dlcmVkQnlPYnNlcnZhYmxlcyA9IHRoaXMuc3RhcnQkICYmIHRoaXMuZW5kJDtcbiAgICBpZiAoaXNUcmlnZ2VyZWRCeU9ic2VydmFibGVzKSB7XG4gICAgICB0aGlzLnN0YXJ0U3Vic2NyaXB0aW9uID0gdGhpcy5zdGFydCQuc3Vic2NyaWJlKF8gPT4ge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbk9uZ29pbmcgPSB0cnVlO1xuICAgICAgICB0aGlzLnN0b3BBdXRvbWF0aWNJbmNyZW1lbnQoKTtcbiAgICAgICAgdGhpcy5yZXNldFByb2dyZXNzQmFyVmFsdWVzKCk7XG4gICAgICAgIHRoaXMuZGlzcGxheVByb2dyZXNzQmFyID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5zdGFydEF1dG9tYXRpY0luY3JlbWVudCgpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLmVuZFN1YnNjcmlwdGlvbiA9IHRoaXMuZW5kJC5zdWJzY3JpYmUoXyA9PiB7XG4gICAgICAgIGlmICh0aGlzLmFuaW1hdGlvbk9uZ29pbmcpIHtcbiAgICAgICAgICB0aGlzLmFuaW1hdGlvbk9uZ29pbmcgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnN0b3BBdXRvbWF0aWNJbmNyZW1lbnQoKTtcbiAgICAgICAgICB0aGlzLnZhbHVlID0gMTAwO1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5kaXNwbGF5UHJvZ3Jlc3NCYXIgPSBmYWxzZTtcbiAgICAgICAgICB9LCB0aGlzLkZBRElOR19ERUxBWV9NUyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRpc3BsYXlQcm9ncmVzc0JhciA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuc3RhcnRTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuc3RhcnRTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuZW5kU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLmVuZFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgICB0aGlzLnN0b3BBdXRvbWF0aWNJbmNyZW1lbnQoKTtcblxuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVUZXh0KCkge1xuICAgIGNvbnN0IHByZWNlbnRhZ2VQbGFjZWhvbGRlciA9ICclUEVSQ0VOVEFHRSUnO1xuICAgIGlmICh0aGlzLnRleHQuaW5jbHVkZXMocHJlY2VudGFnZVBsYWNlaG9sZGVyKSkge1xuICAgICAgY29uc3QgYWR2YW5jZW1lbnRJblBlcmNlbnRzID0gYCR7TWF0aC5mbG9vcih0aGlzLnBlcmNlbnRhZ2VWYWx1ZSl9JWA7XG4gICAgICB0aGlzLmNvbXB1dGVkVGV4dCA9IHRoaXMudGV4dC5yZXBsYWNlKHByZWNlbnRhZ2VQbGFjZWhvbGRlciwgYWR2YW5jZW1lbnRJblBlcmNlbnRzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5jb21wdXRlZFRleHQgPSB0aGlzLnRleHQ7XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZVBlcmNlbnRhZ2VWYWx1ZSgpIHtcbiAgICBpZiAodGhpcy52YWx1ZSA+IHRoaXMubWF4VmFsdWUpIHtcbiAgICAgIHRoaXMucGVyY2VudGFnZVZhbHVlID0gMTAwO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnBlcmNlbnRhZ2VWYWx1ZSA9IE1hdGguZmxvb3IoKHRoaXMudmFsdWUgLyB0aGlzLm1heFZhbHVlKSAqIDEwMCk7XG4gIH1cblxuICAvKipcbiAgICogUmFuZG9tbHkgaW5jcmVhc2UgdGhlIHBlcmNlbnRhZ2UgYnV0IG1ha2luZyBzdXJlIHRoYXQgaXQgY2FuIG5ldmVyIHJlYWNoIDEwMCVcbiAgICovXG4gIHByaXZhdGUgaW5jcmVhc2VQZXJjZW50YWdlKCkge1xuICAgIGNvbnN0IG1heGltdW1SZWFjaGFibGVWYWx1ZSA9IDkwO1xuICAgIGNvbnN0IHJlbWFpbmluZ1BlcmNlbnRhZ2UgPSBtYXhpbXVtUmVhY2hhYmxlVmFsdWUgLSB0aGlzLnZhbHVlO1xuICAgIGNvbnN0IGF2ZXJhZ2VJbmNyZWFzZVJhdGlvID0gMC4wMTU7XG4gICAgY29uc3QgcmFuZG9tSW5jcmVhc2VSYXRpbyA9IE1hdGgucmFuZG9tKCkgKiAyICogYXZlcmFnZUluY3JlYXNlUmF0aW87XG4gICAgdGhpcy52YWx1ZSArPSByYW5kb21JbmNyZWFzZVJhdGlvICogcmVtYWluaW5nUGVyY2VudGFnZTtcbiAgICB0aGlzLnVwZGF0ZVBlcmNlbnRhZ2VWYWx1ZSgpO1xuICAgIHRoaXMudXBkYXRlVGV4dCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyB0aGUgJ3NldEludGVydmFsJyBmdW5jdGlvbiBzbyB0aGF0IHRoZSBhdXRvbWF0aWMgaW5jcmVhc2Ugb2YgdGhlIHByb2dyZXNzYmFyIHN0b3BzXG4gICAqL1xuICBwcml2YXRlIHN0b3BBdXRvbWF0aWNJbmNyZW1lbnQoKSB7XG4gICAgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmlvZGljYWxseSBjYWxscyBhIGZ1bmN0aW9uIHdoaWNoIGluY3JlbWVudHMgdGhlIHZhbHVlIG9mIHRoZSBwcm9ncmVzc2JhclxuICAgKi9cbiAgcHJpdmF0ZSBzdGFydEF1dG9tYXRpY0luY3JlbWVudCgpIHtcbiAgICB0aGlzLmludGVydmFsSWQgPSBzZXRJbnRlcnZhbCh0aGlzLmluY3JlYXNlUGVyY2VudGFnZS5iaW5kKHRoaXMpLCA1MCk7XG4gIH1cblxuICBwcml2YXRlIHJlc2V0UHJvZ3Jlc3NCYXJWYWx1ZXMoKSB7XG4gICAgdGhpcy52YWx1ZSA9IDA7XG4gICAgdGhpcy5tYXhWYWx1ZSA9IDEwMDtcbiAgfVxufVxuIl19