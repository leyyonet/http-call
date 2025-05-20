import {Fqn} from "@leyyo/core";
import {Loader} from "@leyyo/injection";
import {FQN_PCK} from "./internal";
import {CallParamTypeItems} from "./literals";

@Loader(CallParamTypeItems)
@Fqn(FQN_PCK)
export class CallLiterals {
}
