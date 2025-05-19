import {ShiftMain, ShiftSecure, WrapLike} from "@leyyo/common";
import {DecoIdLike, DecoInstanceLike} from "@leyyo/core";
import {CallParams, CallValue, CallValuePro} from "../param";
import {CallOptPro} from "../option";
import {Ctx} from "@leyyo/http";

export interface CallItemProcessorLike extends ShiftSecure<CallItemProcessorSecure> {
    buildItem<P extends CallParams = CallParams, O extends CallOptPro<P> = CallOptPro<P>>(ins: DecoInstanceLike, opt: O, params: P): CallItem<P, O>;

    buildCurrent<P extends CallParams = CallParams, O extends CallOptPro<P> = CallOptPro<P>>(ctx: Ctx, field: string, item: CallItem<P, O>): Promise<CallCurrent<P>>;
}

export interface CallItemProcessorSecure extends ShiftMain<CallItemProcessorLike> {
    $getLambdaStat<P extends CallParams = CallParams>(params: P): CallItemKeys<P>;
}

export interface CallItemKeys<P extends CallParams = CallParams> {
    hasLambda: boolean;

    // keys
    allKeys: Array<keyof P>;

    // keys without any lambda
    clonedKeys: Array<keyof P>;

    // keys with sync lambda
    syncKeys: Array<keyof P>;

    // keys with async lambda
    asyncKeys: Array<keyof P>;
}

interface CallItemShared {
    ins: DecoInstanceLike;
    deco: DecoIdLike;
}


export type CallCurrent<P extends CallParams = CallParams> = Readonly<_CallCurrent<P>>;

interface _CallCurrent<P extends CallParams = CallParams> extends CallItemShared {
    ctx: Ctx;
    field: string;
    config: CallConstraintConfig<P>;
}

export type CallItem<P extends CallParams = CallParams, O extends CallOptPro = CallOptPro> = Readonly<_CallItem<P, O>>;

export interface _CallItem<P extends CallParams = CallParams, O extends CallOptPro = CallOptPro> extends CallItemShared {
    opt: O;
    constraint: CallConstraint<P>;
}

export interface CallConstraint<P extends CallParams = CallParams> extends CallItemKeys<P> {
    params: P;
    // there is no lambda for these properties
    clonedConfig: CallConstraintConfig<Partial<P>>;
}

export type CallConstraintConfig<C extends CallParams = CallParams> = Readonly<_CallConstraintConfig<C>>;
type _CallConstraintConfig<C extends CallParams = CallParams> = {
    [K in keyof C]: CallConstraintConfigItem<C[K], C>;
}
export type CallConstraintConfigItem<T, P extends CallParams = CallParams> =
    T extends CallValuePro<infer W, P> ? (
        W extends WrapLike<infer Z> ? (
            Z extends Promise<infer Y> ? Y : Z
        ) : W
    ) : T;
export type ToValueAny<T, P extends CallParams = CallParams> = T extends CallValuePro<infer Z, P> ? Z : T;


// noinspection JSUnusedGlobalSymbols
export type CallGiven<C extends CallParams = CallParams> = _CallGiven<C, _CallConstraintConfig<C>>;

type _CallGiven<C extends CallParams, X extends _CallConstraintConfig<C>> = {
    [K in keyof X]: CallValue<X[K], C>;
}


