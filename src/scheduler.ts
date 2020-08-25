import { makeSet } from "./utils";

const jobs: (() => void)[] = [];
const promise = Promise.resolve();
let pending = false;

// const RECURSION_LIMIT = 100;

export function nextTick(fn?: () => void) {
  return fn ? promise.then(fn) : promise;
}

export function queueJob(job: () => void) {
  jobs.push(job);
  queueFlush();
}

function queueFlush() {
  if (!pending) {
    pending = true;
    nextTick(flushJobs);
  }
}

function flushJobs() {
  const jobsToRun = makeSet(jobs);
  jobs.length = 0;
  jobsToRun.forEach(job => job());
  if (jobs.length > 0) {
    flushJobs();
  }
  pending = false;
}
