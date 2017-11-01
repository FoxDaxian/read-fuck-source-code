### Object Functions

-------

- ```hasEnumBug```：判断ie9以下枚举属性bug的
- ```nonEnumerableProps```：ie9以下不可枚举的属性
- ```collectNonEnumProps(obj, keys)```：处理ie9一下bug
- ```_.keys(obj)```：返回obj上自身的所有key
- ```_.allKeys(obj)```：返回obj上的所有key
- ```_.values(obj)```：返回obj自身上的所有value
- ```_.mapObject(obj, iteratee, context)```：iteratee迭代obj自身上的所有value，并把每个结果添加到结果对象中，返回该结果对象
- ```_.pairs(obj)```：将对象的键值对转换为数组，返回一个二维数组
- ```_.invert(obj)```：颠倒键值对，相同值会覆盖之前的value
- ```_.functions(obj)```：返回obj上所有可枚举的值是函数的key，排序之
- ```_.functions(obj)```：返回obj上所有可枚举的值是函数的key，排序之
- ```_.extend(obj)```：将参数上所有对象的所有键值对填充/覆盖到obj上
- ```_.extendOwn(obj)```：将参数上所有对象的自身的键值对填充/覆盖到obj上
- ```_.defaults(obj)```：将参数上所有对象的自身的键值对填充到obj上
```javascript
// 上面三个方法的核心逻辑
// 内部创造一个指派者函数，第二个参数为空或者假，那么会覆盖旧对象中已有的属性
// keysFunc参数为_.keys/_.allKeys
var createAssigner = function(keysFunc, defaults) {
    return function(obj) {
        var length = arguments.length;
        // 确保一定为对象
        if (defaults) obj = Object(obj);
        // 如果参数不匹配，则返回对象化的obj
        if (length < 2 || obj == null) return obj;
        // 循环剩余参数
        for (var index = 1; index < length; index++) {
            var source = arguments[index], // 获取当前参数
                keys = keysFunc(source), // 获取当前参数的key组成的数组，根据keysFunc来决定包不包括原型链上的属性
                l = keys.length;
            for (var i = 0; i < l; i++) {
                var key = keys[i];
                // 填充或覆盖
                if (!defaults || obj[key] === void 0) obj[key] = source[key];
            }
        }
        return obj;
    };
};
// _.extend = createAssigner(_.allKeys);
// _.extendOwn = _.assign = createAssigner(_.keys);
// _.defaults = createAssigner(_.allKeys, true);
```
- ```_.findKey(obj, predicate, context)```：找到obj自身键值对中，通过断言的第一个key
- ```_.keyInObj(value, key, obj)```：内部是 value in obj
- ```_.pick(obj, restArgs)```：选择符合断言或者/keyInObj的所有key，并返回
- ```_.omit(obj, restArgs)```：与pick相反
- ```_.create(prototype, props)```：创造一个继承prototype，并被props自身属性填充的对象
- ```_.clone(obj)```：浅拷贝一个对象（你分的清浅拷贝和深拷贝吗？）
- ```_.tap(obj, interceptor)```：拦截器，让inteceptor先处理obj，在返回obj
- ```_.isMatch(object, attrs)```：判断object包不包括attrs上的所有键值对
- ```_.isEqual(a, b)```：深度比较a, b是否相等，这个比较麻烦了，代码中有注释
- ```_.isEmpty(obj)```：判断是否为空
- ```_.isElement(obj)```：是否为元素
- ```_.isArray(obj)```：是否为数组
- ```_.isObject(obj)```：符合的有函数和数组，对null做了处理
- 1955~1984行，循环出_.isXxx方法判断类型，还有兼容的这一部分开始就全是对象的了
- ```_.isFinite(obj)```：是不是有限的数字
- ```_.isNaN(obj)```：是不是NaN
- ```_.isBoolean(obj)```：是不是布尔值
- ```_.isNull(obj)```：是不是null
- ```_.isUndefined(obj)```：是不是undefined
- ```_.has(obj, path)```：判断obj自身上有没有path

----------

### '补充医疗保险'

- #### key in obj相关
    + 可以用于数组和对象
    + null, undefined依然为true
    + 包括继承自原型上的属性和方法
    + [参考](https://stackoverflow.com/questions/455338/how-do-i-check-if-an-object-has-a-key-in-javascript)
- #### 一个连续赋值 [参考](https://www.zhihu.com/question/41220520)
```javascript
    var a = { n: 1 }
    var b = a
    a.x = a = { n: 2 }
    // 自己想想？a和b现在都是什么？
    // 
    // 
    // 
    //
    //
    //
    //
    // a => { n: 2 }
    // b => { n: 1, x: { n: 2 } }
    // 直接从最后一句连续赋值开始解释，首先预解析是从左到右，连续赋值是从右到左
    // 预解析的时候a.x不存在，所以 a.x 为 undefined，并存起来
    // 然后从右到左赋值，a先改变了指向，这时候a = { n: 2 }，b不变---
    // 但是由于预解析的时候a.x已经存起来了---
    // 所以a.x的a的指向还是旧地址，所以旧地址的x改变了，b指向的值也就改变了，所以出现了上面的结果
```
- #### 深拷贝与浅拷贝 参考：[javaScript中浅拷贝和深拷贝的实现](https://github.com/wengjq/Blog/issues/3)

    ##### 首先纠正自己的错误，之前以为浅拷贝是这样：

    ```var arr = []```

    ```var temp = arr```

    ##### 大错特错了，参考：[JavaScript中对内存的一些了解](http://www.cnblogs.com/ys-ys/p/5300189.html)、[栈内存or堆内存](http://blog.csdn.net/xdd19910505/article/details/41900693)


    首先，堆栈及对应的'存储物'

        栈(stack)内存：存放存储对象的地址
        特点：运行速度高，空间小（这是个通行啊，以后这种类似的就可以用同一种思维思考

        堆(heap)内存：存储对象的具体内容
        特点： 运行速度慢，空间大

    ##### 再，基本类型和引用类型

        概念：
        基本类型：Undefined、Null、Boolean、Number、String、Symbol (new in ES 6)
        引用类型：非基本类型，Object 类型、Array 类型、Date 类型、RegExp 类型、Function 类型 等。

        基本类型：没有地址，不过我更愿意理解为基本类型的地址和值都存储在栈，赋值会直接分配新空间
        为什么：因为基本类型都是固定的，简单的，体积小的存到栈内，不影响效率，并且取得时候很快

        引用类型：地址存储在栈，具体内容存储在堆内存，赋值只会把地址赋过去
        为什么：地址是体积小的，固定的，简单的，而引用类型的内容是体积大的，不固定的，复杂的，正符合堆的特点
        补充：这里面还涉及垃圾回收机制---
        因为是具体内容存在堆内存中，只要有任何一个地址指向该内容，那么就该内容就会一直存在于堆，否则便会销毁

    ##### 然后说回深浅拷贝：（实现一个深拷贝）

        浅拷贝：赋值对象或者对象的第一层key或者索引
        深拷贝: 递归以上上面操作，直至获取的每一个值都是基本类型
        深拷贝的特例：JSON.parse(JSON.stringify(obj))，该操作也能深拷贝---  
        但是对于值为函数，null，或者正则等会忽略，不过也能满足基本的深拷贝了


- #### 为什么 '0' == false 为真，但是'0'在if中却可以通过
参考：[In JavaScript, why is “0” equal to false, but when tested by 'if' it is not false by itself?](https://stackoverflow.com/questions/7615214/in-javascript-why-is-0-equal-to-false-but-when-tested-by-if-it-is-not-fals)    
    因为==比较的时候会发生隐式转换，都会变成Number，在进行比较     
    而在if中会隐式转换成布尔值，所以非空字符串为真

- #### 为什么会有 0 和 -0 以及为什么 0 === -0 为true
参考：  
[==与===在JS语言规范中都进行了那些操作](http://www.ecma-international.org/ecma-262/8.0/#sec-abstract-equality-comparison)
[JavaScript中的两个0](http://www.cnblogs.com/ziyunfei/archive/2012/12/10/2777099.html)    
[js内部对===做的处理](https://stackoverflow.com/questions/7223359/are-0-and-0-the-same)   

    ##### 首先，解释为什么会有0和-0    
    例子：    
    二进制的1010表示十进制的−2    
    二进制的0010表示十进制的+2    
    那么这就意味着1000 => -0，0000 => 0    
    所以会有正负0之分，而JS也做了不少工作来故意隐藏存在两个0这一情况    
    ##### 接下来，根据es2017语言规范，得到=== 和 == 在js内部都运行步骤    
    - a === b    
        如果a和b的类型不同，返回false    
        如果a是数字类型，那么    
        - 如果a是NaN，返回false
        - 如果b是NaN，返回false
        - 如果a的值和b的值相同，返回true
        - 如果a是0，b是-0，返回真(这就是为什么0 === -0的原因)
        - 如果a是-0，b是0，返回真(这就是为什么0 === -0的原因)
        - 都不满足，返回false   

        返回内部方法SameValueNonNumber(a, b)的结果(点到为止)

    - a == b
        如果a、b的类型相同，那么返回执行a === b比较的结果   
        如果a是null，b是，返回true   
        如果a是undefined，b是null，返回true   
        如果a是数字，b是字符串，将b转为数字，返回比较结果   
        如果a是字符串，b是数字，将a转为数字，返回比较结果   
        如果a是布尔值，将a转为布尔值对应的值，返回比较结果   
        如果b是布尔值，将b转为布尔值对应的值，返回比较结果   
        如果a是字符串、数字、Symbol其中之一，b是对象，取b的primitive，返回比较结果   
        如果a是对象，b是字符串、数字、Symbol其中之一，取a的primitive，返回比较结果   
        都不满足，返回false   

    ##### 看了以上内容，也就清楚为什么 0 === -0了，虽然两者实际不等

- #### 为什么 0 == null 是 false？ 

    参考：[js中0 == null为何是false](https://www.zhihu.com/question/52666420)    
    因为==中没有做null的处理，即使Number(null) === 0也不会做类型转换

- #### 那为什么 null >= 0 或者 0 >= null 为真呢？

    参考：[JavaScript中为什么null==0为false而null>=0为true](http://blog.csdn.net/lee_magnum/article/details/11181271)      
    两个猜测答案：

    - '>=' 或者 '<='会处理null的情况，也就是会发生隐式类型转换操作   
    - 进行大小比较的时候，null `>=` | `<=` 0 会取反向结果来验证的，也就是  null `<` | `>` 0，而JS中在'<'或者'>'的情况下没有处理null的情况，所以不会发生隐式转换，所以返回false，取反就是true了
    - 不做深入研究

- #### Object.keys不会获取原型上的key，for...in会获取原型上的key，其他的等需要的时候再做笔记吧

- #### 不算鸡汤的鸡汤

    学习精神可嘉！    
    有时候没有必要纠结这些,因为这种东西记得越多,你学习其它语言越困难.以下:     
    JS："" == 0 返回true    
    Ruby："" == 0 返回false    
    根据个人情况来定就好了



