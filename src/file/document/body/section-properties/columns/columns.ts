import { XmlComponent } from "file/xml-components";
import { ColumnsAttributes } from "./columns-attributes";

export class Columns extends XmlComponent {
    constructor(space: number, num: number, separate: boolean) {
        super("w:cols");
        this.root.push(
            new ColumnsAttributes({
                space: space,
                num: num,
                separate: separate,
            }),
        );
    }
}
