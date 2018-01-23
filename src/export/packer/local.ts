import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { File } from "../../file";
import { Compiler } from "./compiler";
import { IPacker } from "./packer";
import { PdfConvertWrapper } from "./pdf-convert-wrapper";

export class LocalPacker implements IPacker {
    private stream: fs.WriteStream;
    private pdfConverter: PdfConvertWrapper;
    private packer: Compiler;

    constructor(file: File) {
        this.pdfConverter = new PdfConvertWrapper();
        this.packer = new Compiler(file);
    }

    public async pack(filePath: string): Promise<void> {
        filePath = filePath.replace(/.docx$/, "");

        this.stream = fs.createWriteStream(`${filePath}.docx`);
        await this.packer.compile(this.stream);
    }

    public async packPdf(filePath: string): Promise<void> {
        filePath = filePath.replace(/.pdf$/, "");

        const fileName = path.basename(filePath, path.extname(filePath));
        const tempPath = path.join(os.tmpdir(), `${fileName}.docx`);
        this.stream = fs.createWriteStream(tempPath);
        await this.packer.compile(this.stream);
        const text = await this.pdfConverter.convert(tempPath);
        // const writeFile = util.promisify(fs.writeFile); --use this in future, in 3 years time. Only in node 8
        // return writeFile(`${filePath}.pdf`, text);
        return new Promise<void>((resolve, reject) => {
            fs.writeFile(`${filePath}.pdf`, text, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
}
