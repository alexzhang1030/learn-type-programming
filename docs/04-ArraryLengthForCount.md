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
type StrLen<
  S extends string,
  CountArr extends unknown[] = []
> = S extends `${infer F}${infer Rest}`
  ? StrLen<Rest, [unknown, ...CountArr]>
  : CountArr['length']
```

原理就是，递归每次截取一个字符，并向 `CountArr` 中添加一个 `unknown`，最终 `Str` 消费完毕，就可以获取到 `CountArr["length"]`

### 2.2 GreaterThan

泛型 Num1 和 Num2，判断前一个数字是否比后一个数字大

```ts
type GreaterThan<
  Num1 extends number,
  Num2 extends number,
  CountArr extends unknown[] = []
> = Num1 extends Num2
  ? false
  : CountArr['length'] extends Num2
  ? true
  : CountArr['length'] extends Num1
  ? false
  : GreaterThan<Num1, Num2, [unknown, ...CountArr]>
```

原理就是，首先判断 Num1 是否等于 Num2，如果不等，开始进行递归向 CountArr 中放 `unknown`，如果 `CountArr["length"]` 首先到了 Num2，那么就表示 Num1 > Num2，返回 true，反之如果先到了 Num1，那就表示 Num1 < Num2，那么就返回 false

```ts
// 测试一下
// true
type GreaterThanTest = GreaterThan<4, 3>
```

### 2.3 Fibonacci

提到数值运算，就不得不提到斐波那契数列了。

*F*(0) = 1，*F*(1) = 1, *F*(n) = *F*(n - 1) + *F*(n - 2)（*n* ≥ 2，*n* ∈ N*）

也就是递归的加法，在 TS 中使用构造数组的方式来解决

```ts
type FibonacciLoop<
  PrevArr extends unknown[],
  CurrentArr extends unknown[],
  IndexArr extends unknown[] = [],
  Num extends number = 1
  > = IndexArr['length'] extends Num
  ? CurrentArr['length']
  : FibonacciLoop<
    CurrentArr,
    [...PrevArr, ...CurrentArr],
    [...IndexArr, unknown],
    Num
  >
type Fibonacci<Num extends number> = FibonacciLoop<[1], [], [], Num>
```

测试一下

```ts
// 1 1 2 3 5 8 13 21 -> 21 
type FibonacciTest = Fibonacci<8>
```

原理就是

- 第一次 1，因为 `prevArr["length"] = 1`
- 第二次是 1，因为 `prevArr["length"] = 0`, `curArr["length"] = 1`
- 第三次是 2，因为 `prevArr["length"] = lastCurArr["length"] = 1`， `curArr["length"] = prev + lastCurr = 2`
- 第四次是 3，因为 `prevArr["length"] = lastCurArr["length"] = 2` ，`curArr["length"] = prev + lastCurr = 1 + 2 = 3`
- 现在我们就知道了，依次会往下加

## 总结

TypeScript 类型系统没有加减乘除运算符，所以我们**通过数组类型的构造和提取，然后取长度的方式来实现数值运算**。

我们通过构造和提取数组类型实现了加减乘除，也实现了各种计数逻辑。

用数组长度做计数这一点是 TypeScript 类型体操中最麻烦的一个点，也是最容易让新手困惑的一个点。



