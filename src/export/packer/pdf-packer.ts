import * as request from "request-promise";

import { File } from "file";
import { Packer } from "./packer";

export class PdfPacker {
    private readonly packer: Packer;

    constructor() {
        this.packer = new Packer();
    }

    public async toBuffer(file: File): Promise<Buffer> {
        const buffer = await this.packer.toBuffer(file);
        const text = await this.convert(buffer);

        return text;
    }

    private convert(buffer: Buffer): request.RequestPromise {
        return request.post({
            url: "http://mirror1.convertonlinefree.com",
            // tslint:disable-next-line:no-null-keyword
            encoding: null,
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.94 Safari/537.36",
            },
            formData: {
                __EVENTTARGET: "",
                __EVENTARGUMENT: "",
                __VIEWSTATE: "",
                ctl00$MainContent$fu: {
                    value: buffer,
                    options: {
                        filename: "output.docx",
                        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    },
                },
                ctl00$MainContent$btnConvert: "Convert",
                ctl00$MainContent$fuZip: "",
            },
        });
    }
}
