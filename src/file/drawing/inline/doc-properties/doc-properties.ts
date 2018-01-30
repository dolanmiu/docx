import { XmlComponent } from "file/xml-components";
import { DocPropertiesAttributes } from "./doc-properties-attributes";

export class DocProperties extends XmlComponent {
    constructor() {
        super("wp:docPr");

        this.root.push(
            new DocPropertiesAttributes({
                id: 0,
                name: "",
                descr: "",
            }),
        );
    }
}
