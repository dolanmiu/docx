import * as fs from "fs";
import * as request from "request-promise";

export interface IConvertOutput {
    data: string;
}

export class PdfConvertWrapper {
    public convert(filePath: string): request.RequestPromise {
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
                    value: fs.readFileSync(filePath),
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
