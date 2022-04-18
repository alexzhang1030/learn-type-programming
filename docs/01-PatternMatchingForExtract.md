# 模式匹配做提取

通过 `infer` + `extends` 巧做提取

例如，我们可以提取出 Promise 中泛型的值：

```ts
type p = Promise<"value">
type ExtractPromise<T> = T extends Promise<infer U> ? U : never
// value 是 value 类型
type value = ExtractPromise<p>
```

## 1. 数组类型

### 1.1 First

我们可以提取出某个数组类型中的第一个值作为某个类型

```ts
type arr = [1, 2, 3]
// 通过 extends 让 T 只能是 arr 类型，同时通过 infer 将第一个元素的类型提取出来
type FirstArrValue<T> = T extends [infer T, ...unknown[]] ? T : never
type firstArr = FirstArrValue<arr> // 1
// 而如果传入的是一个 []，那么就是 never
type firstArr2 = FirstArrValue<[]> // never
```

### 1.2 Last

我们也可以提取出最后一个类型

```ts
type Last<T> = T extends [...unknown[], infer T] ? T : never
```

### 1.3 Slice

我们甚至可以将数组中的一部分提取出来，例如下文中的掐头去尾的例子

```ts
type SliceArr<T> = T extends [unknown, ...infer T, unknown] ? T : never
type slicedArr = SliceArr<[1, 2, 3, 4, 5]> // [2, 3, 4]
```

## 2. 字符串类型

### 2.1 StarsWith

我们可以写一个类型，来判断某个字符串是否是以某个字符串开头的

```ts
type StarsWith<
  T extends string,
  Str extends string
> = T extends `${Str}${infer U}` ? true : false
```

测试一下

```ts
type isStartWithOne = StarsWith<'oneTwo', 'one'>  // true
type isNotStartWithOne = StarsWith<'threeTwo', 'one'>  // false 
```

### 2.2 Replace

```ts
type ReplaceStr<
  Str extends string,
  From extends string,
  To extends string
> = Str extends `${infer S}${From}${infer U}` ? `${S}${To}${U}` : never
```

仍然是通过 `infer` 和 `extends` 做匹配，测试一下

```ts
type toBeReplaced = ReplaceStr<'replace is ?', '?', 'something'> // replace is something
```

### 2.3 Trim

既然我们可以匹配到字符串，那么同样可以实现去掉两端的空格。不过由于 TS 的限制，我们只能来使用递归

首先，需要声明一个 `TrimRight` 类型，用于去除所有的右端空格

```ts
type TrimRight<Str extends string> = Str extends `${infer S}${
  | ' '
  | '\n'
  | '\t'}`
  ? TrimRight<S>
  : Str
```

依旧是通过 infer + extend + 递归所实现的

```ts
// 然后实现一个 TrimLeft，套路和 TrimRight 一样的
type TrimLeft<Str extends string> = Str extends `${' ' | '\n' | '\t'}${infer S}`
  ? TrimLeft<S>
  : Str
```

最后结合起来并测试

```ts
type TrimStr<Str extends string> = TrimRight<TrimLeft<Str>>
type toBeTrimmed = TrimStr<'  str   '> // str
```

## 3. 函数

函数同样可以做模式匹配，例如提取参数、返回值的类型

### 3.1 GetParameters

```ts
type GetParameters<Func extends Function> = Func extends (
  ...args: infer P
) => unknown
  ? P
  : never
```

测试一下

```ts
type funcParams = GetParameters<(name: string, age: number) => void> // [name: string, age: number]
```

### 3.2 GetReturnType

获取函数返回值的类型

参数类型可以是任意类型，也就是 `any []`（注意，这里不能用 `unknown`，因为参数类型是要赋值给别的类型的，而 `unknown` 只能用来接收类型，所以用 `any`）。

```ts
type GetReturnType<Func extends Function> = Func extends (
  ...args: any[]
) => infer ReturnType
  ? ReturnType
  : never
```

测试一下

```ts
type funcReturnType = GetReturnType<(name: string, age: number) => number> // number
```

### 3.3 GetThisParameterType

在日常开发中，我们可以在某个方法中使用 `this`

```ts
class Test {
  private name: string
  constructor(name: string) {
    this.name = name
  }
  getName() {
    return this.name
  }
}
const t = new Test('test')
// 也可以使用 bind 来改变 this
t.getName.call({ name: 'foo' })
```

```ts
// 但是上面 bind 后 this 指向就变了，我们需要一种方法来让编译器帮助我们报错
// 这样就直接报错了
getName(this: Test) {
    return this.name
}
```

如果指定了 this 指向，还可以获取到其 this 指向

```ts
type GetThisParameterType<Func extends Function> = Func extends (
  this: infer T,
  ...args: any[]
) => unknown
  ? T
  : never
```

测试一下

```ts
type getThisType = GetThisParameterType<Test['getName']> // Test
```

## 4. 构造器

构造器和函数最大的区别是，构造器可以创建对象，可以使用 `new	`

同时，我们也可以通过模式匹配来获取构造器的参数与返回值

### 4.1 GetInstanceType

```ts
type GetInstanceType<Ctor extends new (...args: any[]) => any> =
  Ctor extends new (...args: any[]) => infer T ? T : never
```

测试一下

```ts
interface Person {}
interface PersonCtor {
  new (name: string): Person
}
type person = GetInstanceType<PersonCtor>  // Person
```

### 4.2 GetConstrutorParameters

```ts
type GetConstructorParameterType<Ctor extends new (...args: any[]) => any> =
  Ctor extends new (...args: infer P) => unknown ? P : never
```

测试一下

```ts
interface Person {}
interface PersonCtor {
  new (name: string): Person
}
type constructorParameterType = GetConstructorParameterType<PersonCtor> // [name: string]
```

## 5. 索引类型

索引类型也同样可以用模式匹配提取某个索引的值的类型

### 5.1 GetRefProps

我们可以通过模式匹配的方式来获取某个索引类型中 ref 键的值的类型

```ts
type GetRefProps<Props> = 'ref' extends keyof Props
  ? Props extends { ref?: infer Value | undefined }
    ? Value
    : never
  : never
```

测试一下

```ts
type refProp = GetRefProps<{ ref: number }> // number
```

## 总结

就像字符串可以匹配一个模式串提取子组一样，TypeScript 类型也可以匹配一个模式类型提取某个部分的类型。

**TypeScript 类型的模式匹配是通过类型 extends 一个模式类型，把需要提取的部分放到通过 infer 声明的局部变量里，后面可以从这个局部变量拿到类型做各种后续处理。**

模式匹配的套路在数组、字符串、函数、构造器、索引类型、Promise 等类型中都有大量的应用，掌握好这个套路能提升很大一截类型体操水平。