import { XmlComponent } from "file/xml-components";
import { HeaderReferenceAttributes } from "./header-reference-attributes";

export class HeaderReference extends XmlComponent {
    constructor(order: string, refID: number) {
        super("w:headerReference");
        this.root.push(
            new HeaderReferenceAttributes({
                type: order,
                id: `rId${refID}`,
            }),
        );
    }
}
