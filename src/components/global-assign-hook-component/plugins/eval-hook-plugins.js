(() => {

    // 是否要在在控制台上打印eval hook日志提醒
    const enableEvalHookLog = true;

    // 用eval执行的代码也要能够注入，我擦开个接口吧...
    const evalHolder = window.eval;
    window.eval = function (jsCode) {

        if (enableEvalHookLog) {
            const isNeedNewLine = jsCode && jsCode.length > 100;
            console.log("AST HOOK工具检测到eval执行代码： " + (isNeedNewLine ? "\n" : "") + jsCode);
        }

        let newJsCode = jsCode;
        const xhr = new XMLHttpRequest();
        xhr.addEventListener("load", () => {
            newJsCode = decodeURIComponent(xhr.responseText);
        });
        // 必须同步执行，否则无法返回结果
        xhr.open("POST", "http://127.0.0.1:10010/hook-js-code", false);
        xhr.send(encodeURIComponent(jsCode));
        arguments[0] = newJsCode;
        return evalHolder.apply(this, arguments);
    }

    window.eval.toString = function () {
        return "function eval() { [native code] }";
    }

})();
