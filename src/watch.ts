import { queueJob } from "./scheduler";
import { observe } from "./observer";

export function watchEffect(cb: Function) {
  observe(cb, {
    scheduler: queueJob,
  });
}
