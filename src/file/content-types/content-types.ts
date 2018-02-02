import { XmlComponent } from "file/xml-components";
import { ContentTypeAttributes } from "./content-types-attributes";

export class ContentTypes extends XmlComponent {
    constructor() {
        super("Types");

        this.root.push(
            new ContentTypeAttributes({
                xmlns: "http://schemas.openxmlformats.org/package/2006/content-types",
            }),
        );
    }
}
