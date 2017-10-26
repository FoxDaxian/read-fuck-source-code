### optimizeCb && cb

-------

    对于我来说这两个函数理解起来是有障碍的，如果这两个函数理解了，我觉得接下来的应该会好理解一点吧，所以也在这上面下了一些功夫，记录下我的理解和看法：

#### OptimizeCb

    
```javascript
/**
 * [optimizeCb 优化函数]
 * @param  {Function} func       等待处理的回调函数
 * @param  {Object}   context    上下文环境，call，apply用
 * @param  {Number}   argCount   根据这个参数来判断如何处理回调函数 
 * @return {Function}            优化好的回调函数
 */
var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    // call 比 apply 效率高哦
    switch (argCount) {
        case 1:
            return function(value) {
                return func.call(context, value);
            };
            // The 2-parameter case has been omitted only because no current consumers
            // made use of it.
        case null:
        case 3:
            return function(value, index, collection) {
                return func.call(context, value, index, collection);
            };
        case 4:
            return function(accumulator, value, index, collection) {
                return func.call(context, accumulator, value, index, collection);
            };
    }
    return function() {
        return func.apply(context, arguments);
    };
};
```
一步步的解释并记录一下：

1. 参数的大概含义写在函数注释上了，函数内也有部分注释，自行查看
+ 当context函数为空的时候，直接返回func，这里使用void 0 代替undefined，防止非window作用域下undefiend被重写，并且void 0是效率最高的
+ 根据argCount来判断优化后的回调函数参数的个数
    - 为1的时候直接将value传入即可，相当于迭代过程中，我们只需要值
    - 为2的情况目前没有被用到，所以当前版本被忽略了，改为null，并且switch内判断为```===```，所以argCount为空也不会进入这里
    - 为3的时候，相当于```forEach```、```map```等的回调函数参数形式：值、索引，被迭代的list
    - 为4的时候，第一个参数为累加器，所以用于类似```reduce```这样的方法中
    - 如果都不满足，直接绑定上下文，并将所以参数传入（附注：call比apply快很多）
+ 总的来说就是一个绑定上下文，处理不同情况的回调函数的一个函数

#### cb
```javascript
/**
 * 无敌万能处理生成回调大法
 * @param  String|Array|Object|Function|Undefined   value    被处理的一个字符串|对象|函数
 * @param  Object   context  上下文
 * @param  Number   argCount 回调函数参数个数|处理方式的先决条件
 * @return Function          被无敌万能处理生成回调大法处理好的回调函数
 */
var cb = function(value, context, argCount) {
    // 这里的作用是为了让用户可以自定义_.iteratee，这里不做过多解释
    if (_.iteratee !== builtinIteratee) return _.iteratee(value, context);
    // 如果value为空，那么_.identity =>直接返回传入的参数
    if (value == null) return _.identity;
    // 如果value是函数，那么返回被优化过的函数/迭代器
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    // 如果是对象 并且 不是数组，那就返回一个函数，传入一个对象，返回的函数判断传入的对象是否包含value中的的键值对
    if (_.isObject(value) && !_.isArray(value)) return _.matcher(value);
    // 返回函数，参数为对象，返回 对象[value]
    return _.property(value);
};
```
一步步的解释并记录一下：

1. 参数的大概含义写在函数注释上了，函数内也有部分注释，自行查看
2. 第一行代码不做解释
3. 如果value未定义，那么返回一个直接返回参数的函数，去源代码自己找_.identity
4. 如果value为函数，那么对它进行优化
5. 如果value为对象且仅为非数组|函数的对象，返回一个matcher，在matcher中，会先对value进行underscore自己实现的类似hasOwnProperty的操作，然后返回一个需要传入对象参数的函数，用户传入参数就会判断该对象是否包含和value相同的键值对，如果相同返回true，否则返回false
6. 否则value可取的为字符串和数组，那进行简单的根据key取对象的值，不过当value数组的时候，长度只能为1，否则返回结果为undefined

-----------------

### '补充医疗保险'

1. 注意：obj[key]这里的key会执行toString方法，obj[[['name']]] => obj['name']
