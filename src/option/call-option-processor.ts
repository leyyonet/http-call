import {$assert, $descriptor, $dev, $is, $repo, OneOrMore} from "@leyyo/common";
import {DecoInstanceLike, footprint, Fqn} from "@leyyo/core";
import {
    CallOpt,
    CallOptionProcessorLike,
    CallOptionProcessorSecure,
    CallOptPro,
    CallScope,
    CallScopePro,
    OptKeyCondition,
    OptKeyConditionPro,
    OptKeyType
} from "./index-types";
import {callWhen, CallWhen, CallWhenPro} from "../when";
import {FQN_PCK} from "../internal";
import {CallParams} from "../param";
import {httpSigner} from "@leyyo/http";

Fqn(FQN_PCK)
class CallOptionProcessor implements CallOptionProcessorLike, CallOptionProcessorSecure {
    readonly $SCOPE_SELF: CallScopePro = 1;
    readonly $SCOPE_ARR_VAL: CallScopePro = 2;
    readonly $SCOPE_REC_KEY: CallScopePro = 3;
    readonly $SCOPE_REC_VAL: CallScopePro = 4;
    private conditionIndex = 0;
    private readonly conditionMap: Map<string, OptKeyConditionPro>;

    constructor() {
        this.conditionMap = $repo.newMap($descriptor.sym(FQN_PCK, 'conditions'));
    }

    read<
        O extends CallOpt = CallOpt,
        O2 extends CallOptPro = CallOptPro>(
        ins: DecoInstanceLike,
        given: any,
        keys: Array<keyof O>,
        condition: OptKeyCondition<O>
    ): O2 {

        this.$checkKeys(ins, keys);
        const conditionPro = this.$checkCondition(ins, condition);
        const opt = this.$read(ins, given, keys, conditionPro);
        return this.$setPro(ins, opt);
    }

    // region secure
    get $back(): CallOptionProcessorLike {
        return this;
    }

    get $secure(): CallOptionProcessorSecure {
        return this;
    }

    $validate<P extends CallParams = CallParams>(ins: DecoInstanceLike, opt: CallOptPro<P>): void {
        if ($is.bareObject(opt)) {
            if (!httpSigner.is(opt, 'call.option.list')) {
                throw $dev.invalidError({
                    issue: 'invalid.sign',
                    field: 'options',
                    desc: ins.description,
                    where: 'leyyo.call.CallOptionProcessor',
                    method: '$validate'
                });
            }
            for (const [k, v] of Object.entries(opt)) {
                if (!httpSigner.is(v, 'call.option')) {
                    throw $dev.invalidError({
                        issue: 'invalid.sign',
                        field: `options.${k}`,
                        desc: ins.description,
                        where: 'leyyo.call.CallOptionProcessor',
                        method: '$validate'
                    });
                }
            }
        } else {
            throw $dev.invalidError({
                issue: 'invalid.option',
                type: typeof opt,
                desc: ins.description,
                where: 'leyyo.call.CallOptionProcessor',
                method: '$validate'
            });
        }
    }

    $checkCondition<O extends CallOpt = CallOpt>(ins: DecoInstanceLike, condition: OptKeyCondition<O>): OptKeyConditionPro<O> {
        const pro = {} as OptKeyConditionPro<O>;
        let conditionKey = httpSigner.tagExt<string>(condition, 'condition');
        if (this.conditionMap.has(conditionKey)) {
            return this.conditionMap.get(conditionKey);
        }
        if (!$is.object(condition)) {
            throw $dev.invalidError({
                issue: 'invalid.condition',
                type: typeof condition,
                desc: ins.description, where: 'leyyo.call.CallOptionProcessor', method: '$checkCondition'
            });
        }
        for (const [k, v] of Object.entries(condition)) {
            switch (k as OptKeyType) {
                case 'array':
                    if (typeof v === 'string') {
                        pro[k] = [v];
                    } else if (Array.isArray(v) && v.length > 1 && v.every(v2 => typeof v2 === 'string')) {
                        pro[k] = v;
                    } else {
                        throw $dev.invalidError({
                            issue: 'invalid.condition.key',
                            type: typeof v,
                            key: k,
                            desc: ins.description, where: 'leyyo.call.CallOptionProcessor', method: '$checkCondition'
                        });
                    }
                    break;
                case "boolean":
                case "string":
                case "bigint":
                case "symbol":
                case "number":
                    if (typeof v === 'string') {
                        pro[k] = [v];
                    } else {
                        throw $dev.invalidError({
                            issue: 'invalid.condition.key',
                            type: typeof v,
                            key: k,
                            desc: ins.description, where: 'leyyo.call.CallOptionProcessor', method: '$checkCondition'
                        });
                    }
                    break;
                default:
                    throw $dev.invalidError({
                        issue: 'unexpected.condition.key',
                        key: k,
                        desc: ins.description, where: 'leyyo.call.CallOptionProcessor', method: '$checkCondition'
                    });
            }
        }
        conditionKey = 'c' + this.conditionIndex;
        this.conditionMap.set(conditionKey, pro as OptKeyConditionPro);
        httpSigner.appendExt<string>(condition, 'condition', conditionKey);
        return pro;
    }

    $setOpt<O extends CallOpt = CallOpt>(ins: DecoInstanceLike, opt: O, keys: Array<keyof O>, key: PropertyKey, value: any): void {
        if (!keys.includes(key as keyof O)) {
            throw $dev.invalidError({
                issue: 'unexpected.key',
                key,
                desc: ins.description, where: 'leyyo.call.CallOptionProcessor', method: '$setOpt'
            });
        }
        if (value !== undefined) {
            opt[key as keyof O] = value as O[keyof O];
        }
    }

    $convertScope(ins: DecoInstanceLike, scope: CallScope): CallScopePro {
        switch (scope) {
            case "self":
            case "s":
                return this.$SCOPE_SELF;
            case "in-array":
            case "a":
                return this.$SCOPE_ARR_VAL;
            case "record-key":
            case "k":
                return this.$SCOPE_REC_KEY;
            case "record-value":
            case "v":
                return this.$SCOPE_REC_VAL;
            default:
                throw $dev.invalidError({
                    issue: 'invalid',
                    field: 'scope',
                    scope,
                    desc: ins.description, where: 'leyyo.call.CallOptionProcessor', method: '$convertScope'
                });
        }
    }

    $setWhen<P extends CallParams = CallParams>(ins: DecoInstanceLike, value: string | CallWhen<P>): CallWhenPro<P> {
        let when: CallWhen<P>;
        const whenPro: CallWhenPro<P> = {};
        if (typeof value === 'string') {
            when = callWhen.get(value);
            if (!when) {
                throw $dev.invalidError({
                    issue: 'not.found',
                    field: 'when',
                    desc: ins.description, where: 'leyyo.call.CallOptionProcessor', method: '$setWhen'
                });
            }
            whenPro.name = value;
        } else {
            $assert.func(value, () => $dev.opt({
                field: 'when',
                desc: ins.description, where: 'leyyo.call.CallOptionProcessor', method: '$setWhen'
            }));
            when = value;
        }
        whenPro.fn = when;
        const inspect = footprint.inspect(when);
        if (inspect.keywords.includes('async')) {
            whenPro.isAsync = true;
        }
        httpSigner.append(whenPro, 'call.option');
        return whenPro;
    }

    $setScopes(ins: DecoInstanceLike, scope: OneOrMore<CallScope>): Array<CallScopePro> {
        const strScopes: Array<CallScope> = [];
        if ($is.empty(scope)) {
            strScopes.push('s');
        } else if (typeof scope === 'string') {
            strScopes.push(scope);
        } else if (Array.isArray(scope)) {
            const wrongScopes = scope.filter(s => typeof s !== 'string');
            if (wrongScopes.length > 0) {
                throw $dev.invalidError({
                    issue: 'invalid',
                    field: 'scope',
                    wrongScopes,
                    desc: ins.description, where: 'leyyo.call.CallOptionProcessor', method: '$setScopes'
                });
            }
            strScopes.push(...scope.filter(s => typeof s === 'string'));
        } else {
            throw $dev.invalidError({
                issue: 'invalid',
                field: 'scope',
                type: typeof scope,
                scope,
                desc: ins.description, where: 'leyyo.call.CallOptionProcessor', method: '$setScopes'
            });
        }
        const scopes = [] as Array<CallScopePro>;
        strScopes.forEach(s => {
            const converted = this.$convertScope(ins, s);
            if (converted && !scopes.includes(converted)) {
                scopes.push(converted);
            }
        });
        if (scopes.length < 1) {
            scopes.push(this.$SCOPE_SELF);
        }
        httpSigner.append(scopes, 'call.option');
        return scopes;
    }

    $checkKeys<O extends CallOpt = CallOpt>(ins: DecoInstanceLike, keys: Array<keyof O>): void {
        if (httpSigner.isExt(keys, 'keys')) {
            return;
        }
        if (!Array.isArray(keys) || keys.length < 1 || !keys.every(key => typeof key === 'string')) {
            throw $dev.invalidError({
                issue: 'invalid.keys',
                type: typeof keys,
                desc: ins.description, where: 'leyyo.call.CallOptionProcessor', method: '$checkKeys'
            });
        }
        httpSigner.appendExt(keys, 'keys');
    }

    $read<O extends CallOpt = CallOpt>(ins: DecoInstanceLike, given: any, keys: Array<keyof O>, conditionPro: OptKeyConditionPro<O>): O {
        if ($is.empty(given)) {
            given = {};
        }
        const opt = {} as O;
        const type = typeof given;
        switch (type) {
            case "object":
                if (Array.isArray(given)) {
                    if (conditionPro['array'] !== undefined) {
                        const arrKeys = conditionPro['array'];
                        if (arrKeys.length === 1) {
                            this.$setOpt(ins, opt, keys, arrKeys[0], given);
                        } else {
                            arrKeys.forEach(arrKey => {
                                this.$setOpt(ins, opt, keys, arrKey, given);
                            });
                        }
                    } else {
                        throw $dev.invalidError({
                            issue: 'unexpected.array',
                            desc: ins.description, where: 'leyyo.call.CallOptionProcessor', method: '$read'
                        });
                    }
                } else if ($is.bareObject(given)) {
                    for (const [k, v] of Object.entries(given)) {
                        this.$setOpt(ins, opt, keys, k, v);
                    }
                }
                break;
            case "number":
            case "symbol":
            case "bigint":
            case "string":
            case "boolean":
            case "function":
                if (conditionPro[type] !== undefined) {
                    this.$setOpt(ins, opt, keys, conditionPro[type][0], given);
                } else {
                    throw $dev.invalidError({
                        issue: 'absent.condition.type',
                        type,
                        desc: ins.description, where: 'leyyo.call.CallOptionProcessor', method: '$read'
                    });
                }
                break;
        }
        return opt;
    }

    $setPro<O extends CallOpt = CallOpt, O2 extends CallOptPro = CallOptPro>(ins: DecoInstanceLike, opt: O): O2 {
        const opt2 = {} as O2;
        for (const [k, v] of Object.entries(opt)) {
            switch (k as keyof O) {
                case 'when':
                    opt2.when = this.$setWhen(ins, v);
                    break;
                case 'scope':
                    opt2.scopes = this.$setScopes(ins, v);
                    break;
                default:
                    // extended option property
                    opt2[k as keyof O2] = v;
            }
        }


        if (!opt2.when) {
            opt2.when = {fn: () => true};
            httpSigner.append(opt2.when, 'call.option');
        }
        if (!opt2.scopes) {
            opt2.scopes = [this.$SCOPE_SELF];
            httpSigner.append(opt2.scopes, 'call.option');
        }
        httpSigner.append(opt2, 'call.option.list');
        return opt2;
    }

    // endregion secure

}
export const callOption: CallOptionProcessorLike = new CallOptionProcessor();
