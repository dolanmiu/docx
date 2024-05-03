import { FootnotePositioningLocationType } from "@file/shared/footnote-properties";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

export class FootnotePositioningLocationAttributes extends XmlAttributeComponent<{
    readonly position: FootnotePositioningLocationType;
}> {
    protected readonly xmlKeys = {
        position: "w:val",
    };
}

export class FootnotePositioningLocation extends XmlComponent {
    public constructor(position: FootnotePositioningLocationType) {
        super("w:pos");

        this.root.push(
            new FootnotePositioningLocationAttributes({
                position,
            }),
        );
    }
}

