### 对一些操作的实现，每周四更新...

-------

- 深克隆

```javascript
// 数组和对象
// 不包括undefined的情况
var deepClone = function(arg) {
    var keys, length
    var type = Object.prototype.toString.call(arg).slice(8, -1)
    var result = type === 'Object' ? {} : []
    if (typeof result.length === 'undefined') {
        keys = Object.keys(arg)
        length = keys.length
        for (var i = 0; i < length; i++) {
            result[keys[i]] = typeof arg[keys[i]] === 'object' && !!arg[keys[i]]
            ? deepClone(arg[keys[i]])
            : arg[keys[i]]
        }
    } else {
        length = arg.length
        result.length = length
        for (var i = 0; i < length; i++) {
            result[i] = typeof arg[i] === 'object' && !!arg[i]
            ? deepClone(arg[i])
            : arg[i]
        }
    }
    return result
}
```