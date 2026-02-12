import { XmlComponent } from "@file/xml-components";

import { ContentTypeAttributes } from "./content-types-attributes";
import { createDefault } from "./default/default";
import { createOverride } from "./override/override";

export class ContentTypes extends XmlComponent {
    public constructor() {
        super("Types");

        this.root.push(
            new ContentTypeAttributes({
                xmlns: "http://schemas.openxmlformats.org/package/2006/content-types",
            }),
        );

        this.root.push(createDefault("image/png", "png"));
        this.root.push(createDefault("image/jpeg", "jpeg"));
        this.root.push(createDefault("image/jpeg", "jpg"));
        this.root.push(createDefault("image/bmp", "bmp"));
        this.root.push(createDefault("image/gif", "gif"));
        this.root.push(createDefault("image/svg+xml", "svg"));
        this.root.push(createDefault("application/vnd.openxmlformats-package.relationships+xml", "rels"));
        this.root.push(createDefault("application/xml", "xml"));
        this.root.push(createDefault("application/vnd.openxmlformats-officedocument.obfuscatedFont", "odttf"));

        this.root.push(
            createOverride("application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml", "/word/document.xml"),
        );

        this.root.push(createOverride("application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml", "/word/styles.xml"));
        this.root.push(createOverride("application/vnd.openxmlformats-package.core-properties+xml", "/docProps/core.xml"));
        this.root.push(createOverride("application/vnd.openxmlformats-officedocument.custom-properties+xml", "/docProps/custom.xml"));
        this.root.push(createOverride("application/vnd.openxmlformats-officedocument.extended-properties+xml", "/docProps/app.xml"));
        this.root.push(
            createOverride("application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml", "/word/numbering.xml"),
        );
        this.root.push(
            createOverride("application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml", "/word/footnotes.xml"),
        );
        this.root.push(createOverride("application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml", "/word/settings.xml"));
        this.root.push(createOverride("application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml", "/word/comments.xml"));
        this.root.push(
            createOverride("application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml", "/word/fontTable.xml"),
        );
    }

    public addFooter(index: number): void {
        this.root.push(
            createOverride("application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml", `/word/footer${index}.xml`),
        );
    }

    public addHeader(index: number): void {
        this.root.push(
            createOverride("application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml", `/word/header${index}.xml`),
        );
    }
}
