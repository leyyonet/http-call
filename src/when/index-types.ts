import {CallParams} from "../param";
import {CallCurrent} from "../item";

export interface CallWhenPoolLike {
    get records(): Record<string, CallWhen>;

    add(name: string, fn: CallWhen): void;

    has(name: string): boolean;

    get(name: string): CallWhen;

    remove(name: string): boolean;
}

export type CallWhen<P extends CallParams = CallParams> = CallWhenSync<P> | CallWhenAsync<P>;
export type CallWhenSync<P extends CallParams = CallParams> = (current: CallCurrent<P>) => boolean;
export type CallWhenAsync<P extends CallParams = CallParams> = (current: CallCurrent<P>) => Promise<boolean>;

export interface CallWhenPro<P extends CallParams = CallParams> {
    isAsync?: boolean;
    name?: string;
    fn?: CallWhen<P>;
}
