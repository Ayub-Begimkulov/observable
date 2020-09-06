# Observable

### observable 

```js
import { observable } from 'observable';

const counter = observable({ num: 0 });

// observables behave like plain JS objects
counter.num = 12;
```

### observe

Observe executes passed function syncroniosly whenever its dependecies change.

```js
import { observable, observe } from 'observable';

const counter = observable({ num: 0 });
const countLogger = observe(() => console.log(counter.num));

// this calls countLogger and logs 1
counter.num++;
```

by default observe will run function synchronously, but you could provide `scheduler` option to change it

```js
import { observable, observe } from 'observable';

const person = observable({ name: 'John' });
observe(() => { 
  console.log(person.name)
}, {
  scheduler: fn => setTimeout(fn, 1000),
});

// this will log 'Bob' to the console 1 after second
person.name = 'Bob'
```

### computed

Computed values are cached and calculated lazyly.

```js
import { observable, computed } from 'observable'

const counter = observable({ num: 0 });
const plusOne = computed(() => counter.cum + 1)

// calculates the value
console.log(plusOne.value)

// doesn't recalculate value, deps didn't change
console.log(plusOne.value)
```

### watchEffect

Works the same as observe, but runs tasks asynchronously and batches them.

```js
import { observable, watchEffect } from 'observable'

const counter = observable({ num: 0 });

watchEffect(() => {
  console.log(counter.num);
})

// counter.num will be loged only 2 times
// first when it runs initialy to track all dependencies
// second time after the loop is finised
for (let i = 0; i < 10; i++) {
  counter.num++
}
```
