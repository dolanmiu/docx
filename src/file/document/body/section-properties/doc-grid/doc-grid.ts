import { XmlComponent } from "file/xml-components";
import { DocGridAttributes } from "./doc-grid-attributes";

export class DocumentGrid extends XmlComponent {
    constructor(linePitch: number) {
        super("w:docGrid");
        this.root.push(
            new DocGridAttributes({
                linePitch: linePitch,
            }),
        );
    }
}
