import { Reaction, runningReactions } from "./observer";
import { makeSet } from "./utils";
import { AnyObject } from "./types";

type ReactionsMap = Map<string, Set<Reaction>>;

// The main WeakMap that stores {target -> key -> dep} connections.
const reactionsStore = new WeakMap<AnyObject, ReactionsMap>();

export function addReaction(obj: AnyObject, key: string) {
  const currentReaction = runningReactions[runningReactions.length - 1];
  if (!currentReaction) {
    return;
  }
  let reactionsForObj = reactionsStore.get(obj);
  if (!reactionsForObj) {
    reactionsForObj = new Map();
    reactionsStore.set(obj, reactionsForObj);
  }
  let reactionsForKey = reactionsForObj.get(key);
  if (!reactionsForKey) {
    reactionsForKey = new Set();
    reactionsForObj.set(key, reactionsForKey);
  }
  if (!reactionsForKey.has(currentReaction)) {
    reactionsForKey.add(currentReaction);
    currentReaction.deps.push(reactionsForKey);
  }
}

export function runReactions(obj: AnyObject, key: string) {
  const reactionsForObj = reactionsStore.get(obj);
  const reactionsForKey = reactionsForObj && reactionsForObj.get(key);
  if (!reactionsForKey) {
    return;
  }
  // make a copy of reactions to not end up in an infinite loop
  const reactionsToRun = makeSet(reactionsForKey);
  reactionsToRun.forEach(reaction => {
    if (reaction.options.scheduler) {
      reaction.options.scheduler(reaction);
    } else {
      reaction();
    }
  });
}
