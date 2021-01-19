(() => {

    // 检索字符串数据库

    const cc11001100_hook = window.cc11001100_hook;
    const stringsDB = cc11001100_hook.stringsDB;

    // 为什么要采取消息机制呢？
    // 对于浏览器来说，要保证跨域之间的安全，比如使用iframe引入的新的域之中的数据，Chrome似乎是将不同的域隔离在不同的线程中
    // 当前页面中有多少个线程，可以从Chrome的开发中工具的 Sources --> Threads 查看，如果有多个会有这个选项，同时还可以鼠标单击在不同的线程之间切换
    // 但是在console中，输入的命令是运行在当前的线程栈中的，所以这就涉及到一个跨域通信的问题，所以就引入postMessage来在当前页面中有多个线程栈的时候，
    // 执行一条命令时会扩散到所有线程栈中执行，这样使用者就不必在意底层细节了

    // 发送消息时的域名，用于识别内部消息
    const messageDomain = "cc11001100_hook";
    const messageTypeSearch = "search";

    // 防止消息重复处理
    const alreadyProcessMessageIdSet = new Set();

    window.addEventListener("message", event => {
        const eventData = event.data;
        if (!eventData || eventData.domain !== messageDomain) {
            return;
        }

        // 如果已经处理过的话，则不再处理
        const messageId = eventData.messageId;
        if (alreadyProcessMessageIdSet.has(messageId)) {
            return;
        }

        if (eventData.type === messageTypeSearch) {
            const pattern = eventData.pattern;
            const isEquals = eventData.isEquals;
            const fieldName = eventData.fieldName;
            const isNeedExpansion = eventData.isNeedExpansion;
            _search(fieldName, pattern, isEquals, isNeedExpansion);
            alreadyProcessMessageIdSet.add(messageId);
            _searchParentAndChildren(messageId, fieldName, pattern, isEquals, isNeedExpansion);
        }

    });

    window.search = window.searchByValue = cc11001100_hook.search = cc11001100_hook.searchByValue = function (pattern, isEquals = true, isNeedExpansion = true) {
        const fieldName = "value";
        // 先搜索当前页面
        _search(fieldName, pattern, isEquals, isNeedExpansion);
        const messageId = new Date().getTime();
        alreadyProcessMessageIdSet.add(messageId);
        // 然后递归搜索父页面和子页面
        _searchParentAndChildren(messageId, fieldName, pattern, isEquals, isNeedExpansion);
    }

    window.searchByName = cc11001100_hook.searchByName = function (pattern, isEquals = false, isNeedExpansion = false) {
        const fieldName = "name";
        // 先搜索当前页面
        _search(fieldName, pattern, isEquals, isNeedExpansion);
        const messageId = new Date().getTime();
        alreadyProcessMessageIdSet.add(messageId);
        // 然后递归搜索父页面和子页面
        _searchParentAndChildren(messageId, fieldName, pattern, isEquals, isNeedExpansion);
    }

    function _searchParentAndChildren(messageId, fieldName, pattern, isEquals, isNeedExpansion) {
        const searchMessage = {
            "domain": messageDomain,
            "type": messageTypeSearch,
            "fieldName": fieldName,
            "messageId": messageId,
            pattern,
            isEquals,
            isNeedExpansion
        }

        // 子页面
        const iframeArray = document.getElementsByTagName("iframe");
        if (iframeArray.length) {
            for (let iframe of iframeArray) {
                iframe.contentWindow.postMessage(searchMessage, "*");
            }
        }

        // 父页面
        if (window.parent) {
            window.parent.postMessage(searchMessage, "*");
        }
    }

    function _search(filedName, pattern, isEquals, isNeedExpansion) {
        const result = [];
        const expansionValues = isNeedExpansion ? expansionS(pattern) : [pattern];
        for (let s of stringsDB.varValueDb) {
            let isMatch = false;
            if (typeof pattern === "string") {
                if (isEquals) {
                    for (let newPattern of expansionValues) {
                        isMatch = isMatch || (newPattern === s[filedName]);
                    }
                } else {
                    for (let newPattern of expansionValues) {
                        isMatch = isMatch || (s[filedName] && s[filedName].indexOf(newPattern) !== -1);
                    }
                }
            } else if (pattern instanceof RegExp) {
                isMatch = pattern.test(s[filedName]);
            }
            if (!isMatch) {
                continue;
            }
            const codeInfo = parseCodeLocation(s.codeLocation)
            result.push({
                name: s.name,
                value: abbreviationPattern(pattern, s[filedName]),
                type: s.type,
                execOrder: s.execOrder,
                codeName: codeInfo.codeName,
                codeAddress: codeInfo.codeAddress,
                execTimes: stringsDB.codeLocationExecuteTimesCount[s.codeLocation]
            });
        }
        showResult(result);
    }

    // 对搜索值进行一个扩大，以便能够搜索到更多结果
    // 这样也不用苦逼的手动去测试到底是url encode还是url decode了的了
    function expansionS(s) {
        const result = [];

        // 原字符串是要放进去的
        result.push(s);

        if (typeof s !== "string") {
            return result;
        }

        // url编码后
        try {
            const t = encodeURIComponent(s);
            if (result.indexOf(t) === -1) {
                result.push(t);
            }
        } catch (e) {
        }

        // url解码后
        try {
            const t = decodeURIComponent(s);
            if (result.indexOf(t) === -1) {
                result.push(t);
            }
        } catch (e) {
        }

        // 表单数据到底是怎么被编码的...
        try {
            const t = s.replace(/ /g, "+");
            if (result.indexOf(t) === -1) {
                result.push(t);
            }
        } catch (e) {
        }

        return result;
    }

    function showResult(result) {
        let message = "\n在线程栈： \n" + window.location.href + "\n";
        if (!result.length) {
            message += "中没有搜索到结果。\n\n";
            console.log(message);
            console.log("\n\n\n");
            return;
        }

        message += `中搜到${result.length}条结果： \n\n`;
        console.log(message);
        console.log(`变量名\t\t\t\t\t变量值\t\t\t\t\t变量类型\t\t\t\t\t所在函数\t\t\t\t\t执行次数\t\t\t\t\t执行顺序\t\t\t\t\t代码位置\n\n\n`);
        for (let s of result) {
            if (s.value.length > 90) {
                console.log(`${s.name}\t\t\t\t\t${s.value}`);
                console.log(blank(s.name.length) + `\t\t\t\t\t${s.type}\t\t\t\t\t${s.codeName}`);
                console.log(blank(s.name.length) + `\t\t\t\t\t${s.execTimes}\t\t\t\t\t${s.execOrder}`);
            } else {
                console.log(`${s.name}\t\t\t\t\t${s.value}\t\t\t\t\t${s.type}\t\t\t\t\t${s.codeName}`);
                console.log(blank(s.name.length) + `\t\t\t\t\t${s.execTimes}\t\t\t\t\t${s.execOrder}`);
            }
            // 打印的时候代码地址尽量放到单独一行，以防文本太长被折叠Chrome就不会自动将其识别为链接了，这时候还得手动复制就麻烦了
            console.log(blank(s.name.length) + "\t\t\t\t\t" + s.codeAddress + "\n\n\n\n");
        }
        console.log("\n\n\n\n");
    }

    function abbreviationPattern(pattern, value) {
        if (typeof pattern !== "string" || pattern.length < 40) {
            return value;
        }
        const newPattern = pattern.slice(0, 15) + "......" + pattern.slice(pattern.length - 15, pattern.length);
        return value.replace(pattern, newPattern);
    }

    function blank(n) {
        let s = "";
        while (n-- > 0) {
            s += " ";
        }
        return s;
    }

    function parseCodeLocation(codeLocation) {
        const codeInfo = {};
        let matcher = codeLocation.match(/\((.+?)\)/);
        if (matcher != null && matcher.length > 1) {
            codeInfo.codeAddress = matcher[1];
        } else {
            codeInfo.codeAddress = codeLocation;
        }

        matcher = codeLocation.match(/at (.+?)\(/);
        if (matcher != null && matcher.length > 1) {
            codeInfo.codeName = matcher[1]
        }

        return codeInfo;
    }

})();