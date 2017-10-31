//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2017 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

    //一上来就是一个大IIFE，防止污染全局变量，典型闭包

    // Baseline setup
    // --------------

    // Establish the root object, `window` (`self`) in the browser, `global`
    // on the server, or `this` in some virtual machines. We use `self`
    // instead of `window` for `WebWorker` support.

    // 优先级 && > ||
    // self 指当前窗口
    // this 指当前对象
    // 浏览器 self
    // 服务端 global
    // 虚拟机 this
    // 都没有新建空对象{}
    var root = typeof self == 'object' && self.self === self && self ||
        typeof global == 'object' && global.global === global && global ||
        this || {};

    // Save the previous value of the `_` variable.

    // 防止命名冲突，提前存储一下，为了noConflict中使用
    var previousUnderscore = root._;

    // Save bytes in the minified (but not gzipped) version:

    // 节省字节在压缩版本下
    var ArrayProto = Array.prototype,
        ObjProto = Object.prototype;
    var SymbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

    // Create quick reference variables for speed access to core prototypes.

    // 创建快速指向，提高访问速度
    var push = ArrayProto.push,
        slice = ArrayProto.slice,
        toString = ObjProto.toString,
        hasOwnProperty = ObjProto.hasOwnProperty;

    // All **ECMAScript 5** native function implementations that we hope to use
    // are declared here.

    // 如果有原生的实现，就用原生的
    var nativeIsArray = Array.isArray,
        nativeKeys = Object.keys,
        nativeCreate = Object.create;

    // Naked function reference for surrogate-prototype-swapping.

    // 代孕，对不起，我想歪了
    var Ctor = function() {};

    // Create a safe reference to the Underscore object for use below.

    // 这一块为了不管外部时候执行new操作，都返回一个new操作之后的实例对象
    var _ = function(obj) {
        if (obj instanceof _) return obj;
        if (!(this instanceof _)) return new _(obj);
        // 为了支持面向对象(即: new)操作模式，将对this._wrapped进行操作
        // 会将this._wrapped赋到大多数方法的第一个参数
        this._wrapped = obj;
    };

    // Export the Underscore object for **Node.js**, with
    // backwards-compatibility for their old module API. If we're in
    // the browser, add `_` as a global object.
    // (`nodeType` is checked to ensure that `module`
    // and `exports` are not HTML elements.)

    // 就导出啦
    if (typeof exports != 'undefined' && !exports.nodeType) {
        if (typeof module != 'undefined' && !module.nodeType && module.exports) {
            exports = module.exports = _;
        }
        exports._ = _;
    } else {
        root._ = _;
    }

    // Current version.

    // emmmmmm...
    _.VERSION = '1.8.3';

    // Internal function that returns an efficient (for current engines) version
    // of the passed-in callback, to be repeatedly applied in other Underscore
    // functions.

    // 字面意思优化回调函数
    var optimizeCb = function(func, context, argCount) {
        if (context === void 0) return func;
        // switch 中比较是 ===, 所以这里的case并不会触发，仅仅是忽略了，如果是 == 那么 null 等于 undefined
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

    // 内置的iteratee，用来判断 _.iteratee 是否被重写，闭包，外部获取不到，所以相当于const了
    var builtinIteratee;

    // An internal function to generate callbacks that can be applied to each
    // element in a collection, returning the desired result — either `identity`,
    // an arbitrary callback, a property matcher, or a property accessor.

    // 无敌万能处理生成回调大法，反正就是不管value传什么，都尽量返回一个合理的回调
    // 可以参考这里的解释: #https://juejin.im/entry/59b4a3295188257e7e1153ef
    var cb = function(value, context, argCount) {
        // 如果 _.iteratee 不等于 builtinIteratee，说明 _.iteratee 被重写，调用被重写后的_.iteratee
        if (_.iteratee !== builtinIteratee) return _.iteratee(value, context);
        // 如果value为空，那么_.identity，直接返回传入的参数
        if (value == null) return _.identity;
        // 如果value是函数，那么返回被优化过的函数/迭代器
        if (_.isFunction(value)) return optimizeCb(value, context, argCount);
        // 如果是对象 | 函数 并且 不是数组，那就返回一个函数，传入一个对象，返回的函数判断传入的对象是否包含attrs的键值对
        // 这里传入函数也会被_.isObject判定为对象，不过会被之前的_.isFunction拦截
        if (_.isObject(value) && !_.isArray(value)) return _.matcher(value);
        // 返回函数，参数为对象，返回  -> 对象[value]
        return _.property(value);
    };

    // External wrapper for our callback generator. Users may customize
    // `_.iteratee` if they want additional predicate/iteratee shorthand styles.
    // This abstraction hides the internal-only argCount argument.

    // 将 _ 的iteratee 存在内置变量上，以供之后判断是否被用户重写
    _.iteratee = builtinIteratee = function(value, context) {
        return cb(value, context, Infinity);
    };

    // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
    // This accumulates the arguments passed into an array, after a given index.

    // 将func的第startIndex函数之后的所有参数归为rest参数重新传入
    var restArgs = function(func, startIndex) {
        // 如果startIndex为空，则替换为func的长度 - 1，因为数组从0开始，不为空则数字化
        startIndex = startIndex == null ? func.length - 1 : +startIndex;
        return function() {
            // 返回函数传进来的参数个数 - 使用者设定的startIndex 并和0比较取最大值
            var length = Math.max(arguments.length - startIndex, 0),
                rest = Array(length),
                index = 0;
            for (; index < length; index++) {
                // 塞满rest数组，rest内的为startIndex之后的所有参数
                rest[index] = arguments[index + startIndex];
            }
            // 如果startIndex小于3，那么使用call，还是因为call比apply快
            switch (startIndex) {
                case 0:
                    return func.call(this, rest);
                case 1:
                    return func.call(this, arguments[0], rest);
                case 2:
                    return func.call(this, arguments[0], arguments[1], rest);
            }
            // 大于2的时候就处理所有的参数，下面的+1是为了给rest留个位置
            var args = Array(startIndex + 1);
            for (index = 0; index < startIndex; index++) {
                // 除了startIndex之外的，之前的位置按部就班
                args[index] = arguments[index];
            }
            // 放置rest
            args[startIndex] = rest;
            // 调用apply，将所有参数传入
            return func.apply(this, args);
        };
    };

    // An internal function for creating a new object that inherits from another.

    // 创建一个继承自prototype的对象
    var baseCreate = function(prototype) {
        // 如果prototype不是对象，返回一个空对象
        if (!_.isObject(prototype)) return {};
        // 如果原生支持Object.create，则调用
        if (nativeCreate) return nativeCreate(prototype);
        // 利用'代孕'构造函数，制作一个继承自prototype的对象
        Ctor.prototype = prototype;
        var result = new Ctor;
        // 手动释放内存，cause闭包引用
        Ctor.prototype = null;
        return result;
    };

    // 闭包，存储了key，返回一个函数，接受一个obj，不为空则返回obj[key]
    //  '浅获取'
    var shallowProperty = function(key) {
        return function(obj) {
            return obj == null ? void 0 : obj[key];
        };
    };

    // 当path为数组，且长度为1的时候，返回obj对应的path[0]的值
    var deepGet = function(obj, path) {
        var length = path.length;
        for (var i = 0; i < length; i++) {
            // 直接在一开始判断不就得了....
            if (obj == null) return void 0;
            // 只有path是长度为1的数组的时候才行，不能再最上面判断长度么？大于1就直接返回 void 0
            obj = obj[path[i]];
        }
        // 这里也在一开始直接判断了不好么....
        return length ? obj : void 0;
    };

    // Helper for collection methods to determine whether a collection
    // should be iterated as an array or as an object.
    // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
    // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094


    // Math.pow(2, 53) - 1 是 JavaScript 中能精确表示的最大数字
    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
    // 返回一个获取参数(likeArrayList)的.length的函数
    var getLength = shallowProperty('length');
    // 判断是否是类数组集合，根据length判断
    var isArrayLike = function(collection) {
        var length = getLength(collection);
        return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
    };

    // -------------------------------------------------------------------------------------
    // -----------------------------------分界线---------------------------------------------
    // -------------------------------------------------------------------------------------

    // Collection Functions
    // 集合方法部分
    // --------------------

    // The cornerstone, an `each` implementation, aka `forEach`.
    // Handles raw objects in addition to array-likes. Treats all
    // sparse array-likes as if they were dense.

    // 就相当于forEach
    _.each = _.forEach = function(obj, iteratee, context) {
        // 当context未定义的时候，直接返回iteratee，否则返回绑定到context的函数
        iteratee = optimizeCb(iteratee, context);
        var i, length;
        // 如果是数组，就正常for循环，并将数组的每一组传入
        // iteratee（el, i, list）参数，这就是为啥forEach这种可以获取当前元素，当前索引，被迭代的循环的原因
        if (isArrayLike(obj)) {
            for (i = 0, length = obj.length; i < length; i++) {
                iteratee(obj[i], i, obj);
            }
            // 如果不是类数组对象，那么获取obj的所有键值，然后和以上同理
        } else {
            var keys = _.keys(obj);
            for (i = 0, length = keys.length; i < length; i++) {
                iteratee(obj[keys[i]], keys[i], obj);
            }
        }
        // 这个或许为了链式调用吧
        return obj;
    };

    // Return the results of applying the iteratee to each element.

    // 迭代集合中每个元素并调用iteratee，返回一个处理后的新的数组
    _.map = _.collect = function(obj, iteratee, context) {
        // 优化迭代器
        iteratee = cb(iteratee, context);
        // 如果不是数组，那么返回key的数组，如果是数组，返回false
        var keys = !isArrayLike(obj) && _.keys(obj),
            // 获取obj的长度
            length = (keys || obj).length,
            // 预先定义数组长度，提高性能，以免循环的时候每次都先设置长度，再设置值
            results = Array(length);
        for (var index = 0; index < length; index++) {
            // 数组就是false,不然就是对象
            var currentKey = keys ? keys[index] : index;
            results[index] = iteratee(obj[currentKey], currentKey, obj);
        }
        return results;
    };

    // Create a reducing function iterating left or right.

    // 创建一个可左可右的reduce工厂函数
    var createReduce = function(dir) {
        // Wrap code that reassigns argument variables in a separate function than
        // the one that accesses `arguments.length` to avoid a perf hit. (#1991)


        var reducer = function(obj, iteratee, memo, initial) {
            // 分类 && 根据dir分类
            var keys = !isArrayLike(obj) && _.keys(obj),
                length = (keys || obj).length,
                index = dir > 0 ? 0 : length - 1;
            // 如果reduce参数长度大于等于3，那么为false，否则为true
            // 进去的话，就说明没有初始值，那么设置初始值为obj的第一个value，然后改变index，再用下面的for循环
            if (!initial) {
                // 设置memo初始值
                memo = obj[keys ? keys[index] : index];
                index += dir;
            }
            for (; index >= 0 && index < length; index += dir) {
                var currentKey = keys ? keys[index] : index;
                memo = iteratee(memo, obj[currentKey], currentKey, obj);
            }
            // 返回sum
            return memo;
        };

        return function(obj, iteratee, memo, context) {
            // 如果参数长度大于等于3，那么说明传入了初始值
            var initial = arguments.length >= 3;
            return reducer(obj, optimizeCb(iteratee, context, 4), memo, initial);
        };
    };

    // **Reduce** builds up a single result from a list of values, aka `inject`,
    // or `foldl`.

    // 正向reduce
    _.reduce = _.foldl = _.inject = createReduce(1);

    // The right-associative version of reduce, also known as `foldr`.

    // 反向reduce
    _.reduceRight = _.foldr = createReduce(-1);

    // Return the first value which passes a truth test. Aliased as `detect`.

    // 寻找/检测，返回第一个通过测试的值
    _.find = _.detect = function(obj, predicate, context) {
        // 根据类型获取处理OBJ的对应方法
        var keyFinder = isArrayLike(obj) ? _.findIndex : _.findKey;
        // 测试
        var key = keyFinder(obj, predicate, context);
        // 有的话就返回
        if (key !== void 0 && key !== -1) return obj[key];
    };

    // Return all the elements that pass a truth test.
    // Aliased as `select`.

    // 返回所有通过测试的值
    _.filter = _.select = function(obj, predicate, context) {
        // 结果集合
        var results = [];
        // 大法
        predicate = cb(predicate, context);
        // 遍历，通过则吧返回值添加到结果中
        _.each(obj, function(value, index, list) {
            if (predicate(value, index, list)) results.push(value);
        });
        return results;
    };

    // Return all the elements for which a truth test fails.

    // 和filter相反
    _.reject = function(obj, predicate, context) {
        return _.filter(obj, _.negate(cb(predicate)), context);
    };

    // Determine whether all of the elements match a truth test.
    // Aliased as `all`.

    // 是不是每一个都通过测试，是则返回true，否则返回false
    _.every = _.all = function(obj, predicate, context) {
        predicate = cb(predicate, context);
        var keys = !isArrayLike(obj) && _.keys(obj),
            length = (keys || obj).length;
        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            // 如果断言失败，则取反
            if (!predicate(obj[currentKey], currentKey, obj)) return false;
        }
        return true;
    };

    // Determine if at least one element in the object matches a truth test.
    // Aliased as `any`.

    // 如果有一个断言通过，则OK
    _.some = _.any = function(obj, predicate, context) {
        predicate = cb(predicate, context);
        var keys = !isArrayLike(obj) && _.keys(obj),
            length = (keys || obj).length;
        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            // 有一个断言通过，返回true
            if (predicate(obj[currentKey], currentKey, obj)) return true;
        }
        return false;
    };

    // Determine if the array or object contains a given item (using `===`).
    // Aliased as `includes` and `include`.

    // 判断数组或者对象是否包含给定的item，使用'==='判断
    _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
        if (!isArrayLike(obj)) obj = _.values(obj);
        if (typeof fromIndex != 'number' || guard) fromIndex = 0;
        return _.indexOf(obj, item, fromIndex) >= 0;
    };

    // Invoke a method (with arguments) on every item in a collection.

    // 调用collection中的方法
    // 利用restArgs工具方法，获取包括第三个参数的剩余所有参数
    _.invoke = restArgs(function(obj, path, args) {
        var contextPath, func;
        // 如果是函数
        if (_.isFunction(path)) {
            func = path;
            // 如果是数组
        } else if (_.isArray(path)) {
            // 获取除最后一个的所有，返回一个数组
            contextPath = path.slice(0, -1);
            // 单独获取最后一个
            path = path[path.length - 1];
        }
        // map 可以循环任何类数组对象，也就是集合
        return _.map(obj, function(context) {
            var method = func;
            if (!method) {
                if (contextPath && contextPath.length) {
                    // deepGet 只能获取长度为1的数组内容
                    context = deepGet(context, contextPath);
                }
                if (context == null) return void 0;
                method = context[path];
            }
            return method == null ? method : method.apply(context, args);
        });
    });

    // Convenience version of a common use case of `map`: fetching a property.

    // 获取obj上的key属性
    _.pluck = function(obj, key) {
        return _.map(obj, _.property(key));
    };

    // Convenience version of a common use case of `filter`: selecting only objects
    // containing specific `key:value` pairs.

    // 筛选出数组中包含attrs的键值对
    _.where = function(obj, attrs) {
        return _.filter(obj, _.matcher(attrs));
    };

    // Convenience version of a common use case of `find`: getting the first object
    // containing specific `key:value` pairs.

    // 找到第一个符合的
    _.findWhere = function(obj, attrs) {
        return _.find(obj, _.matcher(attrs));
    };

    // Return the maximum element (or element-based computation).

    // 获取类数组对象中的最大值
    _.max = function(obj, iteratee, context) {
        // 创建一个最小的result: -Infinity
        var result = -Infinity,
            lastComputed = -Infinity,
            value, computed;
        // 如果没有迭代器，并且obj内不包含数组，也就是包含数字的时候，直接用比result大的值覆盖result
        if (iteratee == null || (typeof iteratee == 'number' && typeof obj[0] != 'object') && obj != null) {
            obj = isArrayLike(obj) ? obj : _.values(obj);
            for (var i = 0, length = obj.length; i < length; i++) {
                value = obj[i];
                if (value != null && value > result) {
                    result = value;
                }
            }
        } else {
            iteratee = cb(iteratee, context);
            _.each(obj, function(v, index, list) {
                computed = iteratee(v, index, list);
                // && 优先级高于 ||，但是这里的 || 后面的判断是不是有点多余了
                if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
                    result = v;
                    lastComputed = computed;
                }
            });
        }
        return result;
    };

    // Return the minimum element (or element-based computation).

    // 获取类数组对象中的最小值，和_.max相反的逻辑
    _.min = function(obj, iteratee, context) {
        var result = Infinity,
            lastComputed = Infinity,
            value, computed;
        if (iteratee == null || (typeof iteratee == 'number' && typeof obj[0] != 'object') && obj != null) {
            obj = isArrayLike(obj) ? obj : _.values(obj);
            for (var i = 0, length = obj.length; i < length; i++) {
                value = obj[i];
                if (value != null && value < result) {
                    result = value;
                }
            }
        } else {
            iteratee = cb(iteratee, context);
            _.each(obj, function(v, index, list) {
                computed = iteratee(v, index, list);
                if (computed < lastComputed || computed === Infinity && result === Infinity) {
                    result = v;
                    lastComputed = computed;
                }
            });
        }
        return result;
    };

    // Shuffle a collection.

    //
    _.shuffle = function(obj) {
        return _.sample(obj, Infinity);
    };

    // Sample **n** random values from a collection using the modern version of the
    // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
    // If **n** is not specified, returns a single random element.
    // The internal `guard` argument allows it to work with `map`.

    // 抽取N/1个样本
    _.sample = function(obj, n, guard) {
        // 如果没有N或者守护成功，则返回一个
        if (n == null || guard) {
            if (!isArrayLike(obj)) obj = _.values(obj);
            return obj[_.random(obj.length - 1)];
        }
        var sample = isArrayLike(obj) ? _.clone(obj) : _.values(obj);
        var length = getLength(sample);
        n = Math.max(Math.min(n, length), 0);
        var last = length - 1;
        // 随机排序
        for (var index = 0; index < n; index++) {
            var rand = _.random(index, last);
            var temp = sample[index];
            sample[index] = sample[rand];
            sample[rand] = temp;
        }
        // 返回前N个
        return sample.slice(0, n);
    };

    // Sort the object's values by a criterion produced by an iteratee.

    // 根据iteratee排序
    _.sortBy = function(obj, iteratee, context) {
        var index = 0;
        iteratee = cb(iteratee, context);
        // 先用map重置obj的结构，然后用数组的 sort 排序，再用_.pluck获取value的属性值
        // 返回该结果
        return _.pluck(_.map(obj, function(value, key, list) {
            return {
                value: value,
                index: index++,
                criteria: iteratee(value, key, list)
            };
        }).sort(function(left, right) {
            var a = left.criteria;
            var b = right.criteria;
            if (a !== b) {
                if (a > b || a === void 0) return 1;
                if (a < b || b === void 0) return -1;
            }
            return left.index - right.index;
        }), 'value');
    };

    // An internal function used for aggregate "group by" operations.


    var group = function(behavior, partition) {
        return function(obj, iteratee, context) {
            // 初始化result，这里面的数组用于_.partition_使用，result[0]和 result[1]
            var result = partition ? [
                [],
                []
            ] : {};
            // 处理回调函数
            iteratee = cb(iteratee, context);
            // 循环
            _.each(obj, function(value, index) {
                // 判断当前key符合不符合用户给的断言
                var key = iteratee(value, index, obj);
                // 该行为用于把result分类赋值
                behavior(result, value, key);
            });
            return result;
        };
    };

    // Groups the object's values by a criterion. Pass either a string attribute
    // to group by, or a function that returns the criterion.

    // 分组
    _.groupBy = group(function(result, value, key) {
        // 如果result.key有，那么直接push，否则初始化[value]
        if (_.has(result, key)) result[key].push(value);
        else result[key] = [value];
    });

    // Indexes the object's values by a criterion, similar to `groupBy`, but for
    // when you know that your index values will be unique.

    // 当你知道key唯一的时候可以用indexBy，仅仅是behavior函数不同 
    _.indexBy = group(function(result, value, key) {
        // 直接赋值
        result[key] = value;
    });

    // Counts instances of an object that group by a certain criterion. Pass
    // either a string attribute to count by, or a function that returns the
    // criterion.

    // 获取不同分类的数量的计数
    _.countBy = group(function(result, value, key) {
        if (_.has(result, key)) result[key]++;
        else result[key] = 1;
    });

    // [^\ud800-\udfff] 是普通的 BMP 字符，取反
    // [\ud800-\udbff][\udc00-\udfff] 是成对的代理项对
    // [\ud800-\udfff] 是未成对的代理项字
    var reStrSymbol = /[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;
    // Safely create a real, live array from anything iterable.

    // 变成数组
    _.toArray = function(obj) {
        if (!obj) return [];
        if (_.isArray(obj)) return slice.call(obj);
        if (_.isString(obj)) {
            // Keep surrogate pair characters together
            return obj.match(reStrSymbol);
        }
        if (isArrayLike(obj)) return _.map(obj, _.identity);
        return _.values(obj);
    };

    // Return the number of elements in an object.

    // 获取obj的长度
    _.size = function(obj) {
        if (obj == null) return 0;
        return isArrayLike(obj) ? obj.length : _.keys(obj).length;
    };

    // Split a collection into two arrays: one whose elements all satisfy the given
    // predicate, and one whose elements all do not satisfy the predicate.

    // 拆成对立的两个数组
    _.partition = group(function(result, value, pass) {
        result[pass ? 0 : 1].push(value);
    }, true);

    // -------------------------------------------------------------------------------------
    // -----------------------------------分界线---------------------------------------------
    // -------------------------------------------------------------------------------------

    // Array Functions
    // 数组方法部分
    // ---------------

    // Get the first element of an array. Passing **n** will return the first N
    // values in the array. Aliased as `head` and `take`. The **guard** check
    // allows it to work with `_.map`.

    // 返回数组中第一个或者前N个元素，guard，如果你想捍卫这个函数的尊严，那么将guard设为true
    _.first = _.head = _.take = function(array, n, guard) {
        if (array == null || array.length < 1) return void 0;
        if (n == null || guard) return array[0];
        return _.initial(array, array.length - n);
    };

    // Returns everything but the last entry of the array. Especially useful on
    // the arguments object. Passing **n** will return all the values in
    // the array, excluding the last N.

    // 返回除了最后一个或者最后n个元素，如果guard为真，那么就执行该函数的默认功能，相当于保卫尊严吧，233
    _.initial = function(array, n, guard) {
        return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
    };

    // Get the last element of an array. Passing **n** will return the last N
    // values in the array.

    // 返回数组中的最后n(默认为1)个元素
    _.last = function(array, n, guard) {
        if (array == null || array.length < 1) return void 0;
        if (n == null || guard) return array[array.length - 1];
        return _.rest(array, Math.max(0, array.length - n));
    };

    // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
    // Especially useful on the arguments object. Passing an **n** will return
    // the rest N values in the array.

    // 返回除了第一个或者除了前N个元素，如果guard为真，那么就执行该函数的默认功能，相当于保卫尊严吧，233
    _.rest = _.tail = _.drop = function(array, n, guard) {
        return slice.call(array, n == null || guard ? 1 : n);
    };

    // Trim out all falsy values from an array.

    // 去除所有false值，false, null, 0, "", undefined 和 NaN 都是false值
    _.compact = function(array) {
        return _.filter(array, Boolean);
    };

    // Internal implementation of a recursive `flatten` function.

    // 内部扁平化数组方法
    // strict 通常配合shallow一起使用，
    var flatten = function(input, shallow, strict, output) {
        output = output || [];
        var idx = output.length;
        for (var i = 0, length = getLength(input); i < length; i++) {
            var value = input[i];
            // 如果是类数组并且是（数组或者arguments）
            if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
                // Flatten current level of array or arguments object.

                // 如果为浅，那么直接赋值，不然则递归
                if (shallow) {
                    var j = 0,
                        len = value.length;
                    while (j < len) output[idx++] = value[j++];
                } else {
                    flatten(value, shallow, strict, output);
                    // 递归之后output长度改变，所以idx需要重新赋值
                    idx = output.length;
                }
            // 允不允许将非数组的值，添加到结果数组中
            } else if (!strict) {
                // 直接复制
                output[idx++] = value;
            }
        }
        return output;
    };

    // Flatten out an array, either recursively (by default), or just one level.

    // 扁平化数组，shallow控制深浅，默认为全部扁平化
    _.flatten = function(array, shallow) {
        return flatten(array, shallow, false);
    };

    // Return a version of the array that does not contain the specified value(s).

    // 返回一个不包含某些值的数组版本，就是比_.difference多了一步参数的处理
    _.without = restArgs(function(array, otherArrays) {
        return _.difference(array, otherArrays);
    });

    // Produce a duplicate-free version of the array. If the array has already
    // been sorted, you have the option of using a faster algorithm.
    // Aliased as `unique`.

    // 数组去重
    _.uniq = _.unique = function(array, isSorted, iteratee, context) {
        // 如果不是布尔值，那么重构参数
        if (!_.isBoolean(isSorted)) {
            context = iteratee;
            iteratee = isSorted;
            isSorted = false;
        }
        // 处理迭代器
        if (iteratee != null) iteratee = cb(iteratee, context);
        // 结果数组
        var result = [];
        // 存储器？
        var seen = [];
        for (var i = 0, length = getLength(array); i < length; i++) {
            var value = array[i],
                computed = iteratee ? iteratee(value, i, array) : value;
            // 如果已经被排序，如果是有序数组，那么直接用后一个和前一个判断，这样更快
            if (isSorted) {
                // !== 优先级大于 ||
                // 如果第一个元素 || seen 不等于 computed
                if (!i || seen !== computed) result.push(value);
                seen = computed;
                // 如果有迭代器
            } else if (iteratee) {
                // 判断seen中有没有结果，没有才push
                if (!_.contains(seen, computed)) {
                    // 再更新
                    seen.push(computed);
                    // push到结果数组
                    result.push(value);
                }
                // 直接判断有没有
            } else if (!_.contains(result, value)) {
                result.push(value);
            }
        }
        return result;
    };

    // Produce an array that contains the union: each distinct element from all of
    // the passed-in arrays.

    // 先处理接收到的参数，杂糅到一起，然后扁平化，然后去重
    _.union = restArgs(function(arrays) {
        // 仅仅一层
        return _.uniq(flatten(arrays, true, true));
    });

    // Produce an array that contains every item shared between all the
    // passed-in arrays.

    // 取并集
    _.intersection = function(array) {
        // 结果数组
        var result = [];
        // 当前函数的所有参数的长度
        var argsLength = arguments.length;
        // for循环
        for (var i = 0, length = getLength(array); i < length; i++) {
            var item = array[i];
            // 如果结果包含item，进入下一个循环
            if (_.contains(result, item)) continue;
            // 循环其他参数
            var j;
            for (j = 1; j < argsLength; j++) {
                // 如果其他参数不包含item，那么退出该循环，导致j !== argsLength
                if (!_.contains(arguments[j], item)) break;
            }
            // 判断时候可以push到结果数组
            if (j === argsLength) result.push(item);
        }
        return result;
    };

    // Take the difference between one array and a number of other arrays.
    // Only the elements present in just the first array will remain.

    // 取数组中的不同，只保留第一个数组的值 =>  取非
    // rest化参数
    _.difference = restArgs(function(array, rest) {
        // 扁平化数组
        rest = flatten(rest, true, true);
        // 过滤
        return _.filter(array, function(value) {
            // 不包含的才是我想要的
            return !_.contains(rest, value);
        });
    });

    // Complement of _.zip. Unzip accepts an array of arrays and groups
    // each array's elements on shared indices.

    // 将二维数组的值分离，返回二维数组，index上的位置为原数组每一个子数组上index的合集
    _.unzip = function(array) {
        // 获取长度最长的二维数组的长度
        var length = array && _.max(array, getLength).length || 0;
        // 初始化结果数组，加快速度
        var result = Array(length);
        // 循环，并获取每个数组的index对应的，注意：_.pluck中调用了map
        for (var index = 0; index < length; index++) {
            result[index] = _.pluck(array, index);
        }
        return result;
    };

    // Zip together multiple lists into a single array -- elements that share
    // an index go together.

    // 将每个数组的相同位置的值合并到一起
    _.zip = restArgs(_.unzip);

    // Converts lists into objects. Pass either a single array of `[key, value]`
    // pairs, or two parallel arrays of the same length -- one of keys, and one of
    // the corresponding values. Passing by pairs is the reverse of _.pairs.

    // 将数组转为对象
    _.object = function(list, values) {
        var result = {};
        for (var i = 0, length = getLength(list); i < length; i++) {
            // list[i]为key，values[i]为value
            if (values) {
                result[list[i]] = values[i];
                // 只传入二维数组的时候，[0]为key，[1]为value
            } else {
                result[list[i][0]] = list[i][1];
            }
        }
        return result;
    };

    // Generator function to create the findIndex and findLastIndex functions.
    var createPredicateIndexFinder = function(dir) {
        return function(array, predicate, context) {
            // 生成断言函数
            predicate = cb(predicate, context);
            // 获取array的长度
            var length = getLength(array);
            // 根据方向设置起始点
            var index = dir > 0 ? 0 : length - 1;
            // 这里的for循环的条件index >= 0 && index < length，具有两面性
            for (; index >= 0 && index < length; index += dir) {
                // 通过断言函数，返回当前索引
                if (predicate(array[index], index, array)) return index;
            }
            // 否则就找不到，就返回-1
            return -1;
        };
    };

    // Returns the first index on an array-like that passes a predicate test.

    // 找到第一个通过测试的值得索引，正向开始找和反向开始找，返回的索引都是正向开始算的
    _.findIndex = createPredicateIndexFinder(1);
    _.findLastIndex = createPredicateIndexFinder(-1);

    // Use a comparator function to figure out the smallest index at which
    // an object should be inserted so as to maintain order. Uses binary search.

    // 找obj在 array的位置 
    // 该方法不允许有NaN，因为NaN无法和任何数字做比较
    // 
    // 前提：数组为有序
    // 优点：查找参数少，查找速度快
    // 缺点：要求待查表为有序表
    // 思路：先找重点位置，与aim比，等于则直接返回，大于取前半部分，小于取后半部分
    // 循环以上操作，下面的二分是一个变种
    _.sortedIndex = function(array, obj, iteratee, context) {
        // 生成迭代器，仅有一个value参数，这里iteratee为空，所以返回identity，直接返回value
        iteratee = cb(iteratee, context, 1);
        // 返回obj的值
        var value = iteratee(obj);
        var low = 0,
            high = getLength(array);

        // 变种的二分算法的核心逻辑
        // 不是找相等
        while (low < high) {
            var mid = Math.floor((low + high) / 2);
            if (iteratee(array[mid]) < value) low = mid + 1;
            else high = mid;
        }
        return low;
    };

    // Generator function to create the indexOf and lastIndexOf functions.

    // 生成一个创造indexOf/lastIndexOf的函数
    var createIndexFinder = function(dir, predicateFind, sortedIndex) {
        // idx会被赋上找到的item的索引，并作为结果返回
        return function(array, item, idx) {
            var i = 0,
                length = getLength(array); // 获取 array 的长度

            // 如果idx是数字，那么进入该if
            // idx为从哪里开始找
            if (typeof idx == 'number') {
                // 根据查找方向走
                if (dir > 0) {
                    // 如果idx大于等于0，那么i = idx
                    // 否则取idx + length 和 i 中较大的一个
                    // i位起始位置，也就是从哪里开始找
                    i = idx >= 0 ? idx : Math.max(idx + length, i);
                } else {
                    // 重新设置length
                    // 如果idx大于等于0，那么取idx + 1和length中较小的一个值
                    // 否则取idx + length + 1
                    // 因为idx是数组的下标，所以数组的长度为当前下标 + 1，所以需要 + 1
                    length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
                }
            // 如果 idx 为Number以外的类型的时候
            // 如果 sortedIndex、idx、length都存在，则进入该if
            } else if (sortedIndex && idx && length) {
                // 这里用到了上面的sortedIndex，但是只传了两个参数，所以iteratee为_.identity，直接返回value
                // 不能处理任何有NaN的情况，因为NaN无法比大小
                idx = sortedIndex(array, item);
                // 判断返回的值是否与用户指定的item相同，是的话返回idx，也就是正确的位置，否则返回-1
                return array[idx] === item ? idx : -1;
            }

            // 用于处理array中含有NaN，并且item为NaN的特殊情况
            if (item !== item) {
                // 这里的predicateFind参数，使用_.findIndex或者_.findLastIndex
                // 因为这两个函数是找满足断言的第一个值，并且内置了NaN情况的处理方法，所以传入_.isNaN
                idx = predicateFind(slice.call(array, i, length), _.isNaN);
                // slice会返回第i个到length个，所以需要加上i才是真正的idx
                return idx >= 0 ? idx + i : -1;
            }
            // 直接用for循环去找索引值
            for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
                if (array[idx] === item) return idx;
            }
            // 都没有就返回-1啦
            return -1;
        };
    };

    // Return the position of the first occurrence of an item in an array,
    // or -1 if the item is not included in the array.
    // If the array is large and already in sort order, pass `true`
    // for **isSorted** to use binary search.

    // 找item在array所在的索引，没有则返回-1
    // 上面英文注释说传入一个 true 来启动二分排序，其实不严谨除了Number，和转换成布尔值为false的值都可以比如一个空函数
    _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
    // 这里为什么不给一个sortedIndex呢？因为需要又需要改一个变种，所以太麻烦了？
    _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

    // Generate an integer Array containing an arithmetic progression. A port of
    // the native Python `range()` function. See
    // [the Python documentation](http://docs.python.org/library/functions.html#range).

    // 返回每step(0)一个元素的数组
    _.range = function(start, stop, step) {
        if (stop == null) {
            stop = start || 0;
            start = 0;
        }
        if (!step) {
            step = stop < start ? -1 : 1;
        }

        var length = Math.max(Math.ceil((stop - start) / step), 0);
        var range = Array(length);

        for (var idx = 0; idx < length; idx++, start += step) {
            range[idx] = start;
        }

        return range;
    };

    // Split an **array** into several arrays containing **count** or less elements
    // of initial array.

    // 分成几块，默认返回[]
    _.chunk = function(array, count) {
        if (count == null || count < 1) return [];

        var result = [];
        var i = 0,
            length = array.length;
        while (i < length) {
            result.push(slice.call(array, i, i += count));
        }
        return result;
    };

    // -------------------------------------------------------------------------------------
    // -----------------------------------分界线---------------------------------------------
    // -------------------------------------------------------------------------------------

    // Function (ahem) Functions
    // 函数方法部分
    // ------------------

    // Determines whether to execute a function as a constructor
    // or a normal function with the provided arguments.

    // 确认是以构造函数执行还是普通函数
    // 
    // 补充医疗保险： instanceof 深入剖析，可以参考这个：
    // #https://www.ibm.com/developerworks/cn/web/1306_jiangjj_jsinstanceof/index.html
    // #http://www.cnblogs.com/fool/archive/2010/10/14/1850910.html
    // 
    // instanceof检测对象A的__proto__在不在B的prototype上，在类似递归那样一直在原型链上寻找
    // 注意：当构造函数的 prototype 为 null 的时候，实例对象 instanceof 构造函数会报错
    //
    // 区分new / 非new
    // new的情况模拟new的流程
    // 非new的时候直接apply
    var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
        // 如果执行时候的环境上下文是bounFunc的实例，那么直接返回
        // 根据执行时候this(callingContext)的指向判断是否为是new操作
        // 其实也就是非new的情况下，因为调用函数的时候，new才会使 this 指向当前函数
        if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
        // new 的情况下
        // 创造一个继承自sourceFunc.prototype的对象
        var self = baseCreate(sourceFunc.prototype);
        // sourceFunc 指定 this 为 self 执行
        // 因为指定sourceFunc的this指向self，所以self内的值指定的this.xx会被改变
        var result = sourceFunc.apply(self, args);
        // 如果返回的值是个对象，就会覆盖new操作返回的对象，所以直接返回result，否则，返回 self，这个才是new流程走下来的结果，可参考下面链接
        // 参考链接：#http://www.cnblogs.com/zichi/p/4392944.html
        if (_.isObject(result)) return result;
        // 返回创造的原型链为 sourceFunc.prototype 的对象
        return self;
    };

    // Create a function bound to a given object (assigning `this`, and arguments,
    // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
    // available.

    // 扩展函数参数，实现一个bind
    _.bind = restArgs(function(func, context, args) {
        // 如果func不是函数，报错
        if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
        // 返回一个处理过参数的函数
        var bound = restArgs(function(callArgs) {
            // 理解这个函数executeBound，要求对new稍微熟悉
            return executeBound(func, bound, context, this, args.concat(callArgs));
        });
        return bound;
    });

    // Partially apply a function by creating a version that has had some of its
    // arguments pre-filled, without changing its dynamic `this` context. _ acts
    // as a placeholder by default, allowing any combination of arguments to be
    // pre-filled. Set `_.partial.placeholder` for a custom placeholder argument.

    // 可以预设函数的部分参数，通过传入_忽略某个参数
    // 将第二个参数（包括）之后的所有参数'存到'boundArgs里
    _.partial = restArgs(function(func, boundArgs) {
        // 占位符 = -
        var placeholder = _.partial.placeholder;
        var bound = function() {
            // position用来判断参数
            var position = 0,
                length = boundArgs.length;
            var args = Array(length);

            for (var i = 0; i < length; i++) {
                // 如果boundArgs为placeholder，那么获取当前bound的第position个参数
                // 否则，就获取boundArgs[i]
                // 如果boundArgs为_，则不获取，转而获取返回函数的第position个参数，否则，就获取boundArgs[i]这个参数
                args[i] = boundArgs[i] === placeholder ? arguments[position++] : boundArgs[i];
            }
            // 如果不足，则把剩余参数传进去，只是处理剩余函数
            while (position < arguments.length) args.push(arguments[position++]);
            // 绑定
            return executeBound(func, bound, this, this, args);
        };
        return bound;
    });
    // 上面用到
    _.partial.placeholder = _;

    // Bind a number of an object's methods to that object. Remaining arguments
    // are the method names to be bound. Useful for ensuring that all callbacks
    // defined on an object belong to it.

    // 将obj中的某几个函数永久绑定在obj上
    _.bindAll = restArgs(function(obj, keys) {
        // 数组扁平化，非浅层，变成数组了
        keys = flatten(keys, false, false);
        var index = keys.length;
        // 必须传入函数名
        if (index < 1) throw new Error('bindAll must be passed function names');
        // 依次将某些函数永久绑定在obj上
        while (index--) {
            var key = keys[index];
            obj[key] = _.bind(obj[key], obj);
        }
    });

    // Memoize an expensive function by storing its results.

    // 缓存函数，可运用于大量重复运算的情况，大大提高效率
    // 运用闭包
    _.memoize = function(func, hasher) {
        var memoize = function(key) {
            // 创建一个缓存，在 memoize 函数上
            var cache = memoize.cache;
            // hasher是用来处理存储在cache中key的处理函数，如果有就使用，没有就是用每个传到memoize中的key作为cache中的唯一key
            var address = '' + (hasher ? hasher.apply(this, arguments) : key);
            // 判断cache中有没有address，有则直接返回，没有先执行，在存储，再返回
            if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
            return cache[address];
        };
        // 定义缓存空间
        memoize.cache = {};
        // 返回memoize
        return memoize;
    };

    // Delays a function for the given number of milliseconds, and then calls
    // it with the arguments supplied.

    // 延迟wait时间后执行函数，并把wait之后的所有参数都传到func中
    _.delay = restArgs(function(func, wait, args) {
        return setTimeout(function() {
            return func.apply(null, args);
        }, wait);
    });

    // Defers a function, scheduling it to run after the current call stack has
    // cleared.

    // 延时1ms执行，使用_代替了func
    _.defer = _.partial(_.delay, _, 1);

    // Returns a function, that, when invoked, will only be triggered at most once
    // during a given window of time. Normally, the throttled function will run
    // as much as it can, without ever going more than once per `wait` duration;
    // but if you'd like to disable the execution on the leading edge, pass
    // `{leading: false}`. To disable execution on the trailing edge, ditto.

    // 节流：每隔一段时间执行一次，控制执行次数，优化卡顿
    // 要是我做的话，我会给一个开关来控制节流，感觉这样好麻烦.... 
    _.throttle = function(func, wait, options) {
        // 声明定时器、环境上下文、参数、func的结果
        // 闭包
        var timeout, context, args, result;
        // 上一次执行的时间点
        var previous = 0;
        // 如果options没有，则设置为{}，其中的leading决定是否执行第一次，false为不执行
        if (!options) options = {};
        // 定时器执行的函数
        var later = function() {
            // leading为false的话,previous为0
            previous = options.leading === false ? 0 : _.now();
            // 清空定时器
            timeout = null;
            // 执行func
            result = func.apply(context, args);
            // 如果定时器被清空，那么重置context和args
            if (!timeout) context = args = null;
        };
        // 节流函数主体逻辑
        var throttled = function() {
            // 当前时间
            var now = _.now();
            // 如果上一次的时间点为0，并且leading为false，那么上一次执行的点等于现在
            if (!previous && options.leading === false) previous = now;
            // 设置函数下一次执行的等待时间
            // 用户设定的wait - (now - previous)
            // 如果不设置leading那么remaining <= 0
            // 如果设置了那么remaining = wait
            var remaining = wait - (now - previous);
            // 获取当前执行环境上下文，因为下面定时器内有用到
            context = this;
            // 获取参数列表
            args = arguments;
            // 下面两个if只要不指定leading都会走进，并且remaining第一次是负值，所以在第一个if中清楚了定时器
            // 下面两个都各自实现了节流，不过具体处理的功能不同
            //
            // 如果等待时间小于等于0 或者 等待时间大于指定的wait
            // 这里为了第一次是否立刻执行
            if (remaining <= 0 || remaining > wait) {
                // 如果定时器存在，就清除定时器，并清空timeout
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                // 直接执行
                previous = now;
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            // 如果指定了trailing为false，那么最后一次不会调用这里，也就不会执行最后一次了
            // 这一块只有最后一次不执行的时候才会用到
            } else if (!timeout && options.trailing !== false) {
                // 这里的remaining第一次为负数，只有指定leading才会为正数，因为leading为false的时候previous会被设置为now
                timeout = setTimeout(later, remaining);
            }
            return result;
        };
        // 停止节流函数执行，省了空间
        throttled.cancel = function() {
            clearTimeout(timeout);
            previous = 0;
            timeout = context = args = null;
        };

        return throttled;
    };

    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered（触发）. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.

    // 补充医疗保险
    // 定时器会从1开始递增，即使clear之后定时器的返回值也不会改变
    // 
    // 防抖，只会在事件频繁触发后执行一次
    // 如果immediate为true，那么先调用，在wait时间内不会重复触发（相当于一个在前，一个在后
    _.debounce = function(func, wait, immediate) {
        var timeout, result;
        // 定时器用到的函数
        var later = function(context, args) {
            timeout = null;
            // 只有args不为空的时候才会执行，所以仅仅用于正常流程（也就是之后执行
            if (args) result = func.apply(context, args);
        };
        // 返回函数，更简洁了
        var debounced = restArgs(function(args) {
            // 如果定时器存在，那么每次都先清空定时器
            if (timeout) clearTimeout(timeout);
            // 如果需要在之前触发
            if (immediate) {
                // 只有当timeout设置为null的时候，callNow才为真
                var callNow = !timeout;
                // 用来将timeout设置为null
                // 没有穿later的第二个参数，所以只会在wait秒后把timeout设为null，这样下次就会先执行函数
                timeout = setTimeout(later, wait);
                // 如果callNow为真，直接调用
                if (callNow) result = func.apply(this, args);
            } else {
                // 如果在之后触发，就正常一个延时wait时间
                timeout = _.delay(later, wait, this, args);
            }

            return result;
        });
        // 取消得啦
        debounced.cancel = function() {
            clearTimeout(timeout);
            timeout = null;
        };

        return debounced;
    };

    // Returns the first function passed as an argument to the second,
    // allowing you to adjust arguments, run code before and after, and
    // conditionally execute the original function.

    // 运用partial，反转wrap传的参数
    // 这样就把func传wrapper中了
    _.wrap = function(func, wrapper) {
        return _.partial(wrapper, func);
    };

    // Returns a negated version of the passed-in predicate.

    // 返回一个predicate相反的版本
    _.negate = function(predicate) {
        return function() {
            return !predicate.apply(this, arguments);
        };
    };

    // Returns a function that is the composition of a list of functions, each
    // consuming the return value of the function that follows.

    // 
    _.compose = function() {
        var args = arguments;
        var start = args.length - 1;
        return function() {
            var i = start;
            var result = args[start].apply(this, arguments);
            while (i--) result = args[i].call(this, result);
            return result;
        };
    };

    // Returns a function that will only be executed on and after the Nth call.
    _.after = function(times, func) {
        return function() {
            if (--times < 1) {
                return func.apply(this, arguments);
            }
        };
    };

    // Returns a function that will only be executed up to (but not including) the Nth call.
    _.before = function(times, func) {
        var memo;
        return function() {
            if (--times > 0) {
                memo = func.apply(this, arguments);
            }
            if (times <= 1) func = null;
            return memo;
        };
    };

    // Returns a function that will be executed at most one time, no matter how
    // often you call it. Useful for lazy initialization.
    _.once = _.partial(_.before, 2);

    _.restArgs = restArgs;

    // -------------------------------------------------------------------------------------
    // -----------------------------------分界线---------------------------------------------
    // -------------------------------------------------------------------------------------

    // Object Functions
    // 对象方法部分
    // ----------------

    // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.

    // 小于IE9的时候，对象重写 nonEnumerableProps数组 内的这些属性，会导致某些方法的结果改变，利用这一点来判断是否有问题
    var hasEnumBug = !{ toString: null }.propertyIsEnumerable('toString');
    var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
        'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'
    ];

    // 处理bug
    var collectNonEnumProps = function(obj, keys) {
        var nonEnumIdx = nonEnumerableProps.length;
        var constructor = obj.constructor;
        var proto = _.isFunction(constructor) && constructor.prototype || ObjProto;

        // Constructor is a special case.
        var prop = 'constructor';
        if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

        while (nonEnumIdx--) {
            prop = nonEnumerableProps[nonEnumIdx];
            if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
                keys.push(prop);
            }
        }
    };

    // Retrieve the names of an object's own properties.
    // Delegates to **ECMAScript 5**'s native `Object.keys`.

    // 作用：返回object自身上的属性，不包括原型链
    _.keys = function(obj) {
        // 如果不是对象，或者不是函数
        if (!_.isObject(obj)) return [];
        // 原生支持就用原生的
        if (nativeKeys) return nativeKeys(obj);
        var keys = [];
        for (var key in obj)
            // 如果obj(非prototype)上有key属性，那么添加到 keys 结果数组红
            if (_.has(obj, key)) keys.push(key);
        // Ahem, IE < 9.
        if (hasEnumBug) collectNonEnumProps(obj, keys);
        return keys;
    };

    // Retrieve all the property names of an object.

    // 作用：返回object自身上的属性，包括原型链
    _.allKeys = function(obj) {
        if (!_.isObject(obj)) return [];
        var keys = [];
        for (var key in obj) keys.push(key);
        // Ahem, IE < 9.
        if (hasEnumBug) collectNonEnumProps(obj, keys);
        return keys;
    };

    // Retrieve the values of an object's properties.

    // 获取obj的所有value
    _.values = function(obj) {
        var keys = _.keys(obj);
        var length = keys.length;
        var values = Array(length);
        for (var i = 0; i < length; i++) {
            values[i] = obj[keys[i]];
        }
        return values;
    };

    // Returns the results of applying the iteratee to each element of the object.
    // In contrast to _.map it returns an object.
    _.mapObject = function(obj, iteratee, context) {
        iteratee = cb(iteratee, context);
        var keys = _.keys(obj),
            length = keys.length,
            results = {};
        for (var index = 0; index < length; index++) {
            var currentKey = keys[index];
            results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
        }
        return results;
    };

    // Convert an object into a list of `[key, value]` pairs.
    // The opposite of _.object.
    _.pairs = function(obj) {
        var keys = _.keys(obj);
        var length = keys.length;
        var pairs = Array(length);
        for (var i = 0; i < length; i++) {
            pairs[i] = [keys[i], obj[keys[i]]];
        }
        return pairs;
    };

    // Invert the keys and values of an object. The values must be serializable.

    // 倒置对象的键值对
    // 如果有值相同的key，那么后面的会覆盖前面的
    _.invert = function(obj) {
        var result = {};
        var keys = _.keys(obj);
        for (var i = 0, length = keys.length; i < length; i++) {
            result[obj[keys[i]]] = keys[i];
        }
        return result;
    };

    // Return a sorted list of the function names available on the object.
    // Aliased as `methods`.
    _.functions = _.methods = function(obj) {
        var names = [];
        for (var key in obj) {
            if (_.isFunction(obj[key])) names.push(key);
        }
        return names.sort();
    };

    // An internal function for creating assigner functions.

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
                    // 进行判断并填充或覆盖
                    if (!defaults || obj[key] === void 0) obj[key] = source[key];
                }
            }
            return obj;
        };
    };

    // Extend a given object with all the properties in passed-in object(s).

    // 参数为所有的allKeys，包含原型链上的
    _.extend = createAssigner(_.allKeys);

    // Assigns a given object with all the own properties in the passed-in object(s).
    // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)

    // 参数为所有的keys，不包括原型链上的
    _.extendOwn = _.assign = createAssigner(_.keys);

    // Returns the first key on an object that passes a predicate test.

    // 找到一个通过测试的object的值对应的key
    _.findKey = function(obj, predicate, context) {
        // 无敌处理产生回调函数大法
        predicate = cb(predicate, context);
        // 获取obj上所有的key，不包括原型链上的
        var keys = _.keys(obj),
            key;
        for (var i = 0, length = keys.length; i < length; i++) {
            key = keys[i];
            if (predicate(obj[key], key, obj)) return key;
        }
    };

    // Internal pick helper function to determine if `obj` has key `key`.
    var keyInObj = function(value, key, obj) {
        return key in obj;
    };

    // Return a copy of the object only containing the whitelisted properties.
    _.pick = restArgs(function(obj, keys) {
        var result = {},
            iteratee = keys[0];
        if (obj == null) return result;
        if (_.isFunction(iteratee)) {
            if (keys.length > 1) iteratee = optimizeCb(iteratee, keys[1]);
            keys = _.allKeys(obj);
        } else {
            iteratee = keyInObj;
            keys = flatten(keys, false, false);
            obj = Object(obj);
        }
        for (var i = 0, length = keys.length; i < length; i++) {
            var key = keys[i];
            var value = obj[key];
            if (iteratee(value, key, obj)) result[key] = value;
        }
        return result;
    });

    // Return a copy of the object without the blacklisted properties.
    _.omit = restArgs(function(obj, keys) {
        var iteratee = keys[0],
            context;
        if (_.isFunction(iteratee)) {
            iteratee = _.negate(iteratee);
            if (keys.length > 1) context = keys[1];
        } else {
            keys = _.map(flatten(keys, false, false), String);
            iteratee = function(value, key) {
                return !_.contains(keys, key);
            };
        }
        return _.pick(obj, iteratee, context);
    });

    // Fill in a given object with default properties.

    // 填充旧对象中没有，新对象中有的key
    _.defaults = createAssigner(_.allKeys, true);

    // Creates an object that inherits from the given prototype object.
    // If additional properties are provided then they will be added to the
    // created object.
    _.create = function(prototype, props) {
        var result = baseCreate(prototype);
        if (props) _.extendOwn(result, props);
        return result;
    };

    // Create a (shallow-cloned) duplicate of an object.
    _.clone = function(obj) {
        if (!_.isObject(obj)) return obj;
        return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
    };

    // Invokes interceptor with the obj, and then returns obj.
    // The primary purpose of this method is to "tap into" a method chain, in
    // order to perform operations on intermediate results within the chain.
    _.tap = function(obj, interceptor) {
        interceptor(obj);
        return obj;
    };

    // Returns whether an object has a given set of `key:value` pairs.

    // _.matcher核心逻辑部分，判断是否包括键值对
    _.isMatch = function(object, attrs) {
        var keys = _.keys(attrs),
            length = keys.length;
        // 如果object为空，那么根据attrs返回是否包括，如果为0，则包括，否则不包括
        if (object == null) return !length;
        // 对象化
        var obj = Object(object);
        for (var i = 0; i < length; i++) {
            var key = keys[i];
            // 先判断值相等与否，在判断key在不在obj上，否则 return false 直接for循环结束，跳出函数
            if (attrs[key] !== obj[key] || !(key in obj)) return false;
        }
        // 返回true
        return true;
    };


    // Internal recursive comparison function for `isEqual`.
    var eq, deepEq;
    eq = function(a, b, aStack, bStack) {
        // Identical objects are equal. `0 === -0`, but they aren't identical.
        // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
        if (a === b) return a !== 0 || 1 / a === 1 / b;
        // `null` or `undefined` only equal to itself (strict comparison).
        if (a == null || b == null) return false;
        // `NaN`s are equivalent, but non-reflexive.
        if (a !== a) return b !== b;
        // Exhaust primitive checks
        var type = typeof a;
        if (type !== 'function' && type !== 'object' && typeof b != 'object') return false;
        return deepEq(a, b, aStack, bStack);
    };

    // Internal recursive comparison function for `isEqual`.
    deepEq = function(a, b, aStack, bStack) {
        // Unwrap any wrapped objects.
        if (a instanceof _) a = a._wrapped;
        if (b instanceof _) b = b._wrapped;
        // Compare `[[Class]]` names.
        var className = toString.call(a);
        if (className !== toString.call(b)) return false;
        switch (className) {
            // Strings, numbers, regular expressions, dates, and booleans are compared by value.
            case '[object RegExp]':
                // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
            case '[object String]':
                // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
                // equivalent to `new String("5")`.
                return '' + a === '' + b;
            case '[object Number]':
                // `NaN`s are equivalent, but non-reflexive.
                // Object(NaN) is equivalent to NaN.
                if (+a !== +a) return +b !== +b;
                // An `egal` comparison is performed for other numeric values.
                return +a === 0 ? 1 / +a === 1 / b : +a === +b;
            case '[object Date]':
            case '[object Boolean]':
                // Coerce dates and booleans to numeric primitive values. Dates are compared by their
                // millisecond representations. Note that invalid dates with millisecond representations
                // of `NaN` are not equivalent.
                return +a === +b;
            case '[object Symbol]':
                return SymbolProto.valueOf.call(a) === SymbolProto.valueOf.call(b);
        }

        var areArrays = className === '[object Array]';
        if (!areArrays) {
            if (typeof a != 'object' || typeof b != 'object') return false;

            // Objects with different constructors are not equivalent, but `Object`s or `Array`s
            // from different frames are.
            var aCtor = a.constructor,
                bCtor = b.constructor;
            if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                    _.isFunction(bCtor) && bCtor instanceof bCtor) &&
                ('constructor' in a && 'constructor' in b)) {
                return false;
            }
        }
        // Assume equality for cyclic structures. The algorithm for detecting cyclic
        // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

        // Initializing stack of traversed objects.
        // It's done here since we only need them for objects and arrays comparison.
        aStack = aStack || [];
        bStack = bStack || [];
        var length = aStack.length;
        while (length--) {
            // Linear search. Performance is inversely proportional to the number of
            // unique nested structures.
            if (aStack[length] === a) return bStack[length] === b;
        }

        // Add the first object to the stack of traversed objects.
        aStack.push(a);
        bStack.push(b);

        // Recursively compare objects and arrays.
        if (areArrays) {
            // Compare array lengths to determine if a deep comparison is necessary.
            length = a.length;
            if (length !== b.length) return false;
            // Deep compare the contents, ignoring non-numeric properties.
            while (length--) {
                if (!eq(a[length], b[length], aStack, bStack)) return false;
            }
        } else {
            // Deep compare objects.
            var keys = _.keys(a),
                key;
            length = keys.length;
            // Ensure that both objects contain the same number of properties before comparing deep equality.
            if (_.keys(b).length !== length) return false;
            while (length--) {
                // Deep compare each member
                key = keys[length];
                if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
            }
        }
        // Remove the first object from the stack of traversed objects.
        aStack.pop();
        bStack.pop();
        return true;
    };

    // Perform a deep comparison to check if two objects are equal.
    _.isEqual = function(a, b) {
        return eq(a, b);
    };

    // Is a given array, string, or object empty?
    // An "empty" object has no enumerable own-properties.
    _.isEmpty = function(obj) {
        if (obj == null) return true;
        if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
        return _.keys(obj).length === 0;
    };

    // Is a given value a DOM element?
    _.isElement = function(obj) {
        return !!(obj && obj.nodeType === 1);
    };

    // Is a given value an array?
    // Delegates to ECMA5's native Array.isArray

    // 如果原生支持Array.isArray就用不支持就用call
    _.isArray = nativeIsArray || function(obj) {
        return toString.call(obj) === '[object Array]';
    };

    // Is a given variable an object?

    // 判断是否为对象，包括function和object
    // 最后的!!obj，是对null做了处理
    _.isObject = function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };

    // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError, isMap, isWeakMap, isSet, isWeakSet.

    // 利用Object.prototype.toString.call(obj)的返回值，判断当前属于哪个类型
    // 该步卸载比较靠上的位置，以便后面针对兼容性的重写某些判断方法
    _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error', 'Symbol', 'Map', 'WeakMap', 'Set', 'WeakSet'], function(name) {
        _['is' + name] = function(obj) {
            return toString.call(obj) === '[object ' + name + ']';
        };
    });

    // Define a fallback version of the method in browsers (ahem, IE < 9), where
    // there isn't any inspectable "Arguments" type.

    // 兼容版本，如果toString.call(obj)不返回预期[object Callee]，那么则需要判断obj上有没有callee
    // 这里虽然对象可以写上callee，但是谁又会这么无聊呢....
    if (_.isArguments(arguments)) {
        _.isArguments = function(obj) {
            return _.has(obj, 'callee');
        };
    }

    // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
    // IE 11 (#1621), Safari 8 (#1929), and PhantomJS (#2236).

    // 这有有点问题吧？？？
    var nodelist = root.document && root.document.childNodes;
    if (typeof /./ != 'function' && typeof Int8Array != 'object' && typeof nodelist != 'function') {
        _.isFunction = function(obj) {
            // 这最后的逻辑或跟一个false，有必要吗？
            // 就这样吧，浏览器问题，没必要较真
            // 看看这里：#https://stackoverflow.com/questions/38827169/underscore-js-why-does-isfunction-use-false
            return typeof obj == 'function' || false;
        };
    }

    // Is a given object a finite number?
    _.isFinite = function(obj) {
        return !_.isSymbol(obj) && isFinite(obj) && !isNaN(parseFloat(obj));
    };

    // Is the given value `NaN`?
    _.isNaN = function(obj) {
        return _.isNumber(obj) && isNaN(obj);
    };

    // Is a given value a boolean?
    _.isBoolean = function(obj) {
        return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
    };

    // Is a given value equal to null?
    _.isNull = function(obj) {
        return obj === null;
    };

    // Is a given variable undefined?
    _.isUndefined = function(obj) {
        return obj === void 0;
    };

    // Shortcut function for checking if an object has a given property directly
    // on itself (in other words, not on a prototype).

    // 判断obj上有没有path这个key，不包括obj.prototype上的
    _.has = function(obj, path) {
        // 如果path不是数组，并且obj存在，则直接调用hasOwnProperty
        if (!_.isArray(path)) {
            return obj != null && hasOwnProperty.call(obj, path);
        }
        // 如果是数组，则进行覆盖式判断
        var length = path.length;
        for (var i = 0; i < length; i++) {
            var key = path[i];
            if (obj == null || !hasOwnProperty.call(obj, key)) {
                return false;
            }
            obj = obj[key];
        }
        return !!length;
    };

    // -------------------------------------------------------------------------------------
    // -----------------------------------分界线---------------------------------------------
    // -------------------------------------------------------------------------------------

    // Utility Functions
    // 工具方法部分
    // -----------------

    // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
    // previous owner. Returns a reference to the Underscore object.

    // 解放_变量，如果使用underscore之前_已经被占用，那么只是此方法，返回_构造函数
    _.noConflict = function() {
        root._ = previousUnderscore;
        return this;
    };

    // Keep the identity function around for default iteratees.

    // 默认的迭代器，返回被迭代的每一个值
    _.identity = function(value) {
        return value;
    };

    // Predicate-generating functions. Often useful outside of Underscore.

    // 相当于const
    _.constant = function(value) {
        return function() {
            return value;
        };
    };

    // 始终返回undefiend
    _.noop = function() {};


    // 返回一个函数，接受一个参数，类型为Object，返回这个对象的[path]值
    // 注意：obj[key]这里的key会执行toString方法，obj[[['name']]] => obj['name']
    _.property = function(path) {
        // 如果不是数组
        if (!_.isArray(path)) {
            // 返回的这个函数会获取有一个参数，这个参数需传入一个对象，并返回这个对象的path属性/方法
            return shallowProperty(path);
        }
        // 是数组的情况下
        return function(obj) {
            return deepGet(obj, path);
        };
    };

    // Generates a function for a given object that returns a given property.

    // 仅仅能用于对象，返回一个获取obj指定属性的方法
    _.propertyOf = function(obj) {
        // 如果obj未定义，那么如论如何都返回undefined
        if (obj == null) {
            // 这里是否不用再创建一个，而是用_.noop
            return _.noop;
        }
        // 如果obj是对象的话，判断key(path)是否为数组，不是直接obj[path]，否则调用deepGet
        return function(path) {
            return !_.isArray(path) ? obj[path] : deepGet(obj, path);
        };
    };

    // Returns a predicate for checking whether an object has a given set of
    // `key:value` pairs.

    // 返回一个函数，传入一个对象，返回的函数判断传入的对象是否包含attrs的键值对
    _.matcher = _.matches = function(attrs) {
        attrs = _.extendOwn({}, attrs);
        return function(obj) {
            return _.isMatch(obj, attrs);
        };
    };

    // Run a function **n** times.

    // 指定迭代函数n次，并可以指定迭代函数的上下文
    _.times = function(n, iteratee, context) {
        // 至少为0次
        var accum = Array(Math.max(0, n));
        // 优化回调函数
        iteratee = optimizeCb(iteratee, context, 1);
        // 执行
        for (var i = 0; i < n; i++) accum[i] = iteratee(i);
        return accum;
    };

    // Return a random integer between min and max (inclusive).

    // 获取包含min和max的随机数，至少传入一个大于等于0的参数
    _.random = function(min, max) {
        if (max == null) {
            max = min;
            min = 0;
        }
        // 就是利用Math.random
        return min + Math.floor(Math.random() * (max - min + 1));
    };

    // A (possibly faster) way to get the current timestamp as an integer.

    // 时间戳
    _.now = Date.now || function() {
        return new Date().getTime();
    };

    // List of HTML entities for escaping.

    // 用于转义的HTML实体列表
    var escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;'
    };
    // 用于反转义的HTML实体列表
    var unescapeMap = _.invert(escapeMap);

    // Functions for escaping and unescaping strings to/from HTML interpolation.
    var createEscaper = function(map) {
        var escaper = function(match) {
            return map[match];
        };
        // Regexes for identifying a key that needs to be escaped.

        // 生成正则正向查找
        var source = '(?:' + _.keys(map).join('|') + ')';
        var testRegexp = RegExp(source);
        var replaceRegexp = RegExp(source, 'g');
        return function(string) {
            string = string == null ? '' : '' + string;
            return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
        };
    };

    // 转移成字符串实体，以免XSS攻击
    _.escape = createEscaper(escapeMap);
    // 反转译
    _.unescape = createEscaper(unescapeMap);

    // Traverses the children of `obj` along `path`. If a child is a function, it
    // is invoked with its parent as context. Returns the value of the final
    // child, or `fallback` if any child is undefined.

    // 返回对象存在的结果或者用户最终想要的结果
    // 我感觉有点多余啊
    _.result = function(obj, path, fallback) {
        // 判断path是否为数组，强制转换为数组
        if (!_.isArray(path)) path = [path];
        // 获取转换后的path的数组
        var length = path.length;
        // 如果path长度为0，判断callback是否是函数，如果是call(obj)，否则返回fallback
        if (!length) {
            return _.isFunction(fallback) ? fallback.call(obj) : fallback;
        }
        for (var i = 0; i < length; i++) {
            // 如果obj未定义，则prop为undefined，否则prop为obj[path[i]]
            var prop = obj == null ? void 0 : obj[path[i]];
            // 如果prop为空，那么prop为fallback
            if (prop === void 0) {
                prop = fallback;
                // 用于跳出for循环，如果使用break，下面的（obj = _.isFunction(prop) ? prop.call(obj) : prop;）还需要放在这里面运行一边重复了
                i = length; // Ensure we don't continue iterating.
            }
            // obj被重写了
            obj = _.isFunction(prop) ? prop.call(obj) : prop;
        }
        return obj;
    };

    // Generate a unique integer id (unique within the entire client session).
    // Useful for temporary DOM ids.

    // 生成唯一ID，闭包原理，可带前缀，DOM ids 中较有用
    var idCounter = 0;
    _.uniqueId = function(prefix) {
        var id = ++idCounter + '';
        return prefix ? prefix + id : id;
    };

    // 以下为template所用到的
    // By default, Underscore uses ERB-style template delimiters, change the
    // following template settings to use alternative delimiters.

    // 三种解析模板，自定义
    _.templateSettings = {
        // 解析javascript
        evaluate: /<%([\s\S]+?)%>/g,
        // 解析变量
        interpolate: /<%=([\s\S]+?)%>/g,
        // 对HTML进行转译
        escape: /<%-([\s\S]+?)%>/g
    };

    // When customizing `templateSettings`, if you don't want to define an
    // interpolation, evaluation or escaping regex, we need one that is
    // guaranteed not to match.

    // 如果解析模板未定义，则取下面这个
    // 该正则什么都不匹配
    // 原理应该是^匹配开头的，然后前面加上任意一个字符串之类的，就导致什么都不匹配了...
    var noMatch = /(.)^/;

    // Certain characters need to be escaped so that they can be put into a
    // string literal.

    // 定义特殊功能的字符，以便可以被运用到模板的字符串变量中
    var escapes = {
        "'": "'",
        '\\': '\\',
        '\r': 'r',
        '\n': 'n',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    };

    // 正则
    var escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g;

    /**
        '      => \\'
        \\     => \\\\
        \r     => \\r
        \n     => \\n
        \u2028 => \\u2028
        \u2029 => \\u2029
    **/
    var escapeChar = function(match) {
        return '\\' + escapes[match];
    };

    // JavaScript micro-templating, similar to John Resig's implementation.
    // Underscore templating handles arbitrary delimiters, preserves whitespace,
    // and correctly escapes quotes within interpolated code.
    // NB: `oldSettings` only exists for backwards compatibility.
    _.template = function(text, settings, oldSettings) {
        // 矫正模板配置
        if (!settings && oldSettings) settings = oldSettings;
        // 将settings,和_.templateSettings赋值到新的{}中
        settings = _.defaults({}, settings, _.templateSettings);

        // Combine delimiters into one regular expression via alternation.

        // 将不同的模板整合到一个正则上
        var matcher = RegExp([
            (settings.escape || noMatch).source,
            (settings.interpolate || noMatch).source,
            (settings.evaluate || noMatch).source
        ].join('|') + '|$', 'g');

        // Compile the template source, escaping string literals appropriately.
        var index = 0;
        // source用来保存最终的函数执行体
        var source = "__p+='";
        text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
            source += text.slice(index, offset).replace(escapeRegExp, escapeChar);
            index = offset + match.length;

            if (escape) {
                source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
            } else if (interpolate) {
                source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
            } else if (evaluate) {
                source += "';\n" + evaluate + "\n__p+='";
            }

            // Adobe VMs need the match returned to produce the correct offset.
            return match;
        });
        source += "';\n";

        // If a variable is not specified, place data values in local scope.

        // with 参考：#http://luopq.com/2016/02/14/js-with-keyword/
        // 如果没有指定settings，则使用 with，但是性能会下降，因为JS不会预解析
        if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

        source = "var __t,__p='',__j=Array.prototype.join," +
            "print=function(){__p+=__j.call(arguments,'');};\n" +
            source + 'return __p;\n';

        var render;
        try {
            render = new Function(settings.variable || 'obj', '_', source);
        } catch (e) {
            e.source = source;
            throw e;
        }

        var template = function(data) {
            return render.call(this, data, _);
        };

        // Provide the compiled source as a convenience for precompilation.
        var argument = settings.variable || 'obj';
        template.source = 'function(' + argument + '){\n' + source + '}';

        return template;
    };

    // Add a "chain" function. Start chaining a wrapped Underscore object.

    // 是否支持链式操作，这样之后在chainResult (1675行) 中才能链式操作
    _.chain = function(obj) {
        var instance = _(obj);
        // 设置为true
        instance._chain = true;
        // 并返回underscore实例以支持链式操作
        return instance;
    };

    // -------------------------------------------------------------------------------------
    // -----------------------------------分界线---------------------------------------------
    // -------------------------------------------------------------------------------------

    // OOP
    // 面向对象部分
    // ---------------
    // If Underscore is called as a function, it returns a wrapped object that
    // can be used OO-style. This wrapper holds altered versions of all the
    // underscore functions. Wrapped objects may be chained.

    // Helper function to continue chaining intermediate results.

    // 根据实例的_chain标识来决定返回对象还是under实例
    var chainResult = function(instance, obj) {
        return instance._chain ? _(obj).chain() : obj;
    };

    // Add your own custom functions to the Underscore object.

    // 上面所有的 _.functions 都将挂载到 _.prototype 上，以支持实例对象方式调用，并返回一个链式操作函数
    _.mixin = function(obj) {
        _.each(_.functions(obj), function(name) {
            var func = _[name] = obj[name];
            _.prototype[name] = function() {
                // 获取实例对象传入的第一个参数
                var args = [this._wrapped];
                // 利用apply将当前方法的剩余参数传进去
                push.apply(args, arguments);
                // 支持链式操作，其他所有的 return chainResult(...)都类似
                return chainResult(this, func.apply(_, args));
            };
        });
        // 感觉这个return没什么意义呢....
        return _;
    };

    // Add all of the Underscore functions to the wrapper object.

    // 就绑定到  _  构造函数上以便实例对象可以使用
    _.mixin(_);

    // Add all mutator Array functions to the wrapper.

    // 挂载以下数组中的方法到 _ 的原型上
    _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
        var method = ArrayProto[name];
        _.prototype[name] = function() {
            var obj = this._wrapped;
            method.apply(obj, arguments);
            // 兼容ie，看这里: https://github.com/jashkenas/underscore/issues/397
            if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
            return chainResult(this, obj);
        };
    });

    // Add all accessor Array functions to the wrapper.

    // 挂载以下数组中的方法到 _ 的原型上
    _.each(['concat', 'join', 'slice'], function(name) {
        var method = ArrayProto[name];
        _.prototype[name] = function() {
            return chainResult(this, method.apply(this._wrapped, arguments));
        };
    });

    // Extracts the result from a wrapped and chained object.

    // 返回当前这个_wrapped的值
    _.prototype.value = function() {
        return this._wrapped;
    };

    // Provide unwrapping proxy for some methods used in engine operations
    // such as arithmetic and JSON stringification.

    // 为引擎操作中使用的某些方法提供包代理，如valueOf和toJSON操作 -> 来自谷歌翻译....
    _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

    // 字符串化
    _.prototype.toString = function() {
        return String(this._wrapped);
    };

    // AMD registration happens at the end for compatibility with AMD loaders
    // that may not enforce next-turn semantics on modules. Even though general
    // practice for AMD registration is to be anonymous, underscore registers
    // as a named module because, like jQuery, it is a base library that is
    // popular enough to be bundled in a third party lib, but not be part of
    // an AMD load request. Those cases could generate an error when an
    // anonymous define() is called outside of a loader request.

    //  支持AMD
    if (typeof define == 'function' && define.amd) {
        define('underscore', [], function() {
            return _;
        });
    }
}());