/* eslint-disable no-console */
import fs from "fs";
import prompt, { Schema } from "prompt";
import { $ } from "execa";

console.log("What demo do you wish to run? (Enter a number)");

const schema: Schema = {
    properties: {
        demoNumber: {
            pattern: /^[0-9]+$/,
            message: "Please enter a number.",
            required: true,
        },
    },
};

prompt.start();

prompt.get(schema, async (_, result) => {
    const demoNumber = result.demoNumber as string;
    const files = fs.readdirSync("./demo").filter((fn) => fn.startsWith(demoNumber));

    if (files.length === 0) {
        console.error(`demo number ${demoNumber} does not exist`);
        return;
    }

    const filePath = `./demo/${files[0]}`;

    console.log(`Running demo ${demoNumber}: ${files[0]}`);
    await $`ts-node --project demo/tsconfig.json ${filePath}`;
    console.log("Successfully created document!");
});
