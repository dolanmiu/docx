import * as archiver from "archiver";
import * as express from "express";
import { Writable } from "stream";
import * as xml from "xml";

import { File } from "file";
import { Formatter } from "../formatter";

export class Compiler {
    protected archive: archiver.Archiver;
    private formatter: Formatter;

    constructor(private file: File) {
        this.formatter = new Formatter();
        this.archive = archiver.create("zip", {});

        this.archive.on("error", (err) => {
            throw err;
        });
    }

    public async compile(output: Writable | express.Response): Promise<void> {
        this.archive.pipe(output);

        const xmlDocument = xml(this.formatter.format(this.file.Document), true);
        const xmlStyles = xml(this.formatter.format(this.file.Styles));
        const xmlProperties = xml(this.formatter.format(this.file.CoreProperties), {
            declaration: {
                standalone: "yes",
                encoding: "UTF-8",
            },
        });
        const xmlNumbering = xml(this.formatter.format(this.file.Numbering));
        const xmlRelationships = xml(this.formatter.format(this.file.DocumentRelationships));
        const xmlFileRelationships = xml(this.formatter.format(this.file.FileRelationships));
        const xmlHeader = xml(this.formatter.format(this.file.Header.Header));

        const xmlHeader2 = xml(this.formatter.format(this.file.Header2.Header));

        const xmlFooter = xml(this.formatter.format(this.file.Footer.Footer));
        const xmlHeaderRelationships = xml(this.formatter.format(this.file.Header.Relationships));
        const xmlFooterRelationships = xml(this.formatter.format(this.file.Footer.Relationships));
        const xmlContentTypes = xml(this.formatter.format(this.file.ContentTypes));
        const xmlAppProperties = xml(this.formatter.format(this.file.AppProperties));


        this.archive.append(xmlDocument, {
            name: "word/document.xml",
        });

        this.archive.append(xmlStyles, {
            name: "word/styles.xml",
        });

        this.archive.append(xmlProperties, {
            name: "docProps/core.xml",
        });

        this.archive.append(xmlAppProperties, {
            name: "docProps/app.xml",
        });

        this.archive.append(xmlNumbering, {
            name: "word/numbering.xml",
        });

        this.archive.append(xmlHeader, {
            name: "word/header1.xml",
        });



        this.archive.append(xmlHeader2, {
            name: "word/header2.xml",
        });
        


        this.archive.append(xmlFooter, {
            name: "word/footer1.xml",
        });

        this.archive.append(xmlRelationships, {
            name: "word/_rels/document.xml.rels",
        });

        this.archive.append(xmlHeaderRelationships, {
            name: "word/_rels/header1.xml.rels",
        });

        this.archive.append(xmlFooterRelationships, {
            name: "word/_rels/footer1.xml.rels",
        });

        this.archive.append(xmlContentTypes, {
            name: "[Content_Types].xml",
        });

        this.archive.append(xmlFileRelationships, {
            name: "_rels/.rels",
        });

        for (const data of this.file.Media.array) {
            this.archive.append(data.stream, {
                name: `word/media/${data.fileName}`,
            });
        }

        this.archive.finalize();

        return new Promise<void>((resolve) => {
            output.on("close", () => {
                resolve();
            });
        });
    }
}
