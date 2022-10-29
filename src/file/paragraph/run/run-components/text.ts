import { SpaceType } from "@file/shared";
import { XmlComponent } from "@file/xml-components";

import { TextAttributes } from "../text-attributes";

export class Text extends XmlComponent {
    public constructor(text: string) {
        super("w:t");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));

        this.root.push(text);
    }
}
