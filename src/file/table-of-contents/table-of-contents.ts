import { Paragraph } from "file/paragraph";
import { Run } from "file/paragraph/run";
import { Begin, End, Separate } from "file/paragraph/run/field";
import { XmlComponent } from "file/xml-components";
import { SdtContent } from "./sdt-content";
import { SdtProperties } from "./sdt-properties";
import { TableOfContentsInstruction } from "./table-of-contents-instruction";
import { ITableOfContentsOptions } from "./table-of-contents-properties";

export class TableOfContents extends XmlComponent {
    constructor(alias: string = "Table of Contents", properties?: ITableOfContentsOptions) {
        super("w:sdt");
        this.root.push(new SdtProperties(alias));

        const content = new SdtContent();

        const beginParagraph = new Paragraph();
        const beginRun = new Run();
        beginRun.addChildElement(new Begin(true));
        beginRun.addChildElement(new TableOfContentsInstruction(properties));
        beginRun.addChildElement(new Separate());
        beginParagraph.addRun(beginRun);
        content.addChildElement(beginParagraph);

        const endParagraph = new Paragraph();
        const endRun = new Run();
        endRun.addChildElement(new End());
        endParagraph.addRun(endRun);
        content.addChildElement(endParagraph);

        this.root.push(content);
    }
}
