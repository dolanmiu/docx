import { XmlComponent } from "file/xml-components";
import { ColumnsAttributes } from "./columns-attributes";

export class Columns extends XmlComponent {
    constructor(space: number) {
        super("w:cols");
        this.root.push(
            new ColumnsAttributes({
                space: space,
            }),
        );
    }
}
