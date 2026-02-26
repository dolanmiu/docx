import { XmlComponent } from "../xml-components";
import { EmptyElement, NumberValueElement, StringValueElement } from "../xml-components/simple-elements";
import { Begin, End, Separate } from "../paragraph/run/field";
import { Run, TextRun } from "../paragraph/run";
import { SpaceType } from "../shared/space-type";
import { TextAttributes } from "../paragraph/run/text-attributes";

export interface ICitationFieldOptions {
    readonly tag: string;
    readonly displayText: string;
    readonly locator?: string;
    readonly extraTags?: readonly string[];
    readonly locale?: number;
    readonly superScript?: boolean;
}

class CitationSdtProperties extends XmlComponent {
    public constructor(tag: string) {
        super("w:sdtPr");
        this.root.push(new StringValueElement("w:tag", `CITATION ${tag}`));
        this.root.push(new NumberValueElement("w:id", Math.floor(Math.random() * 2147483647)));
        this.root.push(new EmptyElement("w:citation"));
    }
}

class CitationInstrText extends XmlComponent {
    public constructor(instruction: string) {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        this.root.push(instruction);
    }
}

class CitationSdtContent extends XmlComponent {
    public constructor(options: ICitationFieldOptions) {
        super("w:sdtContent");

        const locale = options.locale ?? 1033;
        const multiSwitch =
            options.extraTags && options.extraTags.length > 0
                ? " " + options.extraTags.map((t) => `\\m ${t}`).join(" ")
                : "";
        const locatorSwitch = options.locator ? ` \\p ${options.locator}` : "";
        const instruction = ` CITATION ${options.tag}${multiSwitch}${locatorSwitch} \\l ${locale} `;

        this.root.push(new Run({ children: [new Begin()] }));
        this.root.push(new Run({ children: [new CitationInstrText(instruction)] }));
        this.root.push(new Run({ children: [new Separate()] }));
        this.root.push(
            new TextRun({
                text: options.displayText,
                noProof: true,
                superScript: options.superScript,
            }),
        );
        this.root.push(new Run({ children: [new End()] }));
    }
}

/**
 * Represents a native Word citation as an inline Structured Document Tag.
 *
 * Produces the XML structure that Word uses for its managed citations:
 * w:sdt > (w:sdtPr + w:sdtContent) containing CITATION field codes.
 *
 * Word recognizes this structure and links it to the bibliography
 * in customXml, enabling the References tab and bibliography management.
 */
export class CitationField extends XmlComponent {
    public constructor(options: ICitationFieldOptions) {
        super("w:sdt");
        this.root.push(new CitationSdtProperties(options.tag));
        this.root.push(new CitationSdtContent(options));
    }
}
