import { XmlComponent } from "file/xml-components";
import { HeaderReferenceAttributes, HeaderReferenceType } from "./header-reference-attributes";

export interface IHeaderOptions {
    headerType?: HeaderReferenceType;
    headerId?: number;
}

export class HeaderReference extends XmlComponent {
    constructor(options: IHeaderOptions) {
        super("w:headerReference");
        this.root.push(
            new HeaderReferenceAttributes({
                type: options.headerType || HeaderReferenceType.DEFAULT,
                id: `rId${options.headerId}`,
            }),
        );
    }
}
