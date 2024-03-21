const express = require("express");
const bodyParser = require("body-parser");
const {injectHook} = require("../components/global-assign-hook-component/core/inject-hook");

const app = express();

app.use(bodyParser.raw({
    verify: function (req, res, buf, encoding) {
        if (buf && buf.length) {
            const contentType = req.headers["content-type"];
            const charset = /charset=([\w-]+)/.exec(contentType)[1];
            console.log(charset);
            req.rawBody = buf.toString(charset);
        }
    }, type: function () {
        return true
    }
}));
// 将传过来的js代码注入hook
app.post("/hook-js-code", function (request, response) {
    const jsCode = decodeURIComponent(request.body.toString());
    let newJsCode = jsCode;
    try {
        newJsCode = injectHook(jsCode);
    } catch (e) {
        console.error(e);
    }
    const charset = /charset=([\w-]+)/.exec(request.headers["content-type"])[1];
    console.log(charset);
    response.setHeader("Content-Type", `text/plain; charset=${charset}`);
    //response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "*");
    response.send(encodeURIComponent(newJsCode));
    response.end();
})

// 以后如果能够和页面上双向通信，上报各种数据到这里，就能够实现功能更强的分析之类的

const server = app.listen(10010, function () {
    console.log("启动成功");
})