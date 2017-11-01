### Function Functions

-------

- 内部方法，用于绑定this：```executeBound```
```javascript
// 内部会根据callingContext（执行时候的上下文环境）和boundFunc来判断是不是new操作
// 根据该结果来决定下一步操作
var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    // 如果执行时候的环境上下文是bounFunc的实例，那么直接返回
    // 根据执行时候this(callingContext)的指向判断是否为是new操作
    // 其实也就是非new的情况下，因为调用函数的时候，new才会使 this 指向当前函数
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    // new 的情况下
    // 创造一个继承自sourceFunc.prototype的对象
    var self = baseCreate(sourceFunc.prototype);
    // 获取结果
    var result = sourceFunc.apply(self, args);
    // 如果返回的值是个对象，就会覆盖new操作返回的对象，所以直接返回result，否则，返回 self，这个才是new流程走下来的结果，可参考下面链接
    // 参考链接：#http://www.cnblogs.com/zichi/p/4392944.html
    if (_.isObject(result)) return result;
    // 返回创造的原型链为 sourceFunc.prototype 的对象
    return self;
};
```
- ```_.bind()```：就和原生的bind差不多
- ```_.partial(func, boundArgs(rest))```：预设参数，可传入_来忽略当前参数
- ```_.bindAll(obj, keys)```：将obj上的这些keys的this永久绑定在obj上
- ```_.memoize(func, hasher)```：缓存方法执行的结果，可用于大量重复计算，提高效率
- ```_.delay(func, wait, args)```：延迟wait后执行
- ```_.defer(func)```：运用_.partial函数，wait传的是1ms，所以就是个小异步函数
- ```_.throttle(func, wait, options)```：节流，一定时间内不会一直触发，而是有节奏的触发，option可以设定第一个或者最后一次是否需要触发
- ```_.debounce(func, wait, immediate)```：防抖，当一系列操作执行完毕后，才会执行func，immediate设置func在操作之前触发，还是之后触发
- ```_.wrap(func, wrapper)```：将func传到wrapper中
- ```_.negate(predicate)```：返回一个与predicate断言相反的结果
- ```_.compose()```：内部参数获取方法为：arguments。用处：从最后一个函数开始（最后一个函数可以接受参数），一次将上一个函数的结果作为参数，传到下一个函数内
- ```_.after(times, func)```：times次之后执行func
- ```_.before(times, func)```：times次之前能执行func，并把每次执行的结果保存在一个闭包变量中，即使不能执行了，也可以获取最后一次执行的结果
- ```_.once(func)```：就只能调用一次
- ```_.restArgs(func, startIndex)```：重构函数参数，从第startIndex开始将剩余参数合并到rest，如果没传startIndex，那么startIndex为arguments.length - 1

----------

### '补充医疗保险'

- instanceof：[参考链接1](https://www.ibm.com/developerworks/cn/web/1306_jiangjj_jsinstanceof/index.html)、[参考链接2](http://www.cnblogs.com/fool/archive/2010/10/14/1850910.html)
```javascript
    // instanceof会沿着原型链找，如果相同在是该构造函数的实例
    // 不过对原型链为null的构造函数使用，会报错，例如
    function Person () {}
    Person.prototype = null
    var person = new Person()
    console.log(person instanceof Person)
    // 报错
    // Uncaught TypeError: Function has non-object prototype 'null' in instanceof check at Function.[Symbol.hasInstance] (<anonymous>)
```
- 定时器tips
```javascript
    // 每个定时器都会返回一个唯一的ID，从1开始递增（不过不一定都是从1开始）
    // 可以通过返回的ID来清除对应的定时器，比如
    var st = setTimeout(function() {
        // do someThing
    }, 1000)
    clearTimeout(st)
    // 如果你知道定时器会返回什么ID，甚至可以直接传该ID，谷歌浏览器下st会1
    clearTimeout(1)
```




