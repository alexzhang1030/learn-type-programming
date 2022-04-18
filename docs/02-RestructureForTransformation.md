# 重新构造做变换

类型编程主要的目的就是对类型做各种转换，那么如何对类型做修改呢？

TypeScript 类型系统支持 3 种可以声明任意类型的变量： type、infer、类型参数。

type 叫做类型别名，其实就是声明一个变量存储某个类型：

```ts
type t = Promise<number>
```

infer 用于类型的提取，然后存到一个变量里，相当于局部变量

```ts
type GetValueType<P> = P extends Promise<infer Value> ? Value : never;
```

类型参数用于接受具体的类型，在类型运算中也相当于局部变量：

```ts
type isTwo<T> = T extends 2 ? true: false;
```

但是，严格来说这三种也都不叫变量，因为它们不能被重新赋值。

TypeScript 设计可以做类型编程的类型系统的目的就是为了产生各种复杂的类型，那不能修改怎么产生新类型呢？

答案是重新构造。

这就涉及到了第二个类型体操套路：重新构造做变换。

**TypeScript 的 type、infer、类型参数声明的变量都不能修改，想对类型做各种变换产生新的类型就需要重新构造。**

数组、字符串、函数等类型的重新构造比较简单。

索引类型，也就是多个元素的聚合类型的重新构造复杂一些，涉及到了映射类型的语法。

我们先从简单的开始：

## 1. 数组类型的重新构造

### 1.1 Push

例如有这个一个元组类型

```ts
[1, 2, 3]
```

如果想要追加一个类型怎么做呢？TS 不支持对于类型的修改，但是可以重新构造一个类型

```ts
type Push<O extends unknown[], Ele> = [...O, Ele]
```

测试一下

```ts
type pushTest = Push<[1, 2, 3], 4> // [1, 2, 3, 4]
```

这就是数组 / 元组的重新构造。

> **数组和元组的区别**：数组类型是指任意多个同一类型的元素构成的，比如 number []、Array\<number\>，而元组则是数量固定，类型可以不同的元素构成的，比如 [1, true, 'guang']。

### 1.2 Unshift

我们可以 Push，同样可以 Unshift

```ts
type Unshift<O extends unknown[], Ele> = [Ele, ...O]
```

测试一下

```ts
type unshiftTest = Unshift<[1, 2, 3], 0>
```

### 1.3 Zip

有这样两个元组

```ts
type Tuple1 = [1, 2]
type Tuple2 = ['test1', 'test2']
```

我们想要合并为这样

```ts
type Tuple3 = [[1, "test1"], [2, "test2"]]
```

可以这样

```ts
type Zip<
  One extends [unknown, unknown],
  Other extends [unknown, unknown]
> = One extends [infer OneFirst, infer OneSecond]
  ? Other extends [infer OtherFirst, infer OtherSecond]
    ? [[OneFirst, OtherFirst], [OneSecond, OtherSecond]]
    : []
  : []
```

但是这种是有很大限制的，如果说是不定长度，就只能用递归了

```ts
type Zip2<One extends unknown[], Other extends unknown[]> = One extends [
  infer OneFirst,
  ...infer OneOther
]
  ? Other extends [infer OtherFirst, ...infer OtherOther]
    ? [[OneFirst, OtherFirst], ...Zip2<OneOther, OtherOther>]
    : []
  : []
```

测试一下

```ts
type zipTest = Zip2<Tuple1, Tuple2>  // [[1, "test1"], [2, "test2"]]
```

## 2. 字符串类型的重新构造

### 2.1 CapitalizeStr

例如我们想让某个字符串的第一个字符大写，UpperCase 是 TS 的内建类型

```ts
type CapitalizeStr<S extends string> = S extends `${infer First}${infer O}`
  ? `${Uppercase<First>}${O}`
  : ''
```

测试一下

```ts
type CapitalizeStrTest = CapitalizeStr<'hello'> // Hello
```

