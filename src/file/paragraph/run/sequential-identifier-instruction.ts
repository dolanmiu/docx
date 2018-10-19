// http://officeopenxml.com/WPfieldInstructions.php
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

enum SpaceType {
    DEFAULT = "default",
    PRESERVE = "preserve",
}

class TextAttributes extends XmlAttributeComponent<{ space: SpaceType }> {
    protected xmlKeys = { space: "xml:space" };
}

export class SequentialIdentifierInstruction extends XmlComponent {
    constructor(identifier: string) {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        this.root.push(`SEQ ${identifier}`);
    }
}
