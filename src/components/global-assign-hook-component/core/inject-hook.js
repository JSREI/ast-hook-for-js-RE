const babel = require("@babel/core");
const types = require("@babel/types");
const generator = require("@babel/generator");

const hookFunctionName = "cc11001100_hook";

function injectHook(jsCode) {
    const ast = babel.parse(jsCode);
    babel.traverse(ast, {

        // 变量声明
        VariableDeclaration(path) {
            const node = path.node;
            if (!node.declarations?.length) {
                return;
            }
            for (let variableDeclarator of node.declarations) {
                if (!variableDeclarator.init) {
                    continue;
                }
                if (types.isFunctionExpression(variableDeclarator.init)) {
                    continue;
                }

                let varName = "";
                if (types.isIdentifier(variableDeclarator.id) || types.isMemberExpression(variableDeclarator.id)) {
                    varName = generator.default(variableDeclarator.id).code;
                }

                try {
                    const hookFunctionArguments = [
                        types.stringLiteral(varName),
                        variableDeclarator.init,
                        types.stringLiteral("var-init")
                    ];
                    variableDeclarator.init = types.callExpression(types.identifier(hookFunctionName), hookFunctionArguments)
                } catch (e) {
                    console.error(e);
                }
            }
        },

        AssignmentExpression(path) {
            const node = path.node;
            if (types.isFunctionExpression(node)) {
                return;
            }

            let varName = "";
            if (types.isIdentifier(node.left) || types.isMemberExpression(node.left)) {
                varName = generator.default(node.left).code;
            }

            try {
                const hookFunctionArguments = [
                    types.stringLiteral(varName),
                    node.right,
                    types.stringLiteral("assign")
                ];
                node.right = types.callExpression(types.identifier(hookFunctionName), hookFunctionArguments)
            } catch (e) {
                console.error(e);
            }
        },

        // 对象表达式
        ObjectExpression(path) {
            const node = path.node;
            if (!node.properties?.length) {
                return;
            }
            for (let objectProperty of node.properties) {
                const propertyValue = objectProperty.value;
                if (types.isFunctionExpression(propertyValue)) {
                    continue;
                }
                if (types.isObjectExpression(propertyValue)) {
                    continue;
                }

                if (!propertyValue) {
                    return;
                }

                let objectKey = objectProperty.key;
                if (types.isIdentifier(objectKey)) {
                    objectKey = types.stringLiteral(objectKey.name);
                }

                try {
                    const hookFunctionArguments = [
                        objectKey,
                        propertyValue,
                        types.stringLiteral("object-key-init")
                    ];
                    objectProperty.value = types.callExpression(types.identifier(hookFunctionName), hookFunctionArguments);
                } catch (e) {
                    console.error(e);
                }
            }

        },

        // 函数的形参
        FunctionDeclaration(path) {
            const node = path.node;
            if (!node.params?.length) {
                return;
            }
            const params = node.params;
            if (types.isBlockStatement(node.body)) {
                // 函数体是个代码块的，则在代码块最前面插入Hook，检查参数的值
                for (let i = params.length - 1; i >= 0; i--) {
                    try {
                        const paramName = params[i];
                        const hookFunctionArguments = [
                            types.stringLiteral(generator.default(paramName).code),
                            paramName,
                            types.stringLiteral("function-parameter")
                        ];
                        const hookFunction = types.callExpression(types.identifier(hookFunctionName), hookFunctionArguments);
                        node.body.body.unshift(types.expressionStatement(hookFunction));
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        }

    })
    return generator.default(ast).code;
}

module.exports.injectHook = injectHook;
