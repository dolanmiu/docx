import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { File } from "../../file";
import { Compiler } from "./next-compiler";
import { IPacker } from "./packer";
import { PdfConvertWrapper } from "./pdf-convert-wrapper";

export class LocalPacker implements IPacker {
    private readonly pdfConverter: PdfConvertWrapper;
    private readonly packer: Compiler;

    constructor(file: File) {
        this.pdfConverter = new PdfConvertWrapper();
        this.packer = new Compiler(file);
    }

    public async pack(filePath: string): Promise<void> {
        filePath = filePath.replace(/.docx$/, "");

        const zip = await this.packer.compile();
        const zipData = await zip.generateAsync({ type: "base64" }) as string;

        await this.writeToFile(`${filePath}.docx`, zipData);
    }

    public async packPdf(filePath: string): Promise<void> {
        filePath = filePath.replace(/.pdf$/, "");

        const fileName = path.basename(filePath, path.extname(filePath));
        const tempPath = path.join(os.tmpdir(), `${fileName}.docx`);

        const zip = await this.packer.compile();
        const zipData = await zip.generateAsync({ type: "base64" }) as string;
        await this.writeToFile(tempPath, zipData);

        const text = await this.pdfConverter.convert(tempPath);
        // const writeFile = util.promisify(fs.writeFile); --use this in future, in 3 years time. Only in node 8
        // return writeFile(`${filePath}.pdf`, text);

        await this.writeToFile(`${filePath}.pdf`, text);
    }

    private writeToFile(filePath: string, data: string): Promise<void> {
        const file = fs.createWriteStream(filePath);

        return new Promise((resolve, reject) => {
            file.write(data, "base64");
            file.end();
            file.on("finish", () => {
                resolve();
            });
            file.on("error", reject);
        });
    }
}
