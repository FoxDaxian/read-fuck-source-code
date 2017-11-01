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

- 




