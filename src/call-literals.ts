import {Fqn, Loader} from "@leyyo/core";
import {FQN_PCK} from "./internal";
import {CallParamTypeItems} from "./literals";

@Loader(CallParamTypeItems)
@Fqn(FQN_PCK)
export class CallLiterals {
}
