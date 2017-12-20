import { XmlComponent } from "../docx/xml-components";
import { RelationshipsAttributes } from "./attributes";

export class Relationships extends XmlComponent {

    constructor() {
        super("Relationships");
        this.root.push(new RelationshipsAttributes({
            xmlns: "http://schemas.openxmlformats.org/package/2006/relationships",
        }));

        // this.root.push(new Created());
    }
}
