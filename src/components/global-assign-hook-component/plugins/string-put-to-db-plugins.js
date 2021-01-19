(() => {

    const initDbMessage = "AST HOOK： 如果本窗口内有多个线程，每个线程栈的数据不会共享，初始化线程栈数据库： \n "
        + window.location.href;
    console.log(initDbMessage);

    // 用于存储Hook到的所有字符串类型的变量
    const stringsDB = window.cc11001100_hook.stringsDB = window.cc11001100_hook.stringsDB || {
        varValueDb: [],
        codeLocationExecuteTimesCount: []
    };
    const {varValueDb, codeLocationExecuteTimesCount} = stringsDB;

    // 从一个比较大的数开始计数，以方便在展示的时候与执行次数做区分，差值过大就不易混淆
    let execOrderCounter = 100000;

    function stringPutToDB(name, value, type) {

        if (!value) {
            return;
        }

        // TODO 更多类型搞进来
        // TODO 为什么一定要大而全呢？虽然占用的内存并不多，但是如果上百万的零碎变量还是会耗时间的？也许应该针对性的做出取舍
        let valueString = "";
        let valueTypeof = typeof value;
        if (valueTypeof === "string") {
            valueString = value;
        } else if (valueTypeof === "number") {
            // 太慢了...
            // valueString = value + "";
        }

        if (!valueString) {
            return;
        }

        // 获取代码位置
        const codeLocation = getCodeLocation();
        varValueDb.push({
            name,
            // TODO Buffer类结构直接运算Hook不到的问题仍然没有解决...
            // 默认情况下把所有变量都toString保存到字符串池子中
            // 有一些参数就是放在Buffer或者什么地方以字节形式存储，当使用到的时候直接与字符串相加toString，
            // 这种情况如果只监控变量赋值就监控不到了，这是不想添加更多监控点的情况下的折中方案...
            // 所以干脆在它还是个buffer的时候就转为字符串
            value: valueString,
            type,
            execOrder: execOrderCounter++,
            codeLocation
        });

        // 这个地方被执行的次数统计
        if (codeLocation in codeLocationExecuteTimesCount) {
            codeLocationExecuteTimesCount[codeLocation]++;
        } else {
            codeLocationExecuteTimesCount[codeLocation] = 1;
        }

    }

    function getCodeLocation() {
        const callstack = new Error().stack.split("\n");
        while (callstack.length > 0 && callstack[0].indexOf("cc11001100") === -1) {
            callstack.shift();
        }
        if (callstack.length < 2) {
            return null;
        }
        callstack.shift();
        return callstack.shift();
    }

    // 添加Hook回调
    window.cc11001100_hook.hookCallback.push(stringPutToDB);

})();