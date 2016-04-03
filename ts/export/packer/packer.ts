import * as archiver from "archiver";
import * as fs from "fs";
import {Formatter} from "../formatter";
import {Document} from "../../docx";
import {Style} from "../../style";
import {Properties} from "../../properties";

export abstract class Packer {
    protected archive: any;
    private formatter: Formatter;
    protected document: Document;
    private style: Style;
    private properties: Properties;

    constructor(document: Document, style: any, properties: Properties) {
        this.formatter = new Formatter();
        this.document = document;
        this.style = style;
        this.properties = properties;
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

        this.archive.append(this.document, {
            name: 'word/document.xml'
        });

        this.archive.append(this.style, {
            name: 'word/newStyle.xml'
        });

        this.archive.append(this.properties, {
            name: 'docProps/core.xml'
        });

        this.archive.finalize();
    }
}