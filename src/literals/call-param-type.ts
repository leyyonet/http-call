/**
 * */
export const CallParamTypeItems = ['function', 'class', 'string', 'number', 'integer', 'bigint', 'array', 'object', 'boolean', 'casted', 'any'] as const;

export type CallParamType = typeof CallParamTypeItems[number];