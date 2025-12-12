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

        const beginParagraphMandatoryChidlren = [
            new Run({
                children: [new Begin(true), new FieldInstruction(properties), new Separate()],
            }),
        ];

        const endParagraphMandatoryChildren = [
            new Run({
                children: [new End()],
            }),
        ];

        const cachedParagraphs = cachedContent.map((entry, i) => {
            const contentChild = this.buildCachedContentParagraphChild(entry, properties);
            const children =
                i === 0
                    ? [...beginParagraphMandatoryChidlren, contentChild]
                    : i === cachedContent.length - 1
                      ? [contentChild, ...endParagraphMandatoryChildren]
                      : [contentChild];

            return new Paragraph({
                style: `TOC${entry.level}`,
                tabStops: this.getTabStopsForLevel(entry.level),
                children,
            });
        });

        let paragraphs = cachedParagraphs;
        if (cachedContent.length <= 0) {
            paragraphs = [
                new Paragraph({
                    children: beginParagraphMandatoryChidlren,
                }),
                new Paragraph({
                    children: endParagraphMandatoryChildren,
                }),
            ];
        } else if (cachedContent.length <= 1) {
            paragraphs = [
                ...cachedParagraphs,
                new Paragraph({
                    children: endParagraphMandatoryChildren,
                }),
            ];
        }

        for (const paragraph of paragraphs) {
            content.addChildElement(paragraph);
        }

        this.root.push(content);
    }

    private getTabStopsForLevel(level: number, pageWidth: number = 9025): readonly TabStopDefinition[] {
        const levelSpace = 720;
        const levelPosition = pageWidth + 1 - (level - 1) * levelSpace; // TODO: should be equal to page width + 1 - level margin
        return [
            {
                type: "clear",
                position: levelPosition,
            },
            {
                type: "right",
                position: pageWidth,
                leader: "dot",
            },
        ];
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
