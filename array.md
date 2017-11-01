### Array Functions

-------

- ```_.first(array, n, guard)```：返回array第一个或者前n个元素，如果guard为真，那么捍卫这个函数的尊严，始终返回第一个元素
- ```_.initial(array, n, guard)```：剔除最后1个或者最后n个元素，如果guard为真，那么只剔除最后一个
- ```_.last(array, n, guard)```：返回array最后一个或者最后n个元素，如果guard为真，那么捍卫这个函数的尊严，始终返回最后一个元素
- ```_.rest(array, n, guard)```：剔除第1个或者前n个元素，如果guard为真，那么只剔除第一个
- ```_.flatten(array, shallow)```：扁平化数组，默认为深度，shallow为真的时候只扁平一层
```javascript
// 内部扁平化数组方法
var flatten = function(input, shallow, strict, output) {
    output = output || [];
    var idx = output.length;
    for (var i = 0, length = getLength(input); i < length; i++) {
        var value = input[i];
        // 如果是类数组并且是（数组或者arguments）
        if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
            // 如果为浅，那么直接赋值，不然则递归
            if (shallow) {
                var j = 0,
                    len = value.length;
                while (j < len) output[idx++] = value[j++];
            } else {
                // 递归
                flatten(value, shallow, strict, output);
                // 递归之后output长度改变，所以idx需要重新赋值
                idx = output.length;
            }
        // strict 用来决定是否可以将非类数组的值添加到output中
        } else if (!strict) {
            // 直接复制
            output[idx++] = value;
        }
    }
    return output;
};
```
- ```_.without(array, otherArrays)```：取非，不过传入的是非数组，就是对difference做了rest参数处理
- ```_.difference(array，rest)```：相当于取非
- ```_.uniq(array, isSorted, iteratee, context)```：数组去重，如果排序了，则采用更快的算法
- ```_.union(array)```：数组去重，多了数组扁平化，可以传多个数组
- ```_.intersection(array)```：取并集，通过arguments.length获取的其他参数
- ```_.unzip(array)```：二维数组中，取每一项的相同索引的元素，返回一个二维数组，解压成几个
- ```_.zip(array)```：和 unzip 相反，将几个数组组合成一个二维数组，压缩成一个
- ```_.object(list, values)```：将数组转为对象
- ```_.findIndex(array, predicate, context)```：寻找通过断言的第一个值得索引
- ```_.findLastIndex(array, predicate, context)```：反向寻找通过断言的第一个值得索引
```javascript
// 创造findIndex/findLastIndex的函数
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
```
- ```_.sortedIndex()```：利用二分算法，找obj可以插入的位置，后面用于_.indexOf
- ```_.indexOf()```：看名字吧
- ```_.lastIndexOf()```：看名字吧
```javascript
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
```
- ```_.range()```：返回每step（0）一个元素的数组
- ```_.chunk()```：分成几块，默认返回[]

----------

### '补充医疗保险'

- 二分算法 -- [参考](http://gaojianzhuang110.blog.163.com/blog/static/186131462011018113727286/)
```javascript
// 二分算法仅限与已被排序的数组中：
// 典型案例
function BinarySearch(srcArray, des) {
    var low = 0
    var high = srcArray.length - 1
    while (low <= high) {
        var middle = (low + high) / 2
        if (des == srcArray[middle]) {
            return middle
        } else if (des < srcArray[middle]) {
            high = middle - 1
        } else {
            low = middle + 1
        }
    }　　
    return -1
}
```
- NaN
    + NaN不大于、等于、小于任何值
    + NaN不可配置，不可写，但是在ES3中可以被改变，但是最好不要覆盖
    + 可以用parseInt()代替NaN，防止被重写




