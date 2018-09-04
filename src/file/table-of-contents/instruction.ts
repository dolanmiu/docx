import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

class TextAttributes extends XmlAttributeComponent<{ space: "default" | "preserve" }> {
    protected xmlKeys = { space: "xml:space" };
}

/**
 * Options according to this docs:
 * http://officeopenxml.com/WPtableOfContents.php
 */

export class StyleLevel {
    public styleName: string;
    public level: number;
}
export class TableOfContentsInstructionProperties {
    // \b option
    public entriesFromSession: string;
    // \h option
    public hiperlink: true;
    // \n option
    public entryLevelsRange = "1-6";
    // \o option
    public headerRange: string;
    // \t option
    public styles: StyleLevel[];
    // \z option
}

export class TableOfContentsInstruction extends XmlComponent {
    private readonly properties: TableOfContentsInstructionProperties;

    constructor(properties?: TableOfContentsInstructionProperties) {
        super("w:instrText");
        this.properties = properties || new TableOfContentsInstructionProperties();

        this.root.push(new TextAttributes({ space: "preserve" }));
        let instruction = "TOC";
        if (this.properties.entriesFromSession) {
            instruction = `${instruction} \\b "${this.properties.entriesFromSession}"`;
        }
        if (this.properties.hiperlink) {
            instruction = `${instruction} \\h`;
        }
        if (this.properties.entryLevelsRange) {
            instruction = `${instruction} \\n "${this.properties.entryLevelsRange}"`;
        }
        if (this.properties.headerRange) {
            instruction = `${instruction} \\o "${this.properties.headerRange}"`;
        }
        if (this.properties.styles && this.properties.styles.length) {
            const styles = this.properties.styles.map((sl) => `${sl.styleName}, ${sl.level}`).join(", ");
            instruction = `${instruction} \\t "${styles}"`;
        }
        this.root.push(instruction);
    }
}
