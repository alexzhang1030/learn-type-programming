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
// 2.1 Capitalize
type CapitalizeStr<S extends string> = S extends `${infer First}${infer O}`
  ? `${Uppercase<First>}${O}`
  : ''
type CapitalizeStrTest = CapitalizeStr<'hello'> // Hello
// 2.2 snake_case 2 camelCase
type camelCase<S extends string> =
  S extends `${infer Left}_${infer Middle}_${infer Right}`
    ? `${Left}${CapitalizeStr<Middle>}${CapitalizeStr<Right>}`
    : never
type camelCaseTest = camelCase<'hi_hi_hi'> // hiHiHi
// 2.3 DropSubStr
type DropSubStr<
  S extends string,
  Sub extends string
> = S extends `${infer O}${Sub}` ? DropSubStr<O, Sub> : S
type DropSubStrTest = DropSubStr<'hello~~~', '~'> // hello

// 3. 函数类型的重新构造
// 3.1 AppendArgument
type AppendArgument<
  Func extends (...args: any[]) => unknown,
  Arg
> = Func extends (...args: infer Args) => infer ReturnType
  ? (...args: [...Args, Arg]) => ReturnType
  : never
type AppendArgumentTest = AppendArgument<(name: string) => number, number> // (args0: string, args1: number) => number }

// 4. 映射类型的重新构造
// 4.1 MappingTriple
type MappingTriple<O extends Record<string, unknown>> = {
  [K in keyof O]: [O[K], O[K], O[K]]
}
type MappingTripleTest = MappingTriple<{ name: 1; age: 2 }> // { name: [1, 1, 1], age: [2, 2, 2] }
// 4.2 UpperCaseKey
type UpperCaseKey<O extends Record<string, unknown>> = {
  [K in keyof O as Uppercase<K & string>]: O[K]
}
type UpperCaseKeyTest = UpperCaseKey<{ name: string }> // { NAME: string }
// 4.3 ToReadonly
type ToReadonly<T> = {
  readonly [K in keyof T]: T[K]
}
type ToReadonlyTest = ToReadonly<{ name: string }> // { readonly name: string }
// 4.4 ToPartial
type ToPartial<T> = {
  [K in keyof T]?: T[K]
}
type ToPartialTest = ToPartial<{ name: string }> // { name?: string | undefined }
// 4.5 ToMutable
type ToMutable<T> = {
  -readonly [K in keyof T]: T[K]
}
// { name: string }
type ToMutableTest = ToMutable<ToReadonly<{ name: string }>>
// 4.6 ToRequired
type ToRequired<T> = {
  [K in keyof T]-?: T[K]
}
// { name: string }
type ToRequiredTest = ToRequired<ToPartial<{ name: string }>>
// 4.7 FilterByValueType
type FilterByValueType<Obj extends Record<string, any>, ValueType> = {
  [Key in keyof Obj as ValueType extends Obj[Key] ? Key : never]: Obj[Key]
}
// { name: string }
type FilterByValueTypeTest = FilterByValueType<
  { name: string; age: number },
  string
>
