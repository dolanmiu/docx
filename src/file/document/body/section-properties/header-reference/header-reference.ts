import { XmlComponent } from "file/xml-components";
import { HeaderReferenceAttributes, HeaderReferenceType } from "./header-reference-attributes";

export interface HeaderOptions {
    headerType?: HeaderReferenceType;
    headerId?: number;
}

export class HeaderReference extends XmlComponent {
    constructor(options: HeaderOptions) {
        super("w:headerReference");
        this.root.push(
            new HeaderReferenceAttributes({
                type: options.headerType || HeaderReferenceType.DEFAULT,
                id: `rId${options.headerId}`,
            }),
        );
    }
}
