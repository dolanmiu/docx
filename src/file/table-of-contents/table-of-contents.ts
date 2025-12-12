// http://officeopenxml.com/WPtableOfContents.php
// http://www.datypic.com/sc/ooxml/e-w_sdt-1.html
import { FileChild } from "@file/file-child";
import { InternalHyperlink, Paragraph, TabStopDefinition } from "@file/paragraph";
import { Run, Tab } from "@file/paragraph/run";
import { Begin, End, Separate } from "@file/paragraph/run/field";
import { Text } from "@file/paragraph/run/run-components/text";

import { FieldInstruction } from "./field-instruction";
import { StructuredDocumentTagContent } from "./sdt-content";
import { StructuredDocumentTagProperties } from "./sdt-properties";
import { ITableOfContentsOptions } from "./table-of-contents-properties";

type ToCEntry = {
    readonly title: string;
    readonly level: number;
    readonly page?: number;
    readonly href?: string;
};

export class TableOfContents extends FileChild {
    public constructor(alias: string = "Table of Contents", properties?: ITableOfContentsOptions, cachedContent: readonly ToCEntry[] = []) {
        super("w:sdt");
        this.root.push(new StructuredDocumentTagProperties(alias));

        const content = new StructuredDocumentTagContent();

        const beginParagraphChildren =
            cachedContent.length >= 1 ? [this.buildCachedContentParagraphChild(cachedContent[0], properties)] : [];

        const getTabStops = (level: number): readonly TabStopDefinition[] => {
            const levelSpace = 720;
            const levelPosition = 9026 - (level - 1) * levelSpace; // TODO: should be equal to page width + 1 - level margin
            return [
                {
                    type: "clear",
                    position: levelPosition,
                },
                {
                    type: "right",
                    position: 9025, // TODO: should be equal to page width
                    leader: "dot",
                },
            ];
        };

        const beginParagraph = new Paragraph({
            style: cachedContent.length >= 1 ? `TOC${cachedContent[0].level}` : undefined,
            tabStops: getTabStops(cachedContent.length >= 1 ? cachedContent[0].level : 1),
            children: [
                new Run({
                    children: [new Begin(true), new FieldInstruction(properties), new Separate()],
                }),
                ...beginParagraphChildren,
            ],
        });

        content.addChildElement(beginParagraph);

        const middleParagraphs = cachedContent.slice(1, -1).map(
            (entry) =>
                new Paragraph({
                    style: `TOC${entry.level}`,
                    tabStops: getTabStops(entry.level),
                    children: [this.buildCachedContentParagraphChild(entry, properties)],
                }),
        );

        for (const paragraph of middleParagraphs) {
            content.addChildElement(paragraph);
        }

        const endParagraphChildren =
            cachedContent.length > 1 ? [this.buildCachedContentParagraphChild(cachedContent[cachedContent.length - 1], properties)] : [];

        const endParagraph = new Paragraph({
            style: cachedContent.length > 1 ? `TOC${cachedContent[cachedContent.length - 1].level}` : undefined,
            tabStops: getTabStops(cachedContent.length > 1 ? cachedContent[cachedContent.length - 1].level : 1),
            children: [
                ...endParagraphChildren,
                new Run({
                    children: [new End()],
                }),
            ],
        });

        content.addChildElement(endParagraph);

        this.root.push(content);
    }

    private buildCachedContentRun(entry: ToCEntry, properties?: ITableOfContentsOptions): Run {
        return new Run({
            style: properties?.hyperlink && entry.href !== undefined ? "IndexLink" : undefined,
            children: [
                new Text({
                    text: entry.title,
                }),
                new Tab(),
                new Text({
                    text: entry.page?.toString() ?? "",
                }),
            ],
        });
    }

    private buildCachedContentParagraphChild(entry: ToCEntry, properties?: ITableOfContentsOptions): Run | InternalHyperlink {
        const run = this.buildCachedContentRun(entry);
        if (properties?.hyperlink && entry.href !== undefined) {
            return new InternalHyperlink({
                anchor: entry.href,
                children: [run],
            });
        }

        return run;
    }
}
