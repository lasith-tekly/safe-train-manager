import { EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
export declare class DfProgressbarComponent implements OnInit, OnDestroy {
    infiniteAnimation: boolean;
    /**
     * Current value of the progressBar. If 'maxValue' is not defined, value represents a percentage. Otherwise, progress
     * bar percentage value will be computed based on the ratio of 'value/maxValue'
     */
    private _value;
    value: number;
    private _maxValue;
    maxValue: number;
    /**
     * Text to be displayed on top of the progressbar
     */
    private _text;
    text: string;
    /**
     * Observable used to trigger the start of the loading.
     * When emitting, progressbar will start to randomly increment toward 100%.
     */
    start$: Observable<any>;
    /**
     * Observable used to trigger the end of the loading.
     * When emitting, it forces the progressbar to reach 100%.
     */
    end$: Observable<any>;
    private _percentageValue;
    percentageValue: number;
    percentageValueEmitter: EventEmitter<number>;
    computedText: string;
    displayProgressBar: boolean;
    FADING_DELAY_MS: number;
    private startSubscription;
    private endSubscription;
    private intervalId;
    private animationOngoing;
    ngOnInit(): void;
    ngOnDestroy(): void;
    private updateText;
    private updatePercentageValue;
    /**
     * Randomly increase the percentage but making sure that it can never reach 100%
     */
    private increasePercentage;
    /**
     * Clears the 'setInterval' function so that the automatic increase of the progressbar stops
     */
    private stopAutomaticIncrement;
    /**
     * Periodically calls a function which increments the value of the progressbar
     */
    private startAutomaticIncrement;
    private resetProgressBarValues;
}
