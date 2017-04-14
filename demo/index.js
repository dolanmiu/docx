var prompt = require('prompt');
var shelljs = require('shelljs');
var fs = require('fs');

console.log('What demo do you wish to run? (Enter a number)');

var schema = {
    properties: {
        number: {
            pattern: /^[0-9]+$/,
            message: 'Please enter a number.',
            required: true
        }
    }
};

prompt.start();

prompt.get(schema, function (err, result) {
    var demoNumber = result.number;
    var filePath = `./demo/demo${demoNumber}.js`;

    if (!fs.existsSync(filePath)) {
        console.error(`demo${demoNumber} does not exist: ${filePath}`);
        return;
    }
    console.log(`Running demo ${demoNumber}`);
    shelljs.exec(`node ${filePath}`);
});
