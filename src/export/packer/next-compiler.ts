import * as JSZip from "jszip";
import * as xml from "xml";

import { File } from "file";
import { Formatter } from "../formatter";

interface IXmlifyedFile {
    data: string;
    path: string;
}

interface IXmlifyedFileMapping {
    Document: IXmlifyedFile;
    Styles: IXmlifyedFile;
    Properties: IXmlifyedFile;
    Numbering: IXmlifyedFile;
    Relationships: IXmlifyedFile;
    FileRelationships: IXmlifyedFile;
    Header: IXmlifyedFile;
    Footer: IXmlifyedFile;
    HeaderRelationships: IXmlifyedFile;
    FooterRelationships: IXmlifyedFile;
    ContentTypes: IXmlifyedFile;
    AppProperties: IXmlifyedFile;
}

export class Compiler {
    private readonly formatter: Formatter;

    constructor(private readonly file: File) {
        this.formatter = new Formatter();
    }

    public async compile(): Promise<JSZip> {
        const zip = new JSZip();

        const xmlifiedFileMapping = this.xmlifyFile(this.file);

        for (const key in xmlifiedFileMapping) {
            if (!xmlifiedFileMapping[key]) {
                continue;
            }

            const xmlifiedFile = xmlifiedFileMapping[key];

            zip.file(xmlifiedFile.path, xmlifiedFile.data);
        }

        for (const data of this.file.Media.Array) {
            const mediaData = data.stream;
            zip.file(`word/media/${data.fileName}`, mediaData);
        }

        return zip;
    }

    private xmlifyFile(file: File): IXmlifyedFileMapping {
        return {
            Document: {
                data: xml(this.formatter.format(file.Document), true),
                path: "word/document.xml",
            },
            Styles: {
                data: xml(this.formatter.format(file.Styles)),
                path: "word/styles.xml",
            },
            Properties: {
                data: xml(this.formatter.format(file.CoreProperties), {
                    declaration: {
                        standalone: "yes",
                        encoding: "UTF-8",
                    },
                }),
                path: "docProps/core.xml",
            },
            Numbering: {
                data: xml(this.formatter.format(file.Numbering)),
                path: "word/numbering.xml",
            },
            Relationships: {
                data: xml(this.formatter.format(file.DocumentRelationships)),
                path: "word/_rels/document.xml.rels",
            },
            FileRelationships: {
                data: xml(this.formatter.format(file.FileRelationships)),
                path: "_rels/.rels",
            },
            Header: {
                data: xml(this.formatter.format(file.Header.Header)),
                path: "word/header1.xml",
            },
            Footer: {
                data: xml(this.formatter.format(file.Footer.Footer)),
                path: "word/footer1.xml",
            },
            HeaderRelationships: {
                data: xml(this.formatter.format(file.Header.Relationships)),
                path: "word/_rels/header1.xml.rels",
            },
            FooterRelationships: {
                data: xml(this.formatter.format(file.Footer.Relationships)),
                path: "word/_rels/footer1.xml.rels",
            },
            ContentTypes: {
                data: xml(this.formatter.format(file.ContentTypes)),
                path: "[Content_Types].xml",
            },
            AppProperties: {
                data: xml(this.formatter.format(file.AppProperties)),
                path: "docProps/app.xml",
            },
        };
    }
}
