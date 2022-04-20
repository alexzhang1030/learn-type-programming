# 数组长度做计数

TypeScript 类型系统没有加减乘除运算符，怎么做数值运算呢？

不知道大家有没有注意到数组类型取 length 就是数值。

比如

```ts
// 数组长度做计数
type One = [unknown]['length'] // 1
```

而数组类型我们是能构造出来的，那么通过构造不同长度的数组然后取 length，不就是数值的运算么？

**TypeScript 类型系统中没有加减乘除运算符，但是可以通过构造不同的数组然后取 length 的方式来完成数值计算，把数值的加减乘除转化为对数组的提取和构造。**

(严格来说构造的是元组，大家知道数组和元组的区别就行)

这点可以说是类型体操中最麻烦的一个点，需要思维做一些转换，绕过这个弯来。

下面我们就来做一些真实的案例来掌握它吧。

## 1. 数组长度实现加减乘除

### 1.1 Add

还记得我们之前写过一个生成数组的类型吗

```ts
type BuildArray1<
  L extends number,
  Result extends unknown[] = []
> = Result['length'] extends L ? Result : BuildArray1<L, [...Result, unknown]>
```

```ts
// [unknown, unknown]
type BuildArrayTest1 = BuildArray1<2>
```

我们可以用它来实现加法

```ts
type Add<A extends number, B extends number> = [
  ...BuildArray1<A>,
  ...BuildArray1<B>
]['length']
```

测试一下

```ts
// 15
type AddTest = Add<5, 10>
```

就这样，我们通过构造一定长度的数组取 length 的方式实现了加法运算。

### 1.2 Subtract

加法是构造数组，那么减法该怎么办呢？

比如 3 是 [unknown, unknown, unknown] 的数组类型，提取出 2 个元素之后，剩下的数组再取 length 就是 1。

```ts
type Subtract<N1 extends number, N2 extends number> = BuildArray1<N1> extends [
  ...BuildArray1<N2>,
  ...infer R
]
  ? R['length']
  : never
```

测试一下

```ts
// 2
type SubtractTest = Subtract<5, 3>
```

### 1.3 Multiply

所以乘法该怎么做呢？

一种思路：

```
1 * 5 = 1 + 1 + 1 + 1 + 1
```

所以乘法就可以用加法递归一定的次数

```ts
type Multiply<
  Num1 extends number,
  Num2 extends number,
  Result extends unknown[] = []
> = Num2 extends 0
  ? Result['length']
  : Multiply<Num1, Subtract<Num2, 1>, [...BuildArray1<Num1>, ...Result]>
```

因为乘法是多个加法结果的累加，我们加了一个类型参数 ResultArr 来保存中间结果，默认值是 []，相当于从 0 开始加。

每加一次就把 Num2 减一，直到 Num2 为 0，就代表加完了。

加的过程就是往 ResultArr 数组中放 Num1 个元素。

这样递归的进行累加，也就是递归的往 ResultArr 中放元素。

最后取 ResultArr 的 length 就是乘法的结果。

测试一下

```ts
// 200
type MultiplyTest = Multiply<10, 20>
```

### 1.4 Divide

乘法是递归的累加，那除法不就是递归的累减么？

```ts
9 / 3 = 9 - 3 - 3 - 3
```

所以，除法的实现就是被减数不断减去减数，直到减为 0，记录减了几次就是结果。

```ts
type Divide<
  Num1 extends number,
  Num2 extends number,
  CountArr extends unknown[] = []
> = Num1 extends 0
  ? CountArr['length']
  : Divide<Subtract<Num1, Num2>, Num2, [unknown, ...CountArr]>
```

我们每次让 Num1 减去 Num2，同时能减多少次到 CountArr 中，最终结果就是 CountArr["length"]

测试一下

```ts
type DivideTest = Divide<9, 3>
```

## 2. 数组长度实现计数

### 2.1 记录字符串的长度

```ts
```

