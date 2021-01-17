(() => {

    // 检索字符串数据库

    const cc11001100_hook = window.cc11001100_hook;
    const stringsDB = cc11001100_hook.stringsDB;

    window.search = cc11001100_hook.search = function (pattern, isEquals = true) {
        const result = [];
        for (let s of stringsDB.varValueDb) {
            if (isEquals ? s.value === pattern : s.value.indexOf(pattern) !== -1) {
                const codeInfo = parseCodeLocation(s.codeLocation)
                result.push({
                    name: s.name,
                    value: abbreviationPattern(pattern, s.value),
                    type: s.type,
                    execOrder: s.execOrder,
                    codeName: codeInfo.codeName,
                    codeAddress: codeInfo.codeAddress,
                    execTimes: stringsDB.codeLocationExecuteTimesCount[s.codeLocation]
                });
            }
        }
        showResult(result);
    }

    window.searchByName = cc11001100_hook.searchByName = function (pattern, isEquals=false) {
        const result = [];
        for (let s of stringsDB.varValueDb) {
            if (isEquals ? s.name === pattern : s.name.indexOf(pattern) !== -1) {
                const codeInfo = parseCodeLocation(s.codeLocation)
                result.push({
                    name: s.name,
                    value: abbreviationPattern(pattern, s.value),
                    type: s.type,
                    execOrder: s.execOrder,
                    codeName: codeInfo.codeName,
                    codeAddress: codeInfo.codeAddress,
                    execTimes: stringsDB.codeLocationExecuteTimesCount[s.codeLocation]
                });
            }
        }
        showResult(result);
    }

    function showResult(result) {
        if (!result.length) {
            console.log("没有搜索到结果。");
            return;
        }

        console.log(`共搜到${result.length}条结果： `);
        console.log(`变量名\t\t\t\t\t变量值\t\t\t\t\t变量类型\t\t\t\t\t所在函数\t\t\t\t\t执行次数\t\t\t\t\t执行顺序\t\t\t\t\t代码位置`);
        console.log("");
        for (let s of result) {
            if (s.value.length > 90) {
                console.log(`${s.name}\t\t\t\t\t${s.value}`);
                console.log(blank(s.name.length) + `\t\t\t\t\t${s.type}\t\t\t\t\t${s.codeName}\t\t\t\t\t${s.execTimes}\t\t\t\t\t${s.execOrder}`);
            } else {
                console.log(`${s.name}\t\t\t\t\t${s.value}\t\t\t\t\t${s.type}\t\t\t\t\t${s.codeName}\t\t\t\t\t${s.execTimes}\t\t\t\t\t${s.execOrder}`);
            }
            console.log(blank(s.name.length) + "\t\t\t\t\t" + s.codeAddress);
            console.log("");
        }
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
        while(n-->0) {
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