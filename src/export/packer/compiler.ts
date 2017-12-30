import * as archiver from "archiver";
import * as express from "express";
import * as fs from "fs";
import * as path from "path";
import * as xml from "xml";

import { File } from "file";
import { Formatter } from "../formatter";

const TEMPLATE_PATH = path.resolve(__dirname, "../../../template");

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

    public async compile(output: fs.WriteStream | express.Response): Promise<void> {
        this.archive.pipe(output);
        this.archive.glob("**", {
            cwd: TEMPLATE_PATH,
        });

        this.archive.glob("**/.rels", {
            cwd: TEMPLATE_PATH,
        });

        const xmlDocument = xml(this.formatter.format(this.file.Document));
        const xmlStyles = xml(this.formatter.format(this.file.Styles));
        const xmlProperties = xml(this.formatter.format(this.file.Properties), {
            declaration: {
                standalone: "yes",
                encoding: "UTF-8",
            },
        });
        const xmlNumbering = xml(this.formatter.format(this.file.Numbering));

        this.archive.append(xmlDocument, {
            name: "word/document.xml",
        });

        this.archive.append(xmlStyles, {
            name: "word/styles.xml",
        });

        this.archive.append(xmlProperties, {
            name: "docProps/core.xml",
        });

        this.archive.append(xmlNumbering, {
            name: "word/numbering.xml",
        });

        for (const data of this.file.Media.array) {
            this.archive.append(data.stream, {
                name: `media/${data.fileName}`,
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
