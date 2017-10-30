### 我觉得他是个工具，那他就是工具(工具方法

-------

- ```restArgs(func, startIndex)```：将func的第startIndex函数之后的所有参数归为rest参数重新传入
- ```baseCreate(prototype)```：创建一个继承自prototype的对象
- ```shallowProperty(key)```：返回一个函数，接受一个obj参数，不为空则返回obj[key],否则返回undefined(void 0)，这是一个浅复制
- ```deepGet(obj, path)```：当path为数组，且长度为1的时候，返回obj[path[0]]
- ```isArrayLike(collection)```：判断是否为类数组对象（集合）

------
##### 以上为非```Utility Functions```部分的工具方法，下面为```Utility Functions```内的方法
-------

- ```noConflict()```：解放对_变量的使用，返回_构造函数
- ```identity(value)```：默认的迭代器，直接返回value
- ```constant(value)```：将value参数const化，调用返回value
- ```noop()```：函如其名，返回undefined
- ```property(path(key))```：获取对象的某个key|某些key的属性
- ```propertyOf(obj)```：获取对象的某个key|某些key的属性，与property传参的方式相反
- ```matcher(attrs)```：判断对象是否具有attrs键值对
- ```times(n, iteratee, context)```：执行n次iteratee
- ```random(min, max)```：返回min~max(包括这两个值)的一个随机数
- ```now()```：返回当前时间戳
- ```escape()```：转译html，避免XSS攻击
- ```unescape()```：反转译
- ```result(obj, key, defaultValue)```：如果obj[key]存在则返回或者调用，否则返回defaultValue。当key为空数组时，defaultValue为函数时.call(obj)，否则返回defaultValue
- ```uniqueId(prefix)```：返回唯一id，可附加前缀，常用于DOM的ID
- ```template(text, settings, oldSettings)```: 生成模板的函数..




----------

### '补充医疗保险'

- 对象序列化的作用：
    + 以某种存储形式使自定义对象持久化，我理解为可以存储在磁盘中，而不是电脑的内存，所以没电了也不会保留，不会丢失
    + 将对象从一个地方传递到另一个地方，比如http协议就是先对象序列化，再反序列化
    + 使程序更加可维护
    + 使用 ```JSON.stringify``` 序列化，使用 ```JSON.parse``` 反序列化
- 什么是可以序列化的对象：
    + 说白了，主要依据对象内各个属性的```enumerable（枚举）```属性，如果为true，那么可序列化，否则不可
    + 类似的会受```enumerable```影响的包括：
        * ```for...in```
        * ```Object.keys```
        * 不知道了
        * [可参考](https://blog.gaoqixhb.com/p/5593f72f69112b794b3f0c14)

