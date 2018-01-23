import { Attributes, XmlComponent } from "file/xml-components";

export class MultiLevelType extends XmlComponent {
    constructor(value: string) {
        super("w:multiLevelType");
        this.root.push(
            new Attributes({
                val: value,
            }),
        );
    }
}
