import {Fqn} from "@leyyo/core";
import {Loader} from "@leyyo/injection";
import {FQN} from "./internal";
import {CallParamTypeItems} from "./literals";

@Loader(CallParamTypeItems)
@Fqn(FQN)
export class CallLiterals {
}
