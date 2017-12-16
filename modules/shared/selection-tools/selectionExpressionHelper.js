'use strict';

function selectionExpressionHelper(
    astHelper,
    typeHelper
) {

    const wrappingNodeTypes = [
        'VariableDeclaration',
        'ReturnStatement',
        'CallExpression',
        'MemberExpression',
        'IfStatement',
        'Property'
    ];

    const exclusionWrappingNodeTypes = [
        'ArrowFunctionExpression',
        'BinaryExpression'
    ];

    const variableOrFunctionTypes = [
        'FunctionDeclaration',
        'VariableDeclaration'
    ];

    const functionDeclarationOrExpression = [
        'FunctionDeclaration',
        'FunctionExpression'
    ]

    const isWrappingNode = astHelper.isNodeType(wrappingNodeTypes);
    const isExclusionWrappingNode = astHelper.isNodeType(exclusionWrappingNodeTypes);
    const isVariableOrFunction = astHelper.isNodeType(variableOrFunctionTypes);
    const isFunctionDeclarationOrExpression = astHelper.isNodeType(functionDeclarationOrExpression);
    const isIdentifier = astHelper.isNodeType(['Identifier']);
    const isVariabeDeclaration = astHelper.isNodeType(['VariableDeclaration']);
    const isIfStatement = astHelper.isNodeType(['IfStatement']);
    const isBinaryExpression = astHelper.isNodeType(['BinaryExpression']);

    function isExpressionNode(node) {
        const isExpression = typeof node.type === 'string'
            && !isExclusionWrappingNode(node)
            && (isWrappingNode(node) || (/expression/i).test(node.type));

        return isExpression;
    }

    function lineAndColumnMatch(selectionPosition, nodePosition) {
        return selectionPosition.line === nodePosition.line
            && selectionPosition.column === nodePosition.column;
    }

    function nodeCoordsMatch(astCoords, node) {
        return lineAndColumnMatch(astCoords.start, node.loc.start)
            && lineAndColumnMatch(astCoords.end, node.loc.end);
    }

    const isMatchingNode =
        (astCoords) =>
            (node) =>
                isExpressionNode(node)
                && nodeCoordsMatch(astCoords, node);

    const isNearMatch =
        (isMatchingNode) =>
            (astCoords) =>
                (node) =>
                    isMatchingNode(node)
                    && astHelper.coordsInNode(astCoords, node);

    const isNearNode = isNearMatch(isExpressionNode);
    const isNearIdentifierExpression = isNearMatch(isIdentifier);
    const isNearVariableOrFunction = isNearMatch(isVariableOrFunction);
    const isNearConditional = isNearMatch(isIfStatement);
    const isNearFunctionExpression = isNearMatch(isFunctionDeclarationOrExpression);
    const isNearBinaryExpression = isNearMatch(isBinaryExpression);

    const isIdentifierInScope =
        (astCoords) =>
            (node) =>
                isIdentifier(node)
                && astHelper.nodeInCoords(astCoords, node);

    const isVariableDeclarationInScope =
        (astCoords) =>
            (node) =>
                isVariabeDeclaration(node)
                && astHelper.nodeInCoords(astCoords, node);

    function getSelectionExpression(astCoords, ast) {
        let currentScope = null;
        const isSelectedNode = isMatchingNode(astCoords);

        astHelper.traverse(ast, {
            enter: astHelper.onMatch(
                (node) => currentScope === null && isSelectedNode(node),
                (node) => currentScope = node
            )
        });

        return currentScope;
    }

    function getNearestExpression(astCoords, ast) {
        let currentScope = null;
        let lastScope = ast;

        astHelper.traverse(ast, {
            enter: astHelper.onMatch(
                isNearNode(astCoords),
                function (node) {
                    if (!isWrappingNode(lastScope)) {
                        currentScope = node;
                    }

                    lastScope = node;
                }
            )
        });

        return currentScope;
    }

    function getNearestIdentifierExpression(astCoords, ast) {
        let currentScope = null;

        astHelper.traverse(ast, {
            enter: astHelper.onMatch(
                isNearIdentifierExpression(astCoords),
                function (node) {
                    currentScope = currentScope === null ? node : currentScope;
                }
            )
        });

        return currentScope;
    }

    function getNearestFunctionOrVariable(astCoords, ast) {
        let currentScope = null;

        astHelper.traverse(ast, {
            enter: astHelper.onMatch(
                isNearVariableOrFunction(astCoords),
                function (node) {
                    currentScope = node;
                }
            )
        });

        return currentScope;
    }

    function getNearestFunctionExpression(astCoords, ast) {
        let currentScope = null;

        astHelper.traverse(ast, {
            enter: astHelper.onMatch(
                isNearFunctionExpression(astCoords),
                function (node) {
                    currentScope = node;
                }
            )
        });

        return currentScope;
    }

    function getIdentifiersInScope(astCoords, ast) {
        let identifiers = [];

        astHelper.traverse(ast, {
            enter: astHelper.onMatch(
                isIdentifierInScope(astCoords),
                function (node) {
                    identifiers.push(node);
                }
            )
        });

        return identifiers;
    }

    function getVariableDeclarationsInScope(astCoords, ast) {
        let variableDeclarations = [];

        astHelper.traverse(ast, {
            enter: astHelper.onMatch(
                isVariableDeclarationInScope(astCoords),
                function (node) {
                    variableDeclarations.push(node);
                }
            )
        });

        return variableDeclarations;
    }

    function getNearestIfCondition(astCoords, ast) {
        let currentScope = null;

        astHelper.traverse(ast, {
            enter: astHelper.onMatch(
                isNearConditional(astCoords),
                node => currentScope = node
            )
        });

        return currentScope;
    }

    function getNearestStringNode(astCoords, ast) {
        let foundNode = null;

        astHelper.traverse(ast, {
            enter: astHelper.onMatch(
                (node) => isNearBinaryExpression(astCoords)(node) && foundNode === null,
                (node) => {
                    foundNode = node
                }
            )
        });

        return foundNode;
    }

    return {
        getIdentifiersInScope: typeHelper.enforce(
            'astCoords, ast => array<astNode>',
            getIdentifiersInScope),

        getSelectionExpression: typeHelper.enforce(
            'astCoords, ast => variant<null, astNode>',
            getSelectionExpression),

        getNearestExpression: typeHelper.enforce(
            'astCoords, ast => variant<null, astNode>',
            getNearestExpression),

        getNearestIfCondition: typeHelper.enforce(
            'astCoords, ast => variant<null, astNode>',
            getNearestIfCondition),

        getNearestFunctionExpression: typeHelper.enforce(
            'astCoords, ast => variant<null, astNode>',
            getNearestFunctionExpression),

        getNearestFunctionOrVariable: typeHelper.enforce(
            'astCoords, ast => variant<null, astNode>',
            getNearestFunctionOrVariable),

        getNearestIdentifierExpression: typeHelper.enforce(
            'astCoords, ast => variant<null, astNode>',
            getNearestIdentifierExpression),

        getNearestStringNode: typeHelper.enforce(
            'astCoords, ast => variant<null, astNode>',
            getNearestStringNode),

        getVariableDeclarationsInScope: typeHelper.enforce(
            'astCoords, ast => array<astNode>',
            getVariableDeclarationsInScope)
    };
}

module.exports = selectionExpressionHelper;