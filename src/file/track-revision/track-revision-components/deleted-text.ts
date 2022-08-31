import { TextAttributes } from "@file/paragraph/run/text-attributes";
import { SpaceType } from "@file/space-type";
import { XmlComponent } from "@file/xml-components";

export class DeletedText extends XmlComponent {
    public constructor(text: string) {
        super("w:delText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));

        this.root.push(text);
    }
}
