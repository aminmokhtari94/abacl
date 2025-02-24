/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CacheKey, ControlOptions, Pattern, Policy, PropType, PropValue } from '../../types';
import { DefaultMemoryDriverOptions, MemoryDriverOptions } from './memory.driver';
import { ALL, ANY, NULL, SEP, STRICT } from '../../consts';

export const memoryIgnore = (sep: string) => `[^${sep}][^${sep}]*`;

export function parse<T = string, M = string, S = string>(
  prop: T,
  options: MemoryDriverOptions = DefaultMemoryDriverOptions,
): PropValue<M, S> {
  options.sep = options.sep || SEP;
  const { sep, prefix } = options;

  if (prefix) prop = String(prop).replace(prefix + sep, '') as T;
  const [main, scope] = String(prop).split(sep) as [M, S];
  return { main, scope };
}

export function key<Sub = string, Act = string, Obj = string>(
  polity: Policy<Sub, Act, Obj>,
  options: MemoryDriverOptions = DefaultMemoryDriverOptions,
): string {
  options.sep = options.sep || SEP;
  const { sep, prefix } = options;

  const subject = parse(polity.subject, options);
  const action = parse(polity.action, options);
  const object = parse(polity.object, options);

  const subject_key = `${subject.main}${sep}${subject.scope ?? NULL}`;
  const action_key = `${action.main}${sep}${action.scope ?? ANY}`;
  const object_key = `${object.main}${sep}${object.scope ?? ALL}`;

  if (!prefix) return [subject_key, action_key, object_key].join(sep);
  else return [prefix, subject_key, action_key, object_key].join(sep);
}

export function pattern<T = string, M = string, S = string>(
  cKey: CacheKey<T, M, S>,
  options: MemoryDriverOptions = DefaultMemoryDriverOptions,
): Pattern {
  options.sep = options.sep || SEP;
  const { sep, prefix } = options;

  const ignore = memoryIgnore(sep);

  const scope = <T = string>(prop: T, options?: ControlOptions) => (options?.strict ?? STRICT ? prop : ignore);

  const _pattern = (prop?: PropType): string => {
    if (prop && prop in cKey) {
      const parsed = typeof cKey[prop]!.val === 'string' ? parse(cKey[prop]!.val) : (cKey[prop]!.val as PropValue<M, S>);

      if (parsed.scope === 'any') parsed.scope = ignore;
      if (parsed.scope === 'all') parsed.scope = ignore;

      const _scope =
        (parsed as any).scope ?? ((prop === 'subject' && NULL) || (prop === 'action' && ANY) || (prop === 'object' && ALL));

      return `${(parsed as any).main}${sep}${scope(_scope, { strict: cKey[prop]!.strict })}`;
    } else return [ignore, ignore].join(sep);
  };

  if (!prefix) return RegExp(`^${[_pattern('subject'), _pattern('action'), _pattern('object')].join(sep)}$`);
  else return RegExp(`^${[prefix, _pattern('subject'), _pattern('action'), _pattern('object')].join(sep)}$`);
}
