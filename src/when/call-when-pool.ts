import {$assert, $dev, $repo} from "@leyyo/common";
import {Fqn} from "@leyyo/core";
import {CallWhen, CallWhenPoolLike} from "./index-types";
import {FQN} from "../internal";

@Fqn(FQN)
class CallWhenPool implements CallWhenPoolLike {
    private readonly _map: Map<string, CallWhen>;

    constructor() {
        this._map = $repo.newMap(FQN, `whenPool`);
    }

    add(name: string, fn: CallWhen): void {
        $assert.text(name, () => $dev.opt({
            field: 'name',
            where: 'leyyo.call.CallWhenPool',
            method: 'add'
        }));
        $assert.func(fn, () => $dev.opt({
            field: 'fn',
            where: 'leyyo.call.CallWhenPool',
            method: 'add',
            name
        }));
        if (this._map.has(name)) {
            throw $dev.developerError({
                issue: 'duplicated',
                field: name,
                where: 'leyyo.call.CallWhenPool', method: 'add',
                name
            })
        }
        this._map.set(name, fn);
    }

    has(name: string): boolean {
        return this._map.has(name);
    }

    get(name: string): CallWhen {
        return this._map.get(name);
    }

    get records(): Record<string, CallWhen> {
        return Object.fromEntries(this._map.entries());
    }

    remove(name: string): boolean {
        if (this._map.has(name)) {
            this._map.delete(name);
            return true;
        }
        return false;
    }

}
export const callWhen: CallWhenPoolLike = new CallWhenPool();
