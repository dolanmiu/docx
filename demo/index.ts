// tslint:disable:no-console
import * as fs from "fs";
import * as prompt from "prompt";
import * as shelljs from "shelljs";

console.log("What demo do you wish to run? (Enter a number)");

const schema = {
    properties: {
        number: {
            pattern: /^[0-9]+$/,
            message: "Please enter a number.",
            required: true,
        },
    },
};

prompt.start();

prompt.get(schema, (_, result) => {
    const demoNumber = result.number;
    const filePath = `./demo/demo${demoNumber}.ts`;

    if (!fs.existsSync(filePath)) {
        console.error(`demo${demoNumber} does not exist: ${filePath}`);
        return;
    }
    console.log(`Running demo ${demoNumber}`);
    if (shelljs.exec(`npm run ts-node -- ${filePath}`).code === 0) {
        console.log("Document created successfully");
    } else {
        console.error("Something went wrong with the demo");
    }
});
