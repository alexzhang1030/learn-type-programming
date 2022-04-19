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

这就是字符串类型的重新构造：**从已有的字符串类型中提取出一些部分字符串，经过一系列变换，构造成新的字符串类型。**

### 2.2 CamelCase

再来实现从 snake_case 到 camelCase 的转换，这个例子我们就可以用到我们刚写的 `camelCase` 类型

```ts
type camelCase<S extends string> =
  S extends `${infer Left}_${infer Middle}_${infer Right}`
    ? `${Left}${CapitalizeStr<Middle>}${CapitalizeStr<Right>}`
    : never
```

测试一下

```ts
type camelCaseTest = camelCase<'hi_hi_hi'> // hiHiHi
```

### 2.3 DropSubStr

我们还可以删除某个字符串中的子串

```ts
type DropSubStr<
  S extends string,
  Sub extends string
> = S extends `${infer O}${Sub}` ? DropSubStr<O, Sub> : S
```

测试一下

```ts
type DropSubStrTest = DropSubStr<'hello~~~', '~'> // hello
```

## 3. 函数类型的重新构造

### 3.1 AppendArgument

```ts
type AppendArgument<
  Func extends (...args: any[]) => unknown,
  Arg
> = Func extends (...args: infer Args) => infer ReturnType
  ? (...args: [...Args, Arg]) => ReturnType
  : never
```

测试一下

```ts
// (args0: string, args1: number) => number }
type AppendArgumentTest = AppendArgument<(name: string) => number, number>
```

## 4. 索引类型的重新构造

索引类型是聚合多个元素的类型，比如这就是一个索引类型：

```ts
type obj = {
  name: string;
  age: number;
  gender: boolean;
}
```

索引类型可以添加修饰符 `readonly`（只读）、`?`（可选）:

```ts
type obj = {
  readonly name: string;
  age?: number;
  gender: boolean;
}
```

对它的修改和构造新类型涉及到了映射类型的语法：

```ts
type Mapping<Obj extends object> = { 
    [Key in keyof Obj]: Obj[Key]
}
```

### 4.1 Mapping

映射的过程中可以对 value 做下修改，比如：

```ts
type MappingTriple<O extends Record<string, unknown>> = {
  [K in keyof O]: [O[K], O[K], O[K]]
}
```

测试一下

```ts
// { name: [1, 1, 1], age: [2, 2, 2] }
type MappingTripleTest = MappingTriple<{ name: 1; age: 2 }> 
```

### 4.2 UpperCaseKey

```ts
type UpperCaseKey<O extends Record<string, unknown>> = {
  [K in keyof O as Uppercase<K & string>]: O[K]
}
```

测试一下

```ts
// { NAME: string }
type UpperCaseKeyTest = UpperCaseKey<{ name: string }>
```

### 4.3 Record

TS 内建了类型 `Record` 用于创建索引类型。

```ts
type Record<K extends string | number | symbol, T> = { [P in K]: T }
```

例如：

```ts
type Obj = Record<string, Record<string, unkonwn>>

const obj: Obj = {
    foo: {
        bar: "baz"
    }
}
```

### 4.4 ToReadonly

索引类型的索引可以添加 readonly 的修饰符，代表只读。

那我们就可以实现给索引类型添加 readonly 修饰的高级类型：

```ts
type ToReadonly<T> = {
  readonly [K in keyof T]: T[K]
}
```

测试一下

```ts
// { readonly name: string }
type ToReadonlyTest = ToReadonly<{ name: string }>
```

### 4.5 ToPartial

```ts
type ToPartial<T> = {
  [K in keyof T]?: T[K]
}
```

测试一下

```ts
// { name?: string | undefined }
type ToPartialTest = ToPartial<{ name: string }>
```

### 4.6 ToMutable

既然可以加上 readonly，还可以去掉

```ts
type ToMutable<T> = {
  -readonly [K in keyof T]: T[K]
}
```

测试一下

```ts
// { name: string }
type ToMutableTest = ToMutable<ToReadonly<{ name: string }>>
```

### 4.7 ToRequired

同理，也可以去掉可选修饰符

```ts
type ToRequired<T> = {
  [K in keyof T]-?: T[K]
}
```

测试一下

```ts
// { name: string }
type ToRequiredTest = ToRequired<ToPartial<{ name: string }>>
```

### 4.8 FilterByValueType

可以在构造新索引类型的时候根据值的类型做下过滤：

```ts
type FilterByValueType<Obj extends Record<string, any>, ValueType> = {
  [Key in keyof Obj as ValueType extends Obj[Key] ? Key : never]: Obj[Key]
}
```

测试一下

```ts
// { name: string }
type FilterByValueTypeTest = FilterByValueType<
  { name: string; age: number },
  string
>
```

## 总结

TypeScript 支持 type、infer、类型参数来保存任意类型，相当于变量的作用。

但其实也不能叫变量，因为它们是不可变的。**想要变化就需要重新构造新的类型，并且可以在构造新类型的过程中对原类型做一些过滤和变换。**

数组、字符串、函数、索引类型等都可以用这种方式对原类型做变换产生新的类型。其中索引类型有专门的语法叫做映射类型，对索引做修改的 as 叫做重映射。

提取和构造这俩是相辅相成的，学完了`模式匹配做提取`，`重新构造做变换` 这两个套路之后，很多类型体操就有思路了。
