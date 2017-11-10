import * as fs from "fs";
import * as request from "request";

export interface IConvertOutput {
    data: string;
}

export class PdfConvertWrapper {
    public convert(): Promise<IConvertOutput> {
        const buffer = fs.readFileSync("test.docx");

        return new Promise<IConvertOutput>((resolve, reject) => {
            const r = request.post({
                url: "http://mirror1.convertonlinefree.com",
                encoding: null,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.94 Safari/537.36",
                },
            }, (err, response, body: IConvertOutput) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(body);
            });

            const form = r.form();
            form.append("__EVENTTARGET", "");
            form.append("__EVENTARGUMENT", "");
            form.append("__VIEWSTATE", "");
            form.append("ctl00$MainContent$fu", buffer, {
                filename: "output.docx",
                contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });

            form.append("ctl00$MainContent$btnConvert", "Convert");
            form.append("ctl00$MainContent$fuZip", "");
        });
    }
}
