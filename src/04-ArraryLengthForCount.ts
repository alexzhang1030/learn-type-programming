// 数组长度做计数
type One = [unknown]['length'] // `1

type BuildArray1<
  L extends number,
  Result extends unknown[] = []
> = Result['length'] extends L ? Result : BuildArray1<L, [...Result, unknown]>
// [unknown, unknown]
type BuildArrayTest1 = BuildArray1<2>
type Add<A extends number, B extends number> = [
  ...BuildArray1<A>,
  ...BuildArray1<B>
]['length']
// 15
type AddTest = Add<5, 10>
// 1.2 Subtract
type Subtract<N1 extends number, N2 extends number> = BuildArray1<N1> extends [
  ...BuildArray1<N2>,
  ...infer R
]
  ? R['length']
  : never
// 2
type SubtractTest = Subtract<5, 3>
// 1.3 Multiply
type Multiply<
  Num1 extends number,
  Num2 extends number,
  Result extends unknown[] = []
> = Num2 extends 0
  ? Result['length']
  : Multiply<Num1, Subtract<Num2, 1>, [...BuildArray1<Num1>, ...Result]>

type MultiplyTest = Multiply<10, 20>
// 1.4 Divide
type Divide<
  Num1 extends number,
  Num2 extends number,
  CountArr extends unknown[] = []
> = Num1 extends 0
  ? CountArr['length']
  : Divide<Subtract<Num1, Num2>, Num2, [unknown, ...CountArr]>
type DivideTest = Divide<9, 3>

// 2.1 记录字符串的长度
type StrLen<
  Str extends string,
  CountArr extends unknown[] = []
> = Str extends `${string}${infer Rest}`
  ? StrLen<Rest, [...CountArr, unknown]>
  : CountArr['length']
