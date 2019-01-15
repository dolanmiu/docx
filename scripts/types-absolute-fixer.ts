import * as glob from "glob";
import * as replace from "replace-in-file";

const files = glob.sync("build/**/*.d.ts");

for (const file of files) {
    replace({
        files: file,
        from: /"file[a-z/-]*"/gi,
        to: (match) => {
            const matchSlug = match.replace(/['"]+/g, "").trim();
            const levelCount = file.split("/").length - 2;
            const backLevels = Array(levelCount)
                .fill("../")
                .join("");

            return `"${backLevels}${matchSlug}"`;
        },
    });
}
