// Simple template example
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { fromDocx } from "../build";

fromDocx(fs.readFileSync("demo/template.docx")).then((doc) => {
    fs.writeFileSync("My Document.docx", doc);
});
