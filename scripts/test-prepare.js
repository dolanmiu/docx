var fs = require('fs');

var data = fs.readFileSync('build/tests/tests/docxTest.js'); //read existing contents into data
var fd = fs.openSync('build/tests/tests/docxTest.js', 'w+');
var buffer = new Buffer('var docx = require("../docx/docx");');
fs.writeSync(fd, buffer, 0, buffer.length); //write new data
fs.writeSync(fd, data, 0, data.length); //append old data
fs.close(fd);