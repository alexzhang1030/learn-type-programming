// 1. Promise 的递归复用
// 1.1 DeepPromiseValueType
type DeepPromiseValueType<T> = T extends Promise<infer U>
  ? DeepPromiseValueType<U>
  : T
// { [x: string]: any }
type ttt = DeepPromiseValueType<Promise<Promise<Promise<Record<string, any>>>>>

// 2. 数组类型的递归
// 2.1 ReverseArr
type ReverseArr<T extends unknown[]> = T extends [...infer O, infer L]
  ? [L, ...ReverseArr<O>]
  : T
// [5, 4, 3, 2, 1]
type ReverseArrTest = ReverseArr<[1, 2, 3, 4, 5]>
// 2.2 Includes
type isEquals<A, B> = (A extends B ? true : false) &
  (B extends A ? true : false)
type Includes<T extends unknown[], I> = T extends [infer F, ...infer R]
  ? isEquals<F, I> extends true
    ? true
    : Includes<R, I>
  : false
// true
type IncludesTest = Includes<[1, 2, 3], 1>
// false
type IncludesTest2 = Includes<[1, 2, 3], 4>
// 2.3 RemoveItem
type RemoveItem<A extends unknown[], I, R extends unknown[] = []> = A extends [
  infer F,
  ...infer O
]
  ? isEquals<F, I> extends true
    ? RemoveItem<O, I, R>
    : RemoveItem<O, I, [...R, F]>
  : R
type RemoveItemTest = RemoveItem<[1, 1, 1, 2], 2>
// 2.4 BuildArray
type BuildArray<
  L extends number,
  E = unknown,
  R extends unknown[] = []
> = R['length'] extends L ? R : BuildArray<L, E, [...R, E]>
// ["123", "123", "123", "123", "123"]
type BuildArray2 = BuildArray<5, '123'>

// 3. 字符串的递归处理
type Replace<
  S extends string,
  Flag extends string,
  Replaced extends string
> = S extends `${infer Prefix}${Flag}${infer End}`
  ? `${Prefix}${Replaced}${End}`
  : never
type ReplaceAll<
  S extends string,
  Flag extends string,
  Replaced extends string
> = S extends `${infer Prefix}${Flag}${infer End}`
  ? `${Prefix}${Replaced}${ReplaceAll<End, Flag, Replaced>}`
  : S
type ReplaceTest = Replace<'hello ?', '?', 'world'> // hello world
// hello world nihao world
type ReplaceAllTest = ReplaceAll<'hello ? nihao ?', '?', 'world'>
