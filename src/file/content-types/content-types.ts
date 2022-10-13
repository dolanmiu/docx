import { XmlComponent } from "@file/xml-components";
import { ContentTypeAttributes } from "./content-types-attributes";
import { Default } from "./default/default";
import { Override } from "./override/override";

export class ContentTypes extends XmlComponent {
    public constructor() {
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

        this.root.push(
            new Override("application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml", "/word/document.xml"),
        );

        this.root.push(new Override("application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml", "/word/styles.xml"));
        this.root.push(new Override("application/vnd.openxmlformats-package.core-properties+xml", "/docProps/core.xml"));
        this.root.push(new Override("application/vnd.openxmlformats-officedocument.custom-properties+xml", "/docProps/custom.xml"));
        this.root.push(new Override("application/vnd.openxmlformats-officedocument.extended-properties+xml", "/docProps/app.xml"));
        this.root.push(new Override("application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml", "/word/numbering.xml"));
        this.root.push(new Override("application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml", "/word/footnotes.xml"));
        this.root.push(new Override("application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml", "/word/settings.xml"));
        this.root.push(new Override("application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml", "/word/comments.xml"));
    }

    public addFooter(index: number): void {
        this.root.push(
            new Override("application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml", `/word/footer${index}.xml`),
        );
    }

    public addHeader(index: number): void {
        this.root.push(
            new Override("application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml", `/word/header${index}.xml`),
        );
    }
}
