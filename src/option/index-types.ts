import {OneOrMore, ShiftMain, ShiftSecure} from "@leyyo/common";
import {DecoInstanceLike} from "@leyyo/core";
import {CallWhen, CallWhenPro} from "../when";
import {CallParams} from "../param";

export interface CallOptionProcessorLike extends ShiftSecure<CallOptionProcessorSecure> {
    read<
        O extends CallOpt = CallOpt,
        O2 extends CallOptPro = CallOptPro>(
        ins: DecoInstanceLike,
        given: any,
        keys: Array<keyof O>,
        condition: OptKeyCondition<O>
    ): O2;
}

export interface CallOptionProcessorSecure extends ShiftMain<CallOptionProcessorLike> {
    readonly $SCOPE_SELF: CallScopePro;
    readonly $SCOPE_ARR_VAL: CallScopePro;
    readonly $SCOPE_REC_KEY: CallScopePro;
    readonly $SCOPE_REC_VAL: CallScopePro;

    $validate<P extends CallParams = CallParams>(ins: DecoInstanceLike, opt: CallOptPro<P>): void;

    $checkCondition<O extends CallOpt = CallOpt>(ins: DecoInstanceLike, condition: OptKeyCondition<O>): OptKeyConditionPro<O>;

    $setOpt<O extends CallOpt = CallOpt>(ins: DecoInstanceLike, opt: O, keys: Array<keyof O>, key: PropertyKey, value: any): void;

    $convertScope(ins: DecoInstanceLike, scope: CallScope): CallScopePro;

    $setWhen<P extends CallParams = CallParams>(ins: DecoInstanceLike, value: string | CallWhen<P>): CallWhenPro<P>;

    $setScopes(ins: DecoInstanceLike, scope: OneOrMore<CallScope>): Array<CallScopePro>;

    $checkKeys<O extends CallOpt = CallOpt>(ins: DecoInstanceLike, keys: Array<keyof O>): void;

    $read<O extends CallOpt = CallOpt>(ins: DecoInstanceLike, given: any, keys: Array<keyof O>, conditionPro: OptKeyConditionPro<O>): O;

    $setPro<O extends CallOpt = CallOpt, O2 extends CallOptPro = CallOptPro>(ins: DecoInstanceLike, opt: O): O2;

}

export type OptKeyType = 'string' | 'array' | 'number' | 'boolean' | 'symbol' | 'bigint' | 'function';
export type CallScope = 'self' | 's' | 'in-array' | 'a' | 'record-key' | 'k' | 'record-value' | 'v';
export type CallScopePro = 1 | 2 | 3 | 4;

export type OptKeyCondition<O extends CallOpt = CallOpt> = {
    [key in OptKeyType]?: OneOrMore<keyof O>;
}
export type OptKeyConditionPro<O extends CallOpt = CallOpt> = {
    [key in OptKeyType]?: Array<keyof O>;
}

/**
 * Options used to pass to validation decorators.
 */
export interface CallOpt<P extends CallParams = CallParams> {
    /**
     */
    scope?: OneOrMore<CallScope>;

    /**
     */
    when?: string | CallWhen<P>;
}

export interface CallOptPro<P extends CallParams = CallParams> {
    /**
     */
    scopes?: Array<CallScopePro>;

    /**
     */
    when?: CallWhenPro<P>;
}
