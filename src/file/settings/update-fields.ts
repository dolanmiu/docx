import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export class UpdateFieldsAttributes extends XmlAttributeComponent<{
    readonly enabled: boolean;
}> {
    protected readonly xmlKeys = {
        enabled: "w:val",
    };
}
export class UpdateFields extends XmlComponent {
    constructor(enabled: boolean = true) {
        super("w:updateFields");
        this.root.push(
            new UpdateFieldsAttributes({
                enabled,
            }),
        );
    }
}
