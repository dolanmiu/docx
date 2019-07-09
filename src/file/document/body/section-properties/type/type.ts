import { XmlComponent } from "file/xml-components";
import { TypeAttributes } from "./type-attributes";

export class Type extends XmlComponent {
    constructor(val: string) {
        super("w:type");
        this.root.push(
            new TypeAttributes({
                val: val,
            }),
        );
    }
}
