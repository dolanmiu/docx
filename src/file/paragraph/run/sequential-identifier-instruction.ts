// http://officeopenxml.com/WPfieldInstructions.php
import { SpaceType } from "@file/space-type";
import { XmlComponent } from "@file/xml-components";

import { TextAttributes } from "./text-attributes";

export class SequentialIdentifierInstruction extends XmlComponent {
    public constructor(identifier: string) {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        this.root.push(`SEQ ${identifier}`);
    }
}
