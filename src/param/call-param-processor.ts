import {DecoInstanceLike, footprint, Fqn, fqnHandler} from "@leyyo/core";
import {$descriptor, $dev, $is, ClassLike, Func, OneOrMore, Wrap, WrapLike} from "@leyyo/common";
import {arrayUtils} from "@leyyo/scalar";
import {FQN_PCK} from "../internal";
import {CallParamType, CallParamTypeItems} from "../literals";
import {
    CallGetTypesResult,
    CallLambdaType,
    CallParamProcessorLike,
    CallParamProcessorSecure,
    CallParams, CallParamsReadField, CallParamsReadSetting,
    CallPossibleNames, CallValuePro
} from "./index-types";
import {httpSigner} from "@leyyo/http";

@Fqn(FQN_PCK)
class CallParamProcessor implements CallParamProcessorLike, CallParamProcessorSecure {

    constructor() {
    }

    get<P extends CallParams = CallParams>(ins: DecoInstanceLike, value: any, fields: CallParamsReadSetting<P>, next?: boolean): P {
        if ($is.empty(fields)) {
            return {} as P;
        }
        if (!$is.bareObject(fields)) {
            this.$setError('invalid.fields', ins, undefined, fields, undefined);
        }
        if ($is.empty(value)) {
            value = {};
        }
        const params = {} as P;
        for (const [f, s] of Object.entries(fields)) {
            const field = f as keyof P;
            const setting = s as CallParamsReadField<P[keyof P]>;
            const {types, canBeArray} = this.$types(ins, setting.type);

            if (setting.primary || next) {
                switch (typeof value) {
                    case "function":
                        this.$setFunc<P>(ins, params, field, value, setting, types, canBeArray, true);
                        value = undefined;
                        break
                    case 'string':
                        this.$setString<P>(ins, params, field, value, setting, types, canBeArray);
                        value = undefined;
                        break;
                    case "number":
                    case "boolean":
                    case "bigint":
                        this.$setPrimitive<P>(ins, params, field, value, setting, types, canBeArray);
                        value = undefined;
                        break;
                    case "object":
                        if (Array.isArray(value) || value instanceof Set) {
                            this.$setArray<P>(ins, params, field, value, setting, types, canBeArray);
                        }
                        else if (types.includes('casted')) {
                            this.$setCasted<P>(ins, params, field, value, setting, types, canBeArray);
                        }
                        else if (value instanceof Wrap) {
                            this.$setWrap<P>(ins, params, field, value, setting, types, canBeArray);
                        }
                        else {
                            if (!next) {
                                this.$setObject<P>(ins, params, field, value, setting, types, canBeArray);
                            }
                            else {
                                this.$setError('invalid', ins, field, value, types);
                            }
                        }
                        value = undefined;
                        break;
                    default:
                        this.$setError('invalid', ins, field, value, types);
                }
            }
            else if (typeof value === 'object') {
                if (Array.isArray(value) || value instanceof Set) {
                    this.$setArray<P>(ins, params, field, value, setting, types, canBeArray);
                }
                else if (types.includes('casted')) {
                    this.$setCasted(ins, params, field, value, setting, types, canBeArray);
                }
                else if (value instanceof Wrap) {
                    this.$setWrap<P>(ins, params, field, value, setting, types, canBeArray);
                }
                else {
                    if (!next) {
                        this.$setObject<P>(ins, params, field, value, setting, types, canBeArray);
                    }
                    else {
                        this.$setError('invalid', ins, field, value, types);
                    }
                }
                value = undefined;
            }
            else {
                this.$setError('invalid', ins, field, value, types);
            }
        }
        if (!$is.empty(value)) {
            this.$setError('unexpected.fields', ins, undefined, value, undefined);
        }
        this.$sign(params);
        return params;
    }

    getPossibleNames<P extends CallParams = CallParams>(classes: Array<string | Func | ClassLike>): CallPossibleNames<P> {
        const fncList = arrayUtils.unique(classes.filter(item => typeof item === 'function'));
        const nameList = arrayUtils.unique(classes.filter(item => typeof item === 'string'));
        const allList = [
            ...nameList,
            ...fncList
                .map(clz => clz.name),
            ...fncList
                .filter(clz => fqnHandler.exists(clz))
                .map(clz => fqnHandler.get(clz))
        ];

        // sign Values
        const possibleNames = {value: arrayUtils.unique(allList).join(', ')};
        httpSigner.append(possibleNames, 'call.param');
        const functions = {value: fncList};
        httpSigner.append(functions, 'call.param');
        const names = {value: nameList};
        httpSigner.append(names, 'call.param');

        return {possibleNames, functions, names};
    }
    buildValue<T = any, P extends CallParams = CallParams>(value: T): CallValuePro<T, P> {
        const rec = {value};
        httpSigner.append(rec, 'call.param');
        return rec;
    }

    // region secure
    $validate<P extends CallParams = CallParams>(ins: DecoInstanceLike, params: P): void {
        if ($is.bareObject(params)) {
            if (!httpSigner.is(params, 'call.param.list')) {
                throw $dev.invalidError({
                    issue: 'invalid.sign',
                    field: 'option',
                    desc: ins.description,
                    where: 'leyyo.call.CallParamProcessor',
                    method: '$validate'
                });
            }
            for (const [k, v] of Object.entries(params)) {
                if (!httpSigner.is(v, 'call.param')) {
                    throw $dev.invalidError({
                        issue: 'invalid.sign',
                        field: `option.${k}`,
                        desc: ins.description,
                        where: 'leyyo.call.CallParamProcessor',
                        method: '$validate'
                    });
                }
            }
        } else {
            throw $dev.invalidError({
                issue: 'invalid.option',
                type: typeof params,
                desc: ins.description,
                where: 'leyyo.call.CallParamProcessor',
                method: '$validate'
            });
        }
    }
    $types(ins: DecoInstanceLike, type: OneOrMore<CallParamType>): CallGetTypesResult {
        const types = [] as Array<CallParamType>;
        if (typeof type === 'string') {
            types.push(type);
        } else if (Array.isArray(type)) {
            const wrongTypes = type.filter(t => typeof t !== 'string');
            if (wrongTypes.length > 0) {
                throw $dev.invalidError({
                    issue: 'invalid',
                    kind: 'type', desc: ins.description, where: 'leyyo.call.CallParamProcessor', method: '$types'
                });
            }
            types.push(...type);
        } else {
            throw $dev.invalidError({
                issue: 'invalid',
                kind: 'type',
                type,
                desc: ins.description,
                where: 'leyyo.call.CallParamProcessor',
                method: '$types'
            });
        }
        if (types.length < 1) {
            types.push('any');
        }

        const wrongTypes = types.filter(t => !CallParamTypeItems.includes(t));
        if (wrongTypes.length > 0) {
            throw $dev.invalidError({
                issue: 'invalid',
                kind: 'type',
                wrongTypes, desc: ins.description, where: 'leyyo.call.CallParamProcessor', method: '$types'
            });
        }
        return {types, canBeArray: types.includes('array')};
    }
    $setOne<P extends CallParams = CallParams>(params: P, field: keyof P, value: any, canByArray: boolean, type?: CallLambdaType): void {
        if (canByArray) {
            value = $is.empty(value) ? [] : [value];
        }
        params[field] = {type, value} as P[keyof P];
    }
    $setError(issue: string, ins: DecoInstanceLike, field: any, value: any, expected: Array<CallParamType>): void {
        throw $dev.invalidError({
            issue,
            expected,
            field: field as string,
            type: typeof value,
            desc: ins.description,
            where: 'leyyo.call.CallParamProcessor',
            method: 'get'
        });
    }
    $setFunc<P extends CallParams = CallParams>(ins: DecoInstanceLike, params: P, field: keyof P, value: any, setting: CallParamsReadField<P[keyof P]>, types: Array<CallParamType>, canBeArray: boolean, canBeCallback: boolean): void {
        const inspect = footprint.inspect(value, true);
        if (setting.flat) {
            if (types.includes('class') || types.includes('function') || types.includes('any') || types.includes('array')) {
                // class is not wanted
                if (inspect.type === 'class' && !types.includes('class')) {
                    this.$setError('unexpected.class', ins, field, value, types);
                }
                // function is not wanted
                else if (inspect.type === 'function' && !types.includes('function')) {
                    this.$setError('unexpected.function', ins, field, value, types);
                }
                // class or function are wanted
                else {
                    if (typeof setting.cast === 'function') {
                        value = setting.cast(value);
                    }
                    this.$setOne(params, field, value, canBeArray);
                }
            }
            // callback is not wanted
            else {
                this.$setError('expected.flat', ins, field, value, types);
            }
        }
        // no flat
        else {
            // it's signed parameter
            if ($descriptor.isSigned(value)) {
                if (typeof setting.cast === 'function') {
                    value = setting.cast(value);
                }
                this.$setOne(params, field, value, canBeArray);
            }
            // it's a callback, and it can be
            else if (canBeCallback) {
                this.$setOne(params, field, value, canBeArray, inspect.keywords.includes('async') ? 'async' : 'sync');
            }
            // it's a callback, but it can not be
            else {
                this.$setError('unexpected.callback', ins, field, value, types);
            }
        }
    }
    $setString<P extends CallParams = CallParams>(ins: DecoInstanceLike, params: P, field: keyof P, value: any, setting: CallParamsReadField<P[keyof P]>, types: Array<CallParamType>, canBeArray: boolean): void {
        // we need convert string to cast object
        if (types.includes('casted')) {
            this.$setCasted(ins, params, field, value, setting, types, canBeArray);
        }
        // string or string[] are wanted
        else if (types.includes('string') || types.includes('any') || types.includes('array')) {
            if (typeof setting.cast === 'function') {
                value = setting.cast(value);
            }
            this.$setOne(params, field, value, canBeArray);
        }
        // named function or class is wanted
        else if ((types.includes('class') || types.includes('function')) && setting.named) {
            if (typeof setting.cast === 'function') {
                value = setting.cast(value);
            }
            this.$setOne(params, field, value, canBeArray);
        }
        else {
            this.$setError('invalid', ins, field, value, types);
        }
    }
    $setPrimitive<P extends CallParams = CallParams>(ins: DecoInstanceLike, params: P, field: keyof P, value: any, setting: CallParamsReadField<P[keyof P]>, types: Array<CallParamType>, canBeArray: boolean): void {
        // we need convert primitive to cast object
        if (types.includes('casted')) {
            this.$setCasted(ins, params, field, value, setting, types, canBeArray);
        }
        // number, number[], boolean, boolean[], boolean or boolean[] are wanted
        else if (types.includes(typeof value as CallParamType) || types.includes('any') || types.includes('array')) {
            if (typeof setting.cast === 'function') {
                value = setting.cast(value);
            }
            this.$setOne(params, field, value, canBeArray);
        }
        else {
            this.$setError('invalid', ins, field, value, types);
        }
    }
    $setArray<P extends CallParams = CallParams>(ins: DecoInstanceLike, params: P, field: keyof P, value: any, setting: CallParamsReadField<P[keyof P]>, types: Array<CallParamType>, _canBeArray: boolean): void {
        // value can be an array
        if (types.includes('array')) {
            // converts set to an array
            if (value instanceof Set) {
                value = Array.from(value.values());
            }
            if (typeof setting.cast === 'function') {
                value = (value as Array<any>).map(a => setting.cast(a));
            }
            this.$setOne(params, field, value, false); // already an array
        }
        // value can not be an array
        else {
            this.$setError('invalid', ins, field, value, types);
        }
    }
    $setWrap<P extends CallParams = CallParams>(ins: DecoInstanceLike, params: P, field: keyof P, value: any, setting: CallParamsReadField<P[keyof P]>, types: Array<CallParamType>, canBeArray: boolean): void {
        if (typeof (value as WrapLike).value === 'function') {
            this.$setFunc<P>(ins, params, field, value, setting, types, canBeArray, false); // wrapped function can not be a callback
        }
        else {
            this.$setError('unexpected.wrap', ins, field, value, types);
        }
    }
    $setCasted<P extends CallParams = CallParams>(ins: DecoInstanceLike, params: P, field: keyof P, value: any, setting: CallParamsReadField<P[keyof P]>, _types: Array<CallParamType>, canBeArray: boolean): void {
        if (typeof setting.cast !== 'function') {
            this.$setError('casted.needs.cast.function', ins, field, value.cast, ['function']);
        }
        this.$setOne(params, field, setting.cast(value), canBeArray);
    }
    $setObject<P extends CallParams = CallParams>(ins: DecoInstanceLike, params: P, field: keyof P, value: any, setting: CallParamsReadField<P[keyof P]>, types: Array<CallParamType>, canBeArray: boolean): void {
        if (value instanceof Map) {
            value = Object.fromEntries(value.entries());
        }
        const rec = value as Record<keyof P, any>;
        // root can be value
        if (rec[field] === undefined) {
            if (types.includes('object')) {
                if (typeof setting.cast === 'function') {
                    value = setting.cast(value);
                }
                this.$setOne(params, field, value, canBeArray);
            }
            else {
                value = undefined;
                if (typeof setting.cast === 'function') {
                    value = setting.cast(value);
                }
                this.$setOne(params, field, value, canBeArray);
            }
        }
        // child can be value
        else {
            const subParam = this.get(ins, rec[field], {[field]: setting}, true);
            delete rec[field];
            for (const [k, v] of Object.entries(subParam)) {
                params[k as keyof P] = v as P[keyof P];
            }
        }
    }
    $sign<P extends CallParams = CallParams>(params: P): void {
        Object.keys(params).forEach(key => {
            httpSigner.append(params[key as keyof P], 'call.param');
        })
    }

    get $back(): CallParamProcessorLike {
        return this;
    }

    get $secure(): CallParamProcessorSecure {
        return this;
    }

    // endregion secure
}
export const callParam: CallParamProcessorLike = new CallParamProcessor();
