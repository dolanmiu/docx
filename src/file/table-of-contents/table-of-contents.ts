// http://officeopenxml.com/WPtableOfContents.php
// http://www.datypic.com/sc/ooxml/e-w_sdt-1.html
import { Paragraph } from "file/paragraph";
import { Run } from "file/paragraph/run";
import { Begin, End, Separate } from "file/paragraph/run/field";
import { XmlComponent } from "file/xml-components";
import { FieldInstruction } from "./field-instruction";
import { StructuredDocumentTagContent } from "./sdt-content";
import { StructuredDocumentTagProperties } from "./sdt-properties";
import { ITableOfContentsOptions } from "./table-of-contents-properties";

export class TableOfContents extends XmlComponent {
    constructor(alias: string = "Table of Contents", properties?: ITableOfContentsOptions) {
        super("w:sdt");
        this.root.push(new StructuredDocumentTagProperties(alias));

        const content = new StructuredDocumentTagContent();

        const beginParagraph = new Paragraph();
        const beginRun = new Run();
        beginRun.addChildElement(new Begin(true));
        beginRun.addChildElement(new FieldInstruction(properties));
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
