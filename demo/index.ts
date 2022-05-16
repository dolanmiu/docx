// tslint:disable:no-console
import fs from "fs";
import prompt from "prompt";
import shelljs from "shelljs";

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

prompt.get(schema as any, (_, result) => {
    const demoNumber = result.number as string;
    const files = fs.readdirSync("./demo").filter((fn) => fn.startsWith(demoNumber));

    if (files.length === 0) {
        console.error(`demo number ${demoNumber} does not exist`);
        return;
    }

    const filePath = `./demo/${files[0]}`;

    console.log(`Running demo ${demoNumber}: ${files[0]}`);
    if (shelljs.exec(`npm run ts-node -- ${filePath}`).code === 0) {
        console.log("Document created successfully");
    } else {
        console.error("Something went wrong with the demo");
    }
});
