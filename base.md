### 轮廓和基础

-------

- underscore一上来以一个IIFE(避免污染环境+惰性函数)包裹全部
- 根据[浏览器专属的self](http://www.itdadao.com/articles/c15a1311362p0.html)、global、this来判断当前环境都不符合就返回一个新的空对象
- 一个变量```previousUnderscore```存储之前的_的值，以便后面noConflict使用，防止_冲突
- 提取```数组```、```对象```、```Symbol（如果存在，否则返回null）```的引用，在压缩版本下节约字节
- 创建几个快速refer，提高访问速度，如```push```、```hasOwnProperty```等
- 存储原生实现的一些方法，如```isArray```，以便后面判断及使用
- 创建Ctor，一个干净的、无副作用的空函数，用来赋值prototype并创建实例以继承其他，最后清除指向
- 创建一个适中返回underscore实例的方法，之后会为该方法的原型上添加underscore的各种方法，见underscore.own.js的```1687~1749```行的mixin方法，该方法也可以让使用者自己扩展underscore
```javascript
var _ = function(obj) {
        // 如果当前对象是_的实例，那就返回
        if (obj instanceof _) return obj;
        // 如果当前this不是_的实例，那么new一个新的，new操作会导致函数内this指向当前构造函数
        if (!(this instanceof _)) return new _(obj);
        // 为了支持面向对象(即: new)操作模式，将对this._wrapped进行操作
        // 会将this._wrapped赋到大多数方法的第一个参数
        this._wrapped = obj;
    };
```
- 导出underscore
- 设置underscore当前版本
- 各种方法巴拉巴拉..........
- 1760行开始：支持AMD导入
- end

----------

### '补充医疗保险'

1. new的时候进行了什么？

    1. 一个新对象被创建。它继承自被new构造函数的prototype
    2. 构造函数被执行，执行的时候，相应参数被传入，```同时上下文(this)会被指定为这个新实例。```如果当前构造函数没有参数，那么 new foo() === new foo
    3. 如果构造函数返回了一个```对象```，那么这个对象会替代整个new出来的结果，如果构造函数没有返回```对象```,那么new出来的结果为步骤一创建的对象。一般情况下是没有必要的，但是如果你想覆盖这个返回值，可以用对象或者数组甚至函数来代替。
