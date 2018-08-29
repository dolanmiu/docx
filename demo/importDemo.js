"use strict";
exports.__esModule = true;
var build_1 = require("../build");
var fs = require("fs");
var importDocx = new build_1.ImportDocx();
fs.readFile("./src/import/template.dotx", function (err, data) {
    if (err) {
        console.log(err);
    }
    else {
        importDocx.read(data);
    }
});
