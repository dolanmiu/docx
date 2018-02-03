import { XmlComponent } from "file/xml-components";
import { ContentTypeAttributes } from "./content-types-attributes";
import { Default } from "./default/default";

export class ContentTypes extends XmlComponent {
    constructor() {
        super("Types");

        this.root.push(
            new ContentTypeAttributes({
                xmlns: "http://schemas.openxmlformats.org/package/2006/content-types",
            }),
        );

        this.root.push(new Default("image/png", "png"));
        this.root.push(new Default("image/jpeg", "jpeg"));
        this.root.push(new Default("image/jpeg", "jpg"));
        this.root.push(new Default("image/bmp", "bmp"));
        this.root.push(new Default("image/gif", "gif"));
        this.root.push(new Default("application/vnd.openxmlformats-package.relationships+xml", "rels"));
        this.root.push(new Default("application/xml", "xml"));

        this.root.push(new Default("application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml", undefined, "/word/document.xml"));
        this.root.push(new Default("application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml", undefined, "/word/header1.xml"));
        this.root.push(new Default("application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml", undefined, "/word/footer1.xml"));
        this.root.push(new Default("application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml", undefined, "/word/styles.xml"));
        this.root.push(new Default("application/vnd.openxmlformats-package.core-properties+xml", undefined, "/docProps/core.xml"));
        this.root.push(new Default("application/vnd.openxmlformats-officedocument.extended-properties+xml", undefined, "/docProps/app.xml"));
        this.root.push(new Default("application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml", undefined, "/word/numbering.xml"));

    }
}
