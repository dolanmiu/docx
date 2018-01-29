import { XmlComponent } from "file/xml-components";
import { HeaderReferenceAttributes } from "./header-reference-attributes";

export class HeaderReference extends XmlComponent {
    constructor() {
        super("w:headerReference");
        this.root.push(
            new HeaderReferenceAttributes({
                type: "default",
                id: `rId${3}`,
            }),
        );
    }
}
