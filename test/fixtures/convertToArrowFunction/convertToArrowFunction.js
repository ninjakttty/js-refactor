'use strict';

const mySimpleFunction = function (value) {
    return value;
}

function fnWithNoArgs(foo, bar) {
    console.log('testing 1');
    console.log('testing 2');
}

function myNamedFunction(value) {
    return value;
}

const myFunction = function (foo, { bar, baz }, ...rest) {
    console.log(foo, bar);
    console.log(baz, rest);
}

var f = (function () {
    return foo;
});

var f = (function (a) {
    if (true) a = 0;
});

// const something = {};

// const somethingElse = something.?else;