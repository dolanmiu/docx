import * as archiver from "archiver";
import * as fs from "fs";
import * as xml from "xml";
import {Formatter} from "../formatter";
import {Document} from "../../docx";
import {Style} from "../../style";
import {Properties} from "../../properties";
var appRoot = require('app-root-path');

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
console.log(appRoot.path);
        this.archive.bulk([
            {
                expand: true,
                cwd: appRoot.path + '/template',
                src: ['**', '**/.rels']
            }
        ]);

        //this.archive.directory(__dirname + "/template", "/");
        var xmlDocument = xml(this.formatter.format(this.document));
        var xmlStyle = xml(this.style);
        var xmlProperties = xml(this.formatter.format(this.properties));

        console.log(JSON.stringify(this.formatter.format(this.document), null, "  "));
        console.log(xmlDocument);

        this.archive.append(xmlDocument, {
            name: 'word/document.xml'
        });

        this.archive.append(xmlStyle, {
            name: 'word/newStyle.xml'
        });

        this.archive.append(xmlProperties, {
            name: 'docProps/core.xml'
        });

        this.archive.finalize();
    }
}