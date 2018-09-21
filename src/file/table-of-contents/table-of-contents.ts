// import { TableOfContentsProperties } from "./properties";
import { Paragraph } from "file/paragraph";
import { Run } from "file/paragraph/run";
import { Begin, End, Separate } from "file/paragraph/run/field";
import { XmlComponent } from "file/xml-components";
import { SdtContent } from "./sdt-content";
import { SdtProperties } from "./sdt-properties";
import { TableOfContentsInstruction } from "./table-of-contents-instruction";

export class TableOfContents extends XmlComponent {
    // private readonly tocProperties: TableOfContentsProperties;
    private readonly properties: SdtProperties;

    private readonly content: SdtContent;

    private readonly instruction: TableOfContentsInstruction;

    constructor(/*tocProperties?: TableOfContentsProperties*/) {
        super("w:sdt");
        this.properties = new SdtProperties("Table of Contents");
        this.content = new SdtContent();
        this.instruction = new TableOfContentsInstruction();
        this.root.push(this.properties);
        this.root.push(this.content);
        // this.tocProperties = tocProperties || new TableOfContentsProperties();
        const beginParagraph = new Paragraph();
        const beginRun = new Run();
        beginRun.addChildElement(new Begin());
        beginRun.addChildElement(this.instruction);
        beginRun.addChildElement(new Separate());
        beginParagraph.addRun(beginRun);
        this.content.addChildElement(beginParagraph);

        const endParagraph = new Paragraph();
        const endRun = new Run();
        endRun.addChildElement(new End());
        endParagraph.addRun(endRun);
        this.content.addChildElement(endParagraph);
    }

    public getHeaderRange(): string {
        return this.instruction.getHeaderRange();
    }

    public addGeneratedContent(paragraph: Paragraph): void {
        this.content.addGeneratedContent(paragraph);
    }
}
