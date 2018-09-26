import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

class AliasAttributes extends XmlAttributeComponent<{ alias: string }> {
    protected xmlKeys = { alias: "w:val" };
}

export class Alias extends XmlComponent {
    constructor(alias: string) {
        super("w:alias");
        this.root.push(new AliasAttributes({ alias }));
    }
}
