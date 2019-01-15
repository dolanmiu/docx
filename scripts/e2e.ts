// tslint:disable:no-console
import * as fs from "fs";
import * as request from "request-promise";

async function e2e(filePath: string): Promise<void> {
    console.log(`Running e2e for: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        console.error("File not found");
        throw Error("File not found");
    }

    const result = await request.post({
        url: "https://wt-9017166451e5dc00461b648d19f5e8da-0.sandbox.auth0-extend.com/docx-validator",
        formData: {
            document: fs.createReadStream(filePath),
        },
    });

    return result;
}

e2e(process.argv[2])
    .then(() => {
        console.log("Success! Document is valid");
    })
    .catch(() => {
        console.log("Error! Validation failed");
        process.exit(1);
    });
