// 通过 extends 对传入的类型参数 P 做模式匹配，
// 其中值的类型是需要提取的，通过 infer 声明一个局部变量 Value 来保存
// 如果匹配，就返回匹配到的 Value
// 否则就返回 never 代表没匹配到

// 1. 例如我们可以将 Promise 传入的参数提取出来
type ExtractPromise<T> = T extends Promise<infer U> ? U : never
type extractedPromise = ExtractPromise<Promise<'hello'>> // 此类型是 hello

// 2. 数组类型
// 2.1 我们可以提取出第一个元素的类型
type arr = [1, 2, 3]
// 通过 extends 让 T 只能是 arr 类型，同时通过 infer 将第一个元素的类型提取出来
type FirstArrValue<T> = T extends [infer T, ...unknown[]] ? T : never
type firstArr = FirstArrValue<arr> // 1
// 而如果传入的是一个 []，那么就是 never
type firstArr2 = FirstArrValue<[]> // never
// 2.2 我们还可以提取出最后一个元素的类型
type LastArrValue<T> = T extends [...unknown[], infer T] ? T : never
type lastArr = LastArrValue<arr> // 3
// 2.3 活用 infer，我们甚至我们截取部分数组
type SliceArr<T> = T extends [unknown, ...infer T, unknown] ? T : never
type slicedArr = SliceArr<[1, 2, 3, 4, 5]> // [2, 3, 4]

// 3. 字符串类型
// 3.1 判断某个字符串是否以某个字符作为前缀
type StarsWith<
  T extends string,
  Str extends string
> = T extends `${Str}${infer U}` ? true : false
type isStartWithOne = StarsWith<'oneTwo', 'one'>
// 3.2 可以替换
type ReplaceStr<
  Str extends string,
  From extends string,
  To extends string
> = Str extends `${infer S}${From}${infer U}` ? `${S}${To}${U}` : never
type toBeReplaced = ReplaceStr<'replace is ?', '?', 'something'> // replace is something
type toNotBeReplaced = ReplaceStr<'replace is', '?', 'something'> // replace is something
// 3.3 Trim
// 由于 TS 限制，只能使用使用递归，首先实现一个 TrimRight
type TrimRight<Str extends string> = Str extends `${infer S}${
  | ' '
  | '\n'
  | '\t'}`
  ? TrimRight<S>
  : Str
// 然后实现一个 TrimLeft
type TrimLeft<Str extends string> = Str extends `${' ' | '\n' | '\t'}${infer S}`
  ? TrimLeft<S>
  : Str
type TrimStr<Str extends string> = TrimRight<TrimLeft<Str>>
type toBeTrimmed = TrimStr<'  str   '> // str

// 4. 函数类型，同样可以做模式匹配，可以提取出函数的参数和返回值的类型
// 4.1 获取参数的类型
type GetParameters<Func extends Function> = Func extends (
  ...args: infer P
) => unknown
  ? {
      [K in keyof P]: P[K]
    }
  : never
type funcParams = GetParameters<(name: string, age: number) => void> // [name: string, age: number]
// 4.2 获取参数的返回值类型
type GetReturnType<Func extends Function> = Func extends (
  ...args: any[]
) => infer ReturnType
  ? ReturnType
  : never
type funcReturnType = GetReturnType<(name: string, age: number) => number> // number
// 4.3 获取 this 指向
class Test {
  private name: string
  constructor(name: string) {
    this.name = name
  }
  getName(this: Test) {
    return this.name
  }
}
const t = new Test('test')
// t.getName.call({ name: 'foo' })
// 我们甚至可以获取到 this 的指向
type GetThisParameterType<Func extends Function> = Func extends (
  this: infer T,
  ...args: any[]
) => unknown
  ? T
  : never
type getThisType = GetThisParameterType<Test['getName']> // Test

// 5. 构造器
// 5.1 GetInstanceType
interface Person {}
interface PersonCtor {
  new (name: string): Person
}
type GetInstanceType<Ctor extends new (...args: any[]) => any> =
  Ctor extends new (...args: any[]) => infer T ? T : never
type person = GetInstanceType<PersonCtor>
// 5.2 GetConstructorParameterType
type GetConstructorParameterType<Ctor extends new (...args: any[]) => any> =
  Ctor extends new (...args: infer P) => unknown ? P : never
type constructorParameterType = GetConstructorParameterType<PersonCtor> // [name: string]

// 6. 索引类型
// 6.1 GetRefProps
type GetRefProps<Props> = 'ref' extends keyof Props
  ? Props extends { ref?: infer Value | undefined }
    ? Value
    : never
  : never
type refProp = GetRefProps<{ ref: number }> // number
