const fs = require("fs");
const path = require("path");

// 管理插件加载，打包注入到页面中

const pluginsNames = [
    "string-put-to-db-plugins.js",
    "search-strings-db-plugins.js",
    "eval-hook-plugins.js",
];

let lastReadDiskTs = 0;
let pluginsJsCodeCache = "";

// 带缓存的读取插件，是为了在支持热加载的情况下尽可能的少读硬盘
function loadPluginsAsStringWithCache() {
    // 这是假设访问都是集中在某个时间段的
    if (new Date().getTime() - lastReadDiskTs <= 1_000) {
        return pluginsJsCodeCache;
    }
    lastReadDiskTs = new Date().getTime();
    return pluginsJsCodeCache = loadPluginsAsString();
}

// 把所有插件加载为 String
function loadPluginsAsString() {

    const __dirname = path.resolve();

    // 用来保证Hook代码只被加载一次
    // TODO 妥善处理Worker环境
    const loadOnce = "\n" +
        "   if (!window) {\n" +
        "       return; \n" +
        "   } \n" +
        "   if (window.cc11001100_hook_done) {\n" +
        "       return;\n" +
        "   }\n" +
        "   window.cc11001100_hook_done = true;\n\n";

    const hookJsCode = fs.readFileSync(path.join(__dirname, 'src/components/global-assign-hook-component/core/hook.js')).toString();

    const pluginsJsContentArray = [];
    const pluginsBaseDirectory = path.join(__dirname, 'src/components/global-assign-hook-component/plugins/');
    for (let pluginName of pluginsNames) {
        const pluginFilePath = pluginsBaseDirectory + "/" + pluginName;
        const pluginJsContent = fs.readFileSync(pluginFilePath).toString();
        pluginsJsContentArray.push(pluginJsContent);
    }

    return "\n// ----------------------------------------- Hook代码开始 ----------------------------------------------------- \n" +
        "\n(() => {\n" +

        loadOnce +

        hookJsCode +

        pluginsJsContentArray.join("\n\n") +

        "})();\n" +
        "\n// ----------------------------------------- Hook代码结束 ----------------------------------------------------- \n\n\n\n\n";
}


module.exports.loadPluginsAsString = loadPluginsAsString;
module.exports.loadPluginsAsStringWithCache = loadPluginsAsStringWithCache;

