import {DecoInstance, DecoInstanceLike, Fqn} from "@leyyo/core";
import {CallParams, CallValueLambdaAsync, CallValueLambdaSync, CallValuePro} from "../param";
import {$descriptor, $dev, Mutable} from "@leyyo/common";
import {
    CallConstraint,
    CallConstraintConfig,
    CallConstraintConfigItem,
    CallCurrent,
    CallItem,
    CallItemKeys,
    CallItemProcessorLike,
    CallItemProcessorSecure
} from "./index-types";
import {CallOptPro} from "../option";
import {errorEnveloper} from "@leyyo/error-enveloper";
import {FQN} from "../internal";
import {Ctx} from "@leyyo/http";

@Fqn(FQN)
class CallItemProcessor implements CallItemProcessorLike, CallItemProcessorSecure {
    readonly sym = $descriptor.sym(FQN, 'storage');
    constructor() {
    }

    buildItem<P extends CallParams = CallParams, O extends CallOptPro<P> = CallOptPro<P>>(ins: DecoInstanceLike, opt: O, params: P): CallItem<P, O> {
        if (!(ins instanceof DecoInstance)) {
            throw $dev.invalidError({issue: 'invalid.instance', where: 'leyyo.call.CallItemProcessor', method: 'buildItem'});
        }
        const {allKeys, clonedKeys, syncKeys, asyncKeys} = this.$getLambdaStat(params);
        const constraint = {
            allKeys, clonedKeys, syncKeys, asyncKeys, params,
            clonedConfig: {},
        } as CallConstraint<P>;
        this.$buildClonedConfig(params, constraint);

        return {ins, deco: ins.identifier, opt, constraint} as CallItem<P, O>;
    }

    async buildCurrent<P extends CallParams = CallParams, O extends CallOptPro<P> = CallOptPro<P>>(ctx: Ctx, field: string, item: CallItem<P, O>): Promise<CallCurrent<P>> {
        const constraint = item.constraint;
        if (!constraint.hasLambda) {
            return {ctx, field, config: {...constraint.clonedConfig} as CallConstraintConfig<P>} as CallCurrent<P>;
        }

        let canBeCached = false;
        let code: string;
        if (ctx) {
            code = item.ins.code;
            if (!ctx.locals[this.sym]) {
                ctx.locals[this.sym] = {};
            }
            if (ctx.locals[this.sym][code]) {
                return {
                    ctx,
                    field,
                    config: {...ctx.locals[this.sym][code]} as CallConstraintConfig<P>
                } as CallCurrent<P>;
            }
            canBeCached = true;
        }

        const current = {ctx, field, config: {} as CallConstraintConfig<P>} as CallCurrent<P>;
        if (constraint.syncKeys.length) {
            constraint.syncKeys.forEach(key => {
                const valuePro = constraint.params[key] as CallValuePro<P[keyof P], P>;
                (current.config as Mutable<CallConstraintConfig<P>>)[key as keyof P] = errorEnveloper.swallow(() => ((valuePro.value as CallValueLambdaSync<P[keyof P], P>)(current))) as CallConstraintConfigItem<P[keyof P], P>;
            })
        }
        if (constraint.asyncKeys.length) {
            for (const key of constraint.asyncKeys) {
                const valuePro = constraint.params[key] as CallValuePro<P[keyof P], P>;
                (current.config as Mutable<CallConstraintConfig<P>>)[key as keyof P] = await errorEnveloper.swallowAsync(async () => ((valuePro.value as CallValueLambdaAsync<P[keyof P], P>)(current))) as CallConstraintConfigItem<P[keyof P], P>;
            }
        }
        if (canBeCached) {
            ctx.locals[this.sym][code] = current.config;
        }
        return current;
    }

    $getLambdaStat<P extends CallParams = CallParams>(params: P): CallItemKeys<P> {
        const allKeys = [] as Array<keyof P>;
        const clonedKeys = [] as Array<keyof P>;
        const syncKeys = [] as Array<keyof P>;
        const asyncKeys = [] as Array<keyof P>;
        for (const [key, value] of Object.entries(params)) {
            const valuePro = value as CallValuePro<P[keyof P], P>;
            allKeys.push(key as keyof P);
            switch (valuePro?.type) {
                case "async":
                    asyncKeys.push(key as keyof P);
                    break;
                case "sync":
                    syncKeys.push(key as keyof P);
                    break;
                default:
                    clonedKeys.push(key as keyof P);
                    break;
            }
        }
        return {hasLambda: syncKeys.length > 0 || asyncKeys.length > 0, allKeys, clonedKeys, syncKeys, asyncKeys};
    }

    $buildClonedConfig<P extends CallParams = CallParams>(params: P, constraint: CallConstraint<P>): void {
        if (constraint.clonedKeys.length < 1) {
            return;
        }
        const clonedConfig = {} as Mutable<CallConstraintConfig<Partial<P>>>;
        for (const [key, value] of Object.entries(params)) {
            if (!constraint.clonedKeys.includes(key as keyof P)) {
                continue;
            }
            const valuePro = value as CallValuePro<P[keyof P], P>;
            clonedConfig[key as keyof P] = valuePro?.value as CallConstraintConfigItem<P[keyof P], P>;
        }
        constraint.clonedConfig = clonedConfig as Readonly<CallConstraintConfig<Partial<P>>>;
    }

    get $back(): CallItemProcessorLike {
        return this;
    }

    get $secure(): CallItemProcessorSecure {
        return this;
    }
}
export const callItem: CallItemProcessorLike = new CallItemProcessor();
