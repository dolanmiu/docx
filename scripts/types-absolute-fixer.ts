import * as glob from "glob";
import { replaceInFile } from "replace-in-file";

const files = glob.sync("build/**/*.d.ts");

for (const file of files) {
    replaceInFile({
        files: file,
        from: /"@[a-z/-]*"/gi,
        to: (match) => {
            const matchSlug = match.replace(/['"]+/g, "").replace(/[@]+/g, "").trim();
            const levelCount = file.split(/[\/\\]/).length - 2;
            const backLevels = Array(levelCount).fill("../").join("");

            return `"${backLevels}${matchSlug}"`;
        },
    });
}
