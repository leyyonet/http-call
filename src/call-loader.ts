import {Fqn, Loader} from "@leyyo/core";
import {FQN_PCK} from "./internal";
import {callItem} from "./item";
import {callOption} from "./option";
import {callParam} from "./param";
import {callWhen} from "./when";

@Loader(callItem, callOption, callParam, callWhen)
@Fqn(FQN_PCK)
export class CallLoader {
}
