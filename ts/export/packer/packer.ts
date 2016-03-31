import * as archiver from "archiver";
import * as fs from "fs";
import {Formatter} from "../formatter";
import {Document} from "../../docx";

export abstract class Packer {
    protected archive: any;
    private formatter: Formatter;
    protected document: Document;

    constructor(document: Document) {
        this.formatter = new Formatter();
        this.document = document;
        this.archive = archiver.create("zip", {});

        this.archive.on('error', (err) => {
            throw err;
        });
    }

    pack(output: any): void {
        this.archive.pipe(output);

        this.archive.bulk([
            {
                expand: true,
                cwd: __dirname + '/template',
                src: ['**', '**/.rels']
            }
        ]);

        //this.archive.directory(__dirname + "/template", "/");

        this.archive.finalize();
    }
}