# 递归复用做循环

会做类型的提取和构造之后，我们已经能写出很多类型编程逻辑了，但是有时候提取或构造的数组元素个数不确定、字符串长度不确定、对象层数不确定。这时候怎么办呢？

其实前面的案例我们已经涉及到了一些，就是递归。

这就是第三个类型体操套路：递归复用做循环。

## 1. 递归复用

**递归是把问题分解为一系列相似的小问题，通过函数不断调用自身来解决这一个个小问题，直到满足结束条件，就完成了问题的求解。**

TypeScript 的高级类型支持类型参数，可以做各种类型运算逻辑，返回新的类型，和函数调用是对应的，自然也支持递归。

**TypeScript 类型系统不支持循环，但支持递归。当处理数量（个数、长度、层数）不固定的类型的时候，可以只处理一个类型，然后递归的调用自身处理下一个类型，直到结束条件也就是所有的类型都处理完了，就完成了不确定数量的类型编程，达到循环的效果。**

既然提到了数组、字符串、对象等类型，那么我们就来看一下这些类型的递归案例吧。

## 2. Promise 的递归复用

### 2.1 DeepPromiseValueType

实现一个提取不确定层数的 Promise 中的 value 类型的高级类型。

```ts
type ttt = Promise<Promise<Promise<Record<string, any>>>>
```

```ts
type DeepPromiseValueType<T> = T extends Promise<infer U>
  ? DeepPromiseValueType<U>
  : T
```

## 3. 数组类型的递归

### 3.1 ReverseArr

有这样的一个元组类型

```ts
type arr = [1,2,3,4,5];
```

我们需要将其完全反转

```ts
type ReverseArr<T extends unknown[]> = T extends [...infer O, infer L]
  ? [L, ...ReverseArr<O>]
  : T
```

测试一下

```ts
// [5, 4, 3, 2, 1]
type ReverseArrTest = ReverseArr<[1, 2, 3, 4, 5]>
```

### 3.2 Includes

既然递归可以做循环用，那么像查找元素这种自然也就可以实现。

比如查找 [1, 2, 3, 4, 5] 中是否存在 4，是就返回 true，否则返回 false。

从长度不固定的数组中查找某个元素，数量不确定，这时候就应该想到递归。

```ts
type isEquals<A, B> = (A extends B ? true : false) &
  (B extends A ? true : false)
type Includes<T extends unknown[], I> = T extends [infer F, ...infer R]
  ? isEquals<F, I> extends true
    ? true
    : Includes<R, I>
  : false
```

测试一下：

```ts
// true
type IncludesTest = Includes<[1, 2, 3], 1>
// false
type IncludesTest2 = Includes<[1, 2, 3], 4>
```

### 3.3 RemoveItem

既然可以判断存不存在，也可以进行删除

- `A`：剩余比对的 Array
- `I`：需要筛选的 Item
- `R`：合成的新数组 Result

```ts
type RemoveItem<A extends unknown[], I, R extends unknown[] = []> = A extends [
  infer F,
  ...infer O
]
  ? isEquals<F, I> extends true
    ? RemoveItem<O, I, R>
    : RemoveItem<O, I, [...R, F]>
  : R
```

测试

```ts
// [1, 1, 1]
type RemoveItemTest = RemoveItem<[1, 1, 1, 2], 2>
```

### 3.4 BuildArray

- `L`：length
- `E`：fill element
- `R`：最终得出的数组类型，Result

```ts
type BuildArray<
  L extends number,
  E = unknown,
  R extends unknown[] = []
> = R['length'] extends L ? R : BuildArray<L, E, [...R, E]>
// ["123", "123", "123", "123", "123"]
type BuildArray2 = BuildArray<5, '123'>
```

测试一下：

```ts
// ["123", "123", "123", "123", "123"]
type BuildArray2 = BuildArray<5, '123'>
```

## 4. 字符串类型的递归

### 4.1 ReplaceAll

我们之前实现过 Replace

```ts
type Replace<
  S extends string,
  Flag extends string,
  Replaced extends string
> = S extends `${infer Prefix}${Flag}${infer End}`
  ? `${Prefix}${Replaced}${End}`
  : never

type ReplaceTest = Replace<'hello ?', '?', 'world'> // hello world
```

但是当 flag 数量不确定的时候，其实我们就要用到递归了

```ts
type ReplaceAll<
  S extends string,
  Flag extends string,
  Replaced extends string
> = S extends `${infer Prefix}${Flag}${infer End}`
  ? `${Prefix}${Replaced}${ReplaceAll<End, Flag, Replaced>}`
  : S
```

测试一下

```ts
// hello world nihao world
type ReplaceAllTest = ReplaceAll<'hello ? nihao ?', '?', 'world'>
```

### 4.2 StringToUnion

我们甚至可以将 string 转为 union

举个例子：

```ts
type String2Union<S extends string> = S extends `${infer F}${infer O}`
  ? F | String2Union<O>
  : never
```

测试一下

```ts
// "a" | "b" | "c" | "d"
type String2UnionTest = String2Union<'abcd'>
```

### 4.3 ReverseStr

类型参数 Str 为待处理的字符串。类型参数 Result 为构造出的字符，默认值是空串。

通过模式匹配提取第一个字符到 infer 声明的局部变量 First，其余字符放到 Rest。

用 First 和之前的 Result 构造成新的字符串，把 First 放到前面，**因为递归是从左到右处理，那么不断往前插就是把右边的放到了左边，完成了反转的效果。**

直到模式匹配不满足，就处理完了所有的字符。

这样就完成了字符串的反转：

```ts
type ReverseStr<
  Str extends string,
  Result extends string = ''
> = Str extends `${infer F}${infer Rest}`
  ? ReverseStr<Rest, `${F}${Result}`>
  : Result
```

测试一下

```ts
// cba
type ReverseStrTest = ReverseStr<'abc'>
```

## 5. 对象类型的递归

### 5.1 DeepReadonly

```ts
type DeepReadonly<Obj extends Record<string, any>> = {
    readonly [K in keyof Obj]: Obj[K] extends Record<
        string | symbol | number,
        unknown
    >
    ? DeepReadonly<Obj[K]>
    : Obj[K]
}
```

测试一下

```ts
type DeepReadonlyTest = DeepReadonly<{
  name: {
    foo: {
      bar: 1
    }
  }
}>
```

但是这样，我们如果鼠标移动到 DeepReadonlyTest 上，是不会进行计算的，也就是我们无法看到深层次的属性修饰符，只会这样

```ts
// 计算出的类型
type DeepReadonlyTest = {
    readonly c: () => void;
    readonly name: DeepReadonly<{
        a: 1;
        c: () => void;
        foo: {
            bar: 1;
        };
    }>;
}
```

此时我们需要让其 extends never 或 extends any 来让其进行计算

```ts
type DeepReadonly<Obj extends Record<string, any>> = Obj extends any
  ? {
      readonly [K in keyof Obj]: Obj[K] extends Record<
        string | symbol | number,
        unknown
      >
        ? DeepReadonly<Obj[K]>
        : Obj[K]
    }
  : never
```

这次我们再看看计算出的类型

```ts
type DeepReadonlyTest = {
    readonly c: () => void;
    readonly name: {
        readonly a: 1;
        readonly c: () => void;
        readonly foo: {
            readonly bar: 1;
        };
    };
}
```

而且写 `Obj extends any` 还有额外的好处就是能处理联合类型，这个可以看套路五，会有解释。

## 总结

递归是把问题分解成一个个子问题，通过解决一个个子问题来解决整个问题。形式是不断的调用函数自身，直到满足结束条件。

在 TypeScript 类型系统中的高级类型也同样支持递归，**在类型体操中，遇到数量不确定的问题，要条件反射的想到递归。** 比如数组长度不确定、字符串长度不确定、索引类型层数不确定等。

如果说学完了提取和构造可以做一些基础的类型体操，那再加上递归就可以实现各种复杂类型体操了。

(其实这节的 IsEqual 判断是不完善的，套路六里面会讲原因)
