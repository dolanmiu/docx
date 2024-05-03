import { FootnoteRestartLocationType } from "@file/shared/footnote-properties";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

export class FootnoteRestartNumberingAttributes extends XmlAttributeComponent<{
    readonly restart: FootnoteRestartLocationType;
}> {
    protected readonly xmlKeys = {
        restart: "w:val",
    };
}

export class FootnoteNumberingRestart extends XmlComponent {
    public constructor(restart: FootnoteRestartLocationType) {
        super("w:numRestart");

        this.root.push(
            new FootnoteRestartNumberingAttributes({
                restart,
            }),
        );
    }
}
