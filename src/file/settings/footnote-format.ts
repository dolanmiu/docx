import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { NumberFormat } from "@file/shared/number-format";

export class FootnoteNumberingFormatAttributes extends XmlAttributeComponent<{
    readonly numberFormat: (typeof NumberFormat)[keyof typeof NumberFormat];
}> {
    protected readonly xmlKeys = {
        numberFormat: "w:val",
    };
}

export class FootnoteNumberingFormat extends XmlComponent {
    public constructor(numberFormat: (typeof NumberFormat)[keyof typeof NumberFormat]) {
        super("w:numFmt");

        this.root.push(
            new FootnoteNumberingFormatAttributes({
                numberFormat,
            }),
        );
    }
}

