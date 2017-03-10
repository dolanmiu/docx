import * as appRoot from "app-root-path";
import * as archiver from "archiver";
import * as xml from "xml";
import { Document } from "../../docx";
import { Numbering } from "../../numbering";
import { Properties } from "../../properties";
import { Styles } from "../../styles";
import { DefaultStylesFactory } from "../../styles/factory";
import { Formatter } from "../formatter";

export abstract class Packer {
    protected archive: any;
    protected document: Document;
    private formatter: Formatter;
    private style: Styles;
    private properties: Properties;
    private numbering: Numbering;

    constructor(document: Document, style?: Styles, properties?: Properties, numbering?: Numbering) {
        this.formatter = new Formatter();
        this.document = document;
        this.archive = archiver.create("zip", {});

        if (style) {
            this.style = style;
        } else {
            const stylesFactory = new DefaultStylesFactory();
            this.style = stylesFactory.newInstance();
        }

        if (properties) {
            this.properties = properties;
        } else {
            this.properties = new Properties({
                creator: "Un-named",
                revision: "1",
                lastModifiedBy: "Un-named",
            });
        }

        if (numbering) {
            this.numbering = numbering;
        } else {
            this.numbering = new Numbering();
        }

        this.archive.on("error", (err) => {
            throw err;
        });
    }

    public pack(output: any): void {
        this.archive.pipe(output);
        this.archive.glob("**", {
            expand: true,
            cwd: appRoot.path + "/template",
        });

        this.archive.glob("**/.rels", {
            expand: true,
            cwd: appRoot.path + "/template",
        });

        const xmlDocument = xml(this.formatter.format(this.document));
        const xmlStyles = xml(this.formatter.format(this.style));
        const xmlProperties = xml(this.formatter.format(this.properties), { declaration: { standalone: "yes", encoding: "UTF-8" } });
        const xmlNumbering = xml(this.formatter.format(this.numbering));
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

        this.archive.finalize();
    }
}
