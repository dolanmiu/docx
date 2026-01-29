// http://officeopenxml.com/WPtableOfContents.php
// http://www.datypic.com/sc/ooxml/e-w_sdt-1.html
import { FileChild } from "@file/file-child";
import { Paragraph } from "@file/paragraph";
import { Run } from "@file/paragraph/run";
import { Begin, End, Separate } from "@file/paragraph/run/field";
import { XmlComponent } from "@file/xml-components";

import { FieldInstruction } from "./field-instruction";
import { StructuredDocumentTagContent } from "./sdt-content";
import { StructuredDocumentTagProperties } from "./sdt-properties";
import { ITableOfContentsOptions } from "./table-of-contents-properties";

export class TableOfContents extends FileChild {
    public constructor(
        alias: string = "Table of Contents",
        {
            contentChildren,
            beginDirty,
            ...properties
        }: ITableOfContentsOptions & {
            readonly contentChildren?: readonly (XmlComponent | string)[];
            readonly beginDirty?: boolean;
        } = { contentChildren: [], beginDirty: true },
    ) {
        super("w:sdt");
        this.root.push(new StructuredDocumentTagProperties(alias));

        const content = new StructuredDocumentTagContent();

        const beginParagraph = new Paragraph({
            children: [
                new Run({
                    children: [new Begin(beginDirty), new FieldInstruction(properties), new Separate()],
                }),
            ],
        });

        content.addChildElement(beginParagraph);

        if (contentChildren) {
            for (const child of contentChildren) {
                content.addChildElement(child);
            }
        }

        const endParagraph = new Paragraph({
            children: [
                new Run({
                    children: [new End()],
                }),
            ],
        });

        content.addChildElement(endParagraph);

        this.root.push(content);
    }
}
