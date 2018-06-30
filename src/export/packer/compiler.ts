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
        const xmlContentTypes = xml(this.formatter.format(this.file.ContentTypes));
        const xmlAppProperties = xml(this.formatter.format(this.file.AppProperties));
        const xmlFootnotes = xml(this.formatter.format(this.file.FootNotes));

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

        // headers
        for (let i = 0; i < this.file.Headers.length; i++) {
            const element = this.file.Headers[i];
            this.archive.append(xml(this.formatter.format(element.Header)), {
                name: `word/header${i + 1}.xml`,
            });

            this.archive.append(xml(this.formatter.format(element.Relationships)), {
                name: `word/_rels/header${i + 1}.xml.rels`,
            });
        }

        // footers
        for (let i = 0; i < this.file.Footers.length; i++) {
            const element = this.file.Footers[i];
            this.archive.append(xml(this.formatter.format(element.Footer)), {
                name: `word/footer${i + 1}.xml`,
            });

            this.archive.append(xml(this.formatter.format(element.Relationships)), {
                name: `word/_rels/footer${i + 1}.xml.rels`,
            });
        }

        this.archive.append(xmlFootnotes, {
            name: "word/footnotes.xml",
        });

        this.archive.append(xmlRelationships, {
            name: "word/_rels/document.xml.rels",
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
