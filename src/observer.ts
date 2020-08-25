export interface Reaction {
  (): any;
  __isReaction: boolean;
  active: boolean;
  isRunning: boolean;
  options: ReactionOptions;
  deps: Set<Reaction>[];
}

interface ReactionOptions {
  lazy?: boolean;
  scheduler?: (fn: Reaction) => any;
}

export const runningReactions: Reaction[] = [];

export function observe(fn: Function, options: ReactionOptions = {}) {
  const reaction = isReaction(fn) ? fn : makeReaction(fn);

  reaction.__isReaction = true;
  reaction.active = true;
  reaction.options = options;

  if (!options.lazy) {
    reaction();
  }

  return reaction;
}

export function unobserve(reaction: Reaction) {
  if (reaction.active) {
    cleanUpDeps(reaction);
    reaction.active = false;
  }
}

function makeReaction(fn: Function) {
  const reaction = (() => {
    if (!reaction.active) {
      return fn();
    }
    // using isRunning instead of runningReactions.include
    // for a O(1) look up
    if (!reaction.isRunning) {
      try {
        cleanUpDeps(reaction);
        reaction.isRunning = true;
        runningReactions.push(reaction);
        return fn();
      } finally {
        runningReactions.pop();
        reaction.isRunning = false;
      }
    }
  }) as Reaction;

  return reaction;
}

function cleanUpDeps(reaction: Reaction) {
  const { deps } = reaction;
  deps && deps.forEach(dep => dep.delete(reaction));
  reaction.deps = [];
}

function isReaction(fn: any): fn is Reaction {
  return fn && fn.__isReaction;
}
