import { XmlComponent } from "file/xml-components";
import { FooterReferenceAttributes, FooterReferenceType } from "./footer-reference-attributes";

export interface FooterOptions {
    footerType?: FooterReferenceType;
    footerId?: number;
}

export class FooterReference extends XmlComponent {
    constructor(options: FooterOptions) {
        super("w:footerReference");

        this.root.push(
            new FooterReferenceAttributes({
                type: options.footerType || FooterReferenceType.DEFAULT,
                id: `rId${options.footerId}`,
            }),
        );
    }
}
