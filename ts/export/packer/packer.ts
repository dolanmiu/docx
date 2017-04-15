import * as archiver from "archiver";
import * as fs from "fs";
import * as path from "path";
import * as xml from "xml";
import { Document } from "../../docx";
import { Media } from "../../media";
import { Numbering } from "../../numbering";
import { Properties } from "../../properties";
import { Styles } from "../../styles";
import { DefaultStylesFactory } from "../../styles/factory";
import { Formatter } from "../formatter";

const TEMPLATE_PATH = path.resolve(__dirname, "../../../template");

export abstract class Packer {
    protected archive: any;
    private formatter: Formatter;
    private style: Styles;

    constructor(
        protected document: Document,
        style?: Styles,
        private properties: Properties = new Properties({
            creator: "Un-named",
            revision: "1",
            lastModifiedBy: "Un-named",
        }),
        private numbering: Numbering = new Numbering(),
        private media: Media = new Media(),
    ) {
        this.formatter = new Formatter();
        this.archive = archiver.create("zip", {});

        if (style) {
            this.style = style;
        } else {
            const stylesFactory = new DefaultStylesFactory();
            this.style = stylesFactory.newInstance();
        }

        this.archive.on("error", (err) => {
            throw err;
        });
    }

    public pack(output: Express.Response | fs.WriteStream): void {
        this.archive.pipe(output);
        this.archive.glob("**", {
            expand: true,
            cwd: TEMPLATE_PATH,
        });

        this.archive.glob("**/.rels", {
            expand: true,
            cwd: TEMPLATE_PATH,
        });

        const xmlDocument = xml(this.formatter.format(this.document));
        const xmlStyles = xml(this.formatter.format(this.style));
        const xmlProperties = xml(this.formatter.format(this.properties), {
            declaration: {
                standalone: "yes",
                encoding: "UTF-8",
            },
        });
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

        for (const data of this.media.array) {
            this.archive.append(data.stream, {
                name: `media/${data.fileName}`,
            });
        }

        this.archive.finalize();
    }
}
