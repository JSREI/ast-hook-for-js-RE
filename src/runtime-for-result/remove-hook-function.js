const babel = require("@babel/core");
const types = require("@babel/types");
const generator = require("@babel/generator");
const fs = require("fs");


// 修改为对应的文件路径，然后运行就可以了
const 原始文件路径 = "./test.js";
const 结果保存路径 = "./remove-hook-function-result.js";


const hookFunctionName = "cc11001100_hook";

const jsCode = fs.readFileSync(原始文件路径).toString();
const ast = babel.parse(jsCode);

babel.traverse(ast, {
    CallExpression(path) {
        const node = path.node;
        if (!types.isIdentifier(node.callee, {name: hookFunctionName})) {
            return;
        }
        path.replaceWith(node.arguments[1]);
    }
});

const newJsCode = generator.default(ast).code;
fs.writeFileSync(结果保存路径, newJsCode);
console.log(`结果已经保存到： ${结果保存路径}`);





