// 1. 数组类型的重新构造
type Push<O extends unknown[], Ele> = [...O, Ele]
type pushTest = Push<[1, 2, 3], 4> // [1, 2, 3, 4]

type Unshift<O extends unknown[], Ele> = [Ele, ...O]
type unshiftTest = Unshift<[1, 2, 3], 0>

type Tuple1 = [1, 2]
type Tuple2 = ['test1', 'test2']
type Zip<
  One extends [unknown, unknown],
  Other extends [unknown, unknown]
> = One extends [infer OneFirst, infer OneSecond]
  ? Other extends [infer OtherFirst, infer OtherSecond]
    ? [[OneFirst, OtherFirst], [OneSecond, OtherSecond]]
    : []
  : []
// 递归处理
type Zip2<One extends unknown[], Other extends unknown[]> = One extends [
  infer OneFirst,
  ...infer OneOther
]
  ? Other extends [infer OtherFirst, ...infer OtherOther]
    ? [[OneFirst, OtherFirst], ...Zip2<OneOther, OtherOther>]
    : []
  : []
type zipTest = Zip2<Tuple1, Tuple2>

// 2. 字符类型的重新构造
type CapitalizeStr<S extends string> = S extends `${infer First}${infer O}`
  ? `${Uppercase<First>}${O}`
  : ''
type CapitalizeStrTest = CapitalizeStr<'hello'> // Hello
