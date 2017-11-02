### Collection Functions

-------

- ```_.each()```：相当于JS原生的forEach，不过可以处理类数组对象
- ```_.map()```：迭代集合中每个元素，返回一个新数组
- ```_.reduce()```：左起累加函数
- ```_.reduceRight()```：右起累加函数

```javascript
    // reduce生成器
    var createReduce = function(dir) {
        var reducer = function(obj, iteratee, memo, initial) {
            // 巧妙地运用了 逻辑或，如果obj是不是类数组对象，那么返回_.keys(obj)，如果是类数组对象，返回false
            // 下面的length根据keys的结果获取长度
            var keys = !isArrayLike(obj) && _.keys(obj),
                length = (keys || obj).length,
                index = dir > 0 ? 0 : length - 1;
            // 如果累加器没有初始值，那么取obj第一个元素，并设置index
            if (!initial) {
                memo = obj[keys ? keys[index] : index];
                index += dir;
            }
            // for循环，一次调用迭代器，第一个参数为memo（缓存之前结果），所以一次加上去，再重新赋给memo
            for (; index >= 0 && index < length; index += dir) {
                var currentKey = keys ? keys[index] : index;
                memo = iteratee(memo, obj[currentKey], currentKey, obj);
            }
            return memo;
        };
        // 闭包，返回对应的reduce
        return function(obj, iteratee, memo, context) {
            var initial = arguments.length >= 3;
            return reducer(obj, optimizeCb(iteratee, context, 4), memo, initial);
        };
    };

```
- ```_.find()```：返回第一个通过断言测试的值
- ```_.filter()```：返回所有通过断言测试的值
- ```_.reject()```：返回所有未通过断言测试的值
- ```_.every()```：集合中所有的值都通过断言测试，才返回true
- ```_.some()```：集合中至少一个值通过断言测试，就返回true
- ```_.contains(obj, item, [fromIndex, guard])```：判断集合中每一个值是否包括item，fromIndex表示从哪开始
- ```_.invoke(obj, path, args)```：如果path是函数，那么直接调用，并把剩余参数传入，否则判断obj[path]是不是方法，是则调用，同样把args传入
- ```_.pluck()```：获取集合中每一个上的key属性
- ```_.where(obj, attrs)```：返回集合中所有包含attrs的键值对
- ```_.findWhere(obj, attrs)```：返回集合中第一个包含attrs的键值对
- ```_.max()```：(根据迭代器)返回集合中的最大值
- ```_.min()```：(根据迭代器)返回集合中的最大值
- ```_.shuffle()```：获取乱序的集合，依靠```_.sample()```
- ```_.sample()```：获取n(默认为1)个随机副本集合
- ```_.sortBy()```：根据迭代器排序，原理为：先重构集合结构，每个值变为```value```、```index```、```criteria（迭代器返回值）```，然后根据迭代器返回值排序，最后返回排序后的value，就完成了sortBy功能
- ```_.groupBy()```：根据迭代器分组
- ```_.indexBy()```：和groupBy相同，不过仅当集合中没有相同的key才可以使用
- ```_.countBy()```：获取不同分类的数量的计数
- ```_.partition()```：将集合分成通过和不通过断言两组势力
```javascript
    // group函数，产出以上四个函数
    // behavior为对每个结果如何处理的行为
    // partition仅仅用于 partition 函数，用于初始化result为一个包含两个空数组的二维数组（对立）
    var group = function(behavior, partition) {
        return function(obj, iteratee, context) {
            // 初始化result，这里面的数组用于_.partition_使用，result[0]和 result[1]
            var result = partition ? [
                [],
                []
            ] : {};
            // 处理回调函数
            // iteratee返回的值会在下面充当key
            iteratee = cb(iteratee, context);
            // 循环
            _.each(obj, function(value, index) {
                // 判断当前key符合不符合用户给的断言
                var key = iteratee(value, index, obj);
                // 用不同的行为处理
                behavior(result, value, key);
            });
            return result;
        };
    };

```
- ```_.toArray()```：转换成数组，用到reStrSymbol参数，```var reStrSymbol = /[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;```，详见注释
- ```_.size()```：获取集合的长度

----------

### '补充医疗保险'

- 使用```JSON.parse(JSON.stringify(obj))```深拷贝（不复制引用）的时候，对象中value为```Function```或者```undefined```等会被忽略
- ```underscore```中的所有```guard``参数都是为了保护当前函数的尊严，如果你想让该函数做好自己，那么请设置其为true
