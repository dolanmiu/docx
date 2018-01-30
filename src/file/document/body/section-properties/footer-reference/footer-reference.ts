import { XmlComponent } from "file/xml-components";
import { FooterReferenceAttributes } from "./footer-reference-attributes";

export class FooterReference extends XmlComponent {
    constructor() {
        super("w:footerReference");
        this.root.push(
            new FooterReferenceAttributes({
                type: "default",
                id: `rId${4}`,
            }),
        );
    }
}
