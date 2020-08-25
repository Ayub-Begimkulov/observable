export const isObject = (val: any): val is object => {
  return val !== null && typeof val === "object";
};

export const isFunction = (val: any): val is Function => {
  return typeof val === "function";
};

export const hasChanged = (value: any, oldValue: any): boolean => {
  return value !== oldValue && (value === value || oldValue === oldValue);
};

export const isArray = Array.isArray;

export const makeSet = <T>(from: T[] | Set<T>) => {
  const set = new Set<T>();
  from.forEach(set.add, set);
  return set;
};

export const error =
  process.env.NODE_ENV === "production" ? () => {} : console.error;
