/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import { $ } from "execa";

export type Answers = {
    readonly type: "list" | "number";
    readonly demoNumber?: number;
    readonly demoFile?: number;
};

const dir = "./demo";
const fileNames = fs.readdirSync(dir);

const keys = fileNames.map((f) => path.parse(f).name);
const getFileNumber = (file: string): number => {
    const [firstPart] = file.split("-");

    return Number(firstPart);
};

const demoFiles = keys.filter((file) => !isNaN(getFileNumber(file))).sort((a, b) => getFileNumber(a) - getFileNumber(b));

const answers = await inquirer.prompt<Answers>([
    {
        type: "list",
        name: "type",
        message: "Select demo from a list or via number",
        choices: ["list", "number"],
    },
    {
        type: "list",
        name: "demoFile",
        message: "What demo do you wish to run?",
        choices: demoFiles,
        filter: (input) => parseInt(input.split("-")[0], 10),
        when: (a) => a.type === "list",
    },
    {
        type: "number",
        name: "demoNumber",
        message: "What demo do you wish to run? (Enter a number)",
        default: 1,
        when: (a) => a.type === "number",
    },
]);

const demoNumber = answers.demoNumber ?? answers.demoFile ?? 1;
const files = fs.readdirSync(dir).filter((fn) => fn.startsWith(demoNumber.toString()));

if (files.length === 0) {
    console.error(`demo number ${demoNumber} does not exist`);
} else {
    const filePath = path.join(dir, files[0]);

    console.log(`Running demo ${demoNumber}: ${files[0]}`);
    const { stdout } = await $`tsx ${filePath}`;
    console.log(stdout);
    console.log("Successfully created document!");
}
