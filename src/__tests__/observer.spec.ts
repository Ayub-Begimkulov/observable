import { observable, observe } from "..";
import { isArray } from "../utils";

describe("observable", () => {
  it("should run reaction when data changes", () => {
    let dummy;
    const obj = observable({ a: 0 });
    const spy = jest.fn(() => (dummy = obj.a));

    observe(spy);

    expect(spy).toBeCalledTimes(1);
    expect(dummy).toBe(0);

    for (let i = 0; i < 10; i++) {
      obj.a++;
    }

    expect(spy).toBeCalledTimes(11);
    expect(dummy).toBe(10);
  });

  it("should observe multiple properties", () => {
    let dummy;
    const obj = observable({ a: 1, b: 1 });

    observe(() => (dummy = obj.a + obj.b));

    expect(dummy).toBe(2);

    obj.a = 7;

    expect(dummy).toBe(8);

    obj.b = 5;

    expect(dummy).toBe(12);
  });

  it("should handle multiple reactions", () => {
    let dummy1, dummy2;
    const obj = observable({ a: 0 });

    observe(() => (dummy1 = obj.a));
    observe(() => (dummy2 = obj.a));

    expect(dummy1).toBe(0);
    expect(dummy2).toBe(0);

    obj.a = 7;

    expect(dummy1).toBe(7);
    expect(dummy2).toBe(7);
  });

  it("should observe nested objects", () => {
    let dummy;
    const obj = observable({ nested: { a: 0 } });
    const spy = jest.fn(() => (dummy = obj.nested.a));

    observe(spy);

    expect(dummy).toBe(0);
    expect(spy).toBeCalledTimes(1);

    obj.nested.a = 5;

    expect(dummy).toBe(5);
    expect(spy).toBeCalledTimes(2);

    obj.nested = {
      a: 3,
    };

    expect(dummy).toBe(3);
    expect(spy).toBeCalledTimes(3);
  });

  it("should not convert arrays into objects", () => {
    const obj = observable({
      arr: [1, 2, 3],
    });
    expect(isArray(obj.arr)).toBe(true);
  });

  it("should observe function chain calls", () => {
    let dummy;
    const obj = observable({ a: 0 });

    const getDummy = () => obj.a;

    observe(() => {
      dummy = getDummy();
    });

    expect(dummy).toBe(0);

    obj.a = 5;

    expect(dummy).toBe(5);
  });

  it("should avoid implicit infinite recursive loops with itself", () => {
    const obj = observable({ a: 0 });

    const spy = jest.fn(() => obj.a++);
    observe(spy);

    expect(obj.a).toBe(1);
    expect(spy).toBeCalledTimes(1);

    obj.a = 4;
    expect(obj.a).toBe(5);
    expect(spy).toBeCalledTimes(2);
  });

  it("should avoid infinite loops with other reactions", () => {
    const obj = observable({ num1: 0, num2: 1 });

    const spy1 = jest.fn(() => (obj.num1 = obj.num2));
    const spy2 = jest.fn(() => (obj.num2 = obj.num1));

    observe(spy1);
    observe(spy2);

    expect(obj.num1).toBe(1);
    expect(obj.num2).toBe(1);

    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);

    obj.num2 = 4;

    expect(obj.num1).toBe(4);
    expect(obj.num2).toBe(4);

    expect(spy1).toBeCalledTimes(2);
    expect(spy2).toBeCalledTimes(2);

    obj.num1 = 10;

    expect(obj.num1).toBe(10);
    expect(obj.num2).toBe(10);

    expect(spy1).toBeCalledTimes(3);
    expect(spy2).toBeCalledTimes(3);
  });

  it("should discover new branches while running automatically", () => {
    const obj = observable({ a: 0, b: 0 });

    const spy1 = jest.fn();
    const spy2 = jest.fn();

    observe(() => {
      if (obj.a < 2) {
        spy1();
      } else if (obj.b >= 0) {
        spy2();
      }
    });

    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(0);

    obj.a = 2;

    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);

    obj.b = 5;

    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(2);
  });

  it("should not be triggered by mutating a property, which is used in an inactive branch", () => {
    let dummy;
    const obj = observable({ prop: "value", run: true });

    const conditionalSpy = jest.fn(() => {
      dummy = obj.run ? obj.prop : "other";
    });
    observe(conditionalSpy);

    expect(dummy).toBe("value");
    expect(conditionalSpy).toBeCalledTimes(1);
    obj.run = false;
    expect(dummy).toBe("other");
    expect(conditionalSpy).toBeCalledTimes(2);
    obj.prop = "value2";
    expect(dummy).toBe("other");
    expect(conditionalSpy).toBeCalledTimes(2);
  });

  it("should not run if the value didn't change", () => {
    let dummy;
    const obj = observable({ a: 0 });

    const spy = jest.fn(() => {
      dummy = obj.a;
    });
    observe(spy);

    expect(dummy).toBe(0);
    expect(spy).toBeCalledTimes(1);

    obj.a = 2;

    expect(dummy).toBe(2);
    expect(spy).toBeCalledTimes(2);

    obj.a = 2;

    expect(dummy).toBe(2);
    expect(spy).toBeCalledTimes(2);
  });

  it("should allow nested reactions", () => {
    const nums = observable({ num1: 0, num2: 1, num3: 2 });
    const dummy = {
      num1: -1,
      num2: -1,
      num3: -1,
    };

    const childSpy = jest.fn(() => (dummy.num1 = nums.num1));
    const childReaction = observe(childSpy);
    const parentSpy = jest.fn(() => {
      dummy.num2 = nums.num2;
      childReaction();
      dummy.num3 = nums.num3;
    });
    observe(parentSpy);

    expect(dummy).toEqual({ num1: 0, num2: 1, num3: 2 });
    expect(parentSpy).toBeCalledTimes(1);
    expect(childSpy).toBeCalledTimes(2);

    // this should only call the childReaction
    nums.num1 = 4;
    expect(dummy).toEqual({ num1: 4, num2: 1, num3: 2 });
    expect(parentSpy).toBeCalledTimes(1);
    expect(childSpy).toBeCalledTimes(3);

    // this calls the parentReaction, which calls the childReaction once
    nums.num2 = 10;
    expect(dummy).toEqual({ num1: 4, num2: 10, num3: 2 });
    expect(parentSpy).toBeCalledTimes(2);
    expect(childSpy).toBeCalledTimes(4);

    // this calls the parentReaction, which calls the childReaction once
    nums.num3 = 7;
    expect(dummy).toEqual({ num1: 4, num2: 10, num3: 7 });
    expect(parentSpy).toBeCalledTimes(3);
    expect(childSpy).toBeCalledTimes(5);
  });

  describe("options", () => {
    it("lazy", () => {
      const obj = observable({ foo: 1 });
      let dummy;
      const runner = observe(() => (dummy = obj.foo), { lazy: true });
      expect(dummy).toBe(undefined);

      expect(runner()).toBe(1);
      expect(dummy).toBe(1);
      obj.foo = 2;
      expect(dummy).toBe(2);
    });

    it("scheduler", () => {
      let runner: any, dummy;
      const scheduler = jest.fn(_runner => {
        runner = _runner;
      });
      const obj = observable({ foo: 1 });
      observe(
        () => {
          dummy = obj.foo;
        },
        { scheduler }
      );
      expect(scheduler).not.toHaveBeenCalled();
      expect(dummy).toBe(1);
      // should be called on first trigger
      obj.foo++;
      expect(scheduler).toHaveBeenCalledTimes(1);
      // should not run yet
      expect(dummy).toBe(1);
      // manually run
      runner();
      // should have run
      expect(dummy).toBe(2);
    });
  });
});
