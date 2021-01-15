/**
 * 暴露给外面的接口，方法前缀起到命名空间的作用
 *
 * @param name 对象的属性名或者变量的名称
 *  @param value 对象的属性值或者变量的值
 * @param type 声明是什么类型的，对象属性值还是变量赋值，以后或者还会有其它的
 * @returns {string}
 */
cc11001100_hook = window._hook = window.hook = window.cc11001100_hook = function (name, value, type) {
    try {
        _hook(name, value, type);
    } catch (e) {
        console.error(e);
    }
    // 不论严寒酷暑、不管刮风下雨，都不应该影响到正常逻辑，我要认识到自己的定位只是一个hook....
    return value;
}

cc11001100_hook.hookCallback = [];

function _hook(name, value, type) {
    for (let callback of cc11001100_hook.hookCallback) {
        try {
            callback(name, value, type);
        } catch (e) {
            console.error(e);
        }
    }
}




