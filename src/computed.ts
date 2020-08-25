import { observe } from "./observer";
import { addReaction, runReactions } from "./store";
import { isFunction } from "./utils";

interface Computed<T> {
  readonly value: T;
}

interface WritableComputed<T> {
  value: T;
}

type ComputedGetter<T> = (ctx?: any) => T;
type ComputedSetter<T> = (v: T) => void;

interface WritableComputedOptions<T> {
  get: ComputedGetter<T>;
  set: ComputedSetter<T>;
}

export function computed<T>(getter: ComputedGetter<T>): Computed<T>;
export function computed<T>(
  options: WritableComputedOptions<T>
): WritableComputed<T>;
export function computed<T>(
  getterOrOptions: WritableComputedOptions<T> | ComputedGetter<T>
) {
  let value: T;
  let computed: Computed<T>;
  let isDirty = true;
  let getter: ComputedGetter<T>;
  let setter: ComputedSetter<T>;

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = () => console.error(new Error("can not modify readonly computed"));
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  const runner = observe(getter, {
    lazy: true,
    scheduler: () => {
      if (!isDirty) {
        isDirty = true;
        runReactions(computed, "value");
      }
    },
  });

  computed = {
    get value() {
      if (isDirty) {
        value = runner();
        isDirty = false;
      }
      addReaction(computed, "value");
      return value;
    },
    set value(val) {
      setter(val);
    },
  };

  return computed;
}
