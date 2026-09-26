/* eslint-disable no-console */
// Runs a demo. The demos are in a folder for each topic, such as demo/tables/basic-table.ts
//
//   npm run demo                      pick a demo from the list, typing to search it
//   npm run demo tables/basic-table   run that demo
//   npm run demo basic-table          run the demo with that name
//   npm run demo tables               pick from the demos in that topic
//   npm run demo table border         run the only demo matching every word, or pick from the ones that do
import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import { $ } from "execa";

const dir = "./demo";

// Every demo, as its topic and name, such as "tables/basic-table"
const demos = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "assets")
    .flatMap((topic) =>
        fs
            .readdirSync(path.join(dir, topic.name))
            .filter((file) => file.endsWith(".ts"))
            .map((file) => `${topic.name}/${path.parse(file).name}`),
    )
    .sort();

// The demos whose topic or name has every word of the search in it
const search = (term: string): readonly string[] => {
    const words = term.toLowerCase().split(/\s+/).filter(Boolean);

    return demos.filter((demo) => words.every((word) => demo.includes(word)));
};

// A path to a demo works too, such as demo/tables/basic-table.ts
const term = process.argv
    .slice(2)
    .join(" ")
    .replace(/^(\.\/)?demo\//, "")
    .replace(/\.ts$/, "");
const topics = new Set(demos.map((demo) => path.dirname(demo)));
// A demo's name runs it, but a topic's name lists its demos, even when one of them has the topic's name
const found = demos.includes(term) ? [term] : topics.has(term) ? [] : demos.filter((demo) => demo.endsWith(`/${term}`));
const matches = found.length === 1 ? found : search(term);

let demo: string;
if (matches.length === 0) {
    console.error(`No demo matches "${term}". Run npm run demo to pick one from the list`);
    process.exit(1);
} else if (term && matches.length === 1) {
    demo = matches[0];
} else {
    const answers = await inquirer.prompt<{ readonly demo: string }>([
        {
            type: "search",
            name: "demo",
            message: "Which demo do you want to run? Type to search",
            source: (input: string | undefined) => search(input ?? ""),
            initialValue: term,
            pageSize: 20,
        },
    ]);
    demo = answers.demo;
}

const filePath = path.join(dir, `${demo}.ts`);
console.log(`Running demo ${demo}`);
const { stdout } = await $`tsx ${filePath}`;
console.log(stdout);
console.log("Successfully created document!");
