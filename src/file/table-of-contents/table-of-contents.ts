// import { TableOfContentsProperties } from "./properties";
import { Paragraph, ParagraphProperties } from "file/paragraph";
import { Run } from "file/paragraph/run";
import { Begin, End, Separate } from "file/paragraph/run/field";
import { XmlComponent } from "file/xml-components";
import { TableOfContentsInstruction } from "./table-of-contents-instruction";

export class TableOfContents extends XmlComponent {
    // private readonly tocProperties: TableOfContentsProperties;
    private readonly properties: ParagraphProperties;

    private readonly instruction: TableOfContentsInstruction;

    constructor(/*tocProperties?: TableOfContentsProperties*/) {
        super("w:sdt");
        this.properties = new ParagraphProperties();
        this.instruction = new TableOfContentsInstruction();
        this.root.push(this.properties);
        // this.tocProperties = tocProperties || new TableOfContentsProperties();
        const beginParagraph = new Paragraph();
        const beginRun = new Run();
        beginRun.addChildElement(new Begin());
        beginRun.addChildElement(this.instruction);
        beginRun.addChildElement(new Separate());
        beginParagraph.addRun(beginRun);
        this.root.push(beginParagraph);

        const endParagraph = new Paragraph();
        const endRun = new Run();
        endRun.addChildElement(new End());
        endParagraph.addRun(endRun);
        this.root.push(endParagraph);
    }

    public getHeaderRange(): string {
        return this.instruction.getHeaderRange();
    }

    public addGeneratedContent(paragraph: Paragraph): void {
        this.root.splice(this.root.length - 1, 0, paragraph);
    }
}
