import {DecoInstanceLike} from "@leyyo/core";
import {ClassLike, Func, OneOrMore, ShiftMain, ShiftSecure} from "@leyyo/common";
import {CallParamType} from "../literals";
import {CallCurrent, ToValueAny} from "../item";

export interface CallParamProcessorLike extends ShiftSecure<CallParamProcessorSecure> {
    get<P extends CallParams = CallParams>(ins: DecoInstanceLike, value: any, fields: CallParamsReadSetting<P>, next?: boolean): P;
    getPossibleNames<P extends CallParams = CallParams>(classes: Array<string | Func | ClassLike>): CallPossibleNames<P>;
    buildValue<T = any, P extends CallParams = CallParams>(value: T): CallValuePro<T, P>;
}

export interface CallParamProcessorSecure extends ShiftMain<CallParamProcessorLike> {
    $types(ins: DecoInstanceLike, type: OneOrMore<CallParamType>): CallGetTypesResult;
    $validate<P extends CallParams = CallParams>(ins: DecoInstanceLike, params: P): void;
    $setOne<P extends CallParams = CallParams>(params: P, field: keyof P, value: any, canByArray: boolean, type?: CallLambdaType): void;
    $setError(issue: string, ins: DecoInstanceLike, field: any, value: any, expected: Array<CallParamType>): void;
    $setFunc<P extends CallParams = CallParams>(ins: DecoInstanceLike, params: P, field: keyof P, value: any, setting: CallParamsReadField<P[keyof P]>, types: Array<CallParamType>, canBeArray: boolean, canBeCallback: boolean): void;
    $setString<P extends CallParams = CallParams>(ins: DecoInstanceLike, params: P, field: keyof P, value: any, setting: CallParamsReadField<P[keyof P]>, types: Array<CallParamType>, canBeArray: boolean): void;
    $setPrimitive<P extends CallParams = CallParams>(ins: DecoInstanceLike, params: P, field: keyof P, value: any, setting: CallParamsReadField<P[keyof P]>, types: Array<CallParamType>, canBeArray: boolean): void;
    $setArray<P extends CallParams = CallParams>(ins: DecoInstanceLike, params: P, field: keyof P, value: any, setting: CallParamsReadField<P[keyof P]>, types: Array<CallParamType>, canBeArray: boolean): void;
    $setWrap<P extends CallParams = CallParams>(ins: DecoInstanceLike, params: P, field: keyof P, value: any, setting: CallParamsReadField<P[keyof P]>, types: Array<CallParamType>, canBeArray: boolean): void;
    $setCasted<P extends CallParams = CallParams>(ins: DecoInstanceLike, params: P, field: keyof P, value: any, setting: CallParamsReadField<P[keyof P]>, types: Array<CallParamType>, canBeArray: boolean): void;
    $setObject<P extends CallParams = CallParams>(ins: DecoInstanceLike, params: P, field: keyof P, value: any, setting: CallParamsReadField<P[keyof P]>, types: Array<CallParamType>, canBeArray: boolean): void;
    $sign<P extends CallParams = CallParams>(params: P): void;


}

export type CallParams = { [K in string]?: CallValuePro<CallParams[K]> };

export interface CallGetTypesResult {
    types: Array<CallParamType>;
    canBeArray: boolean;
}

export type CallLambdaType = 'sync' | 'async';
export type CallValue<T, P extends CallParams = CallParams> = T | CallValueLambda<T, P>;
export type CallValueLambda<T, P extends CallParams = CallParams> =
    CallValueLambdaSync<T, P>
    | CallValueLambdaAsync<T, P>;
export type CallValueLambdaSync<T, P extends CallParams = CallParams> = (current: CallCurrent<P>) => T;
export type CallValueLambdaAsync<T, P extends CallParams = CallParams> = (current: CallCurrent<P>) => Promise<T>;

// item'da tutulan
export interface CallValuePro<T, P extends CallParams = CallParams> {
    type?: CallLambdaType;
    value: CallValue<T, P>;
}

export interface CallPossibleNames<P extends CallParams = CallParams> {
    functions: CallValuePro<Array<Func | ClassLike>, P>;
    names: CallValuePro<Array<string>, P>;
    possibleNames: CallValuePro<string, P>;
}

export type CallParamsReadSetting<P extends CallParams = CallParams> = {
    [K in keyof P]: CallParamsReadField<P[K]>;
}
export interface CallParamsReadField<T> {
    primary?: boolean,
    type?: OneOrMore<CallParamType>,
    named?: boolean;
    flat?: boolean;
    cast?: CallParamCastLambda<T>;
}

export type CallParamCastLambda<T> = (v: ToValueAny<T>) => ToValueAny<T>;

