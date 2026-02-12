/**
 * Table of Contents module for WordprocessingML documents.
 *
 * This module provides support for generating a table of contents
 * based on heading styles in the document.
 *
 * Reference: http://officeopenxml.com/WPtableOfContents.php
 *
 * @module
 */
import { FileChild } from "@file/file-child";
import { InternalHyperlink, Paragraph, TabStopDefinition } from "@file/paragraph";
import { Run, Tab } from "@file/paragraph/run";
import { createBegin, createEnd, createSeparate } from "@file/paragraph/run/field";
import { Text } from "@file/paragraph/run/run-components/text";
import { XmlComponent } from "@file/xml-components";

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

/**
 * Represents a Table of Contents in a WordprocessingML document.
 *
 * TableOfContents creates an auto-generated list of document headings
 * with page numbers. It uses a TOC field code to generate entries.
 *
 * Reference: http://officeopenxml.com/WPtableOfContents.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SdtBlock">
 *   <xsd:sequence>
 *     <xsd:element name="sdtPr" type="CT_SdtPr" minOccurs="0"/>
 *     <xsd:element name="sdtEndPr" type="CT_SdtEndPr" minOccurs="0"/>
 *     <xsd:element name="sdtContent" type="CT_SdtContentBlock" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new TableOfContents("Contents", {
 *   hyperlink: true,
 *   headingStyleRange: "1-3",
 * });
 * ```
 */
export class TableOfContents extends FileChild {
    public constructor(
        alias: string = "Table of Contents",
        {
            contentChildren = [],
            cachedEntries = [],
            beginDirty = true,
            ...properties
        }: ITableOfContentsOptions & {
            readonly contentChildren?: readonly (XmlComponent | string)[];
            /**
             * Use this to provide pre-generated entries for the Table of Contents.
             *
             * Note that indentation should come from the paragraph styles defined on the document. By default the styles are TOC1, TOC2, etc. These can be overridden with stylesWithLevels (\t)
             */
            readonly cachedEntries?: readonly ToCEntry[];
            readonly beginDirty?: boolean;
        } = {},
    ) {
        super("w:sdt");
        this.root.push(new StructuredDocumentTagProperties(alias));

        const content = new StructuredDocumentTagContent();

        const beginParagraphMandatoryChildren = [
            new Run({
                children: [createBegin(beginDirty), new FieldInstruction(properties), createSeparate()],
            }),
        ];

        const endParagraphMandatoryChildren = [
            new Run({
                children: [createEnd()],
            }),
        ];

        const hasCachedContent = cachedEntries !== undefined && cachedEntries.length > 0;

        if (hasCachedContent) {
            const { stylesWithLevels } = properties;
            const cachedParagraphs = cachedEntries.map((entry, i) => {
                const contentChild = this.buildCachedContentParagraphChild(entry, properties);
                const style = stylesWithLevels?.find((s) => s.level === entry.level)?.styleName ?? `TOC${entry.level}`;
                const children =
                    i === 0
                        ? [...beginParagraphMandatoryChildren, contentChild]
                        : i === cachedEntries.length - 1
                          ? [contentChild, ...endParagraphMandatoryChildren]
                          : [contentChild];

                return new Paragraph({
                    style,
                    tabStops: this.getTabStopsForLevel(entry.level),
                    children,
                });
            });

            let paragraphs = cachedParagraphs;
            if (cachedEntries.length <= 1) {
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
        } else {
            const beginParagraph = new Paragraph({
                children: beginParagraphMandatoryChildren,
            });

            content.addChildElement(beginParagraph);

            for (const child of contentChildren) {
                content.addChildElement(child);
            }

            const endParagraph = new Paragraph({
                children: endParagraphMandatoryChildren,
            });

            content.addChildElement(endParagraph);
        }

        this.root.push(content);
    }

    private getTabStopsForLevel(level: number, pageWidth: number = 9025): readonly TabStopDefinition[] {
        const levelSpace = 240;
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
            // TODO: The IndexLink style might always need to be set regardless of the hyperlink property. This needs to be verified.
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
        const run = this.buildCachedContentRun(entry, properties);
        if (properties?.hyperlink && entry.href !== undefined) {
            return new InternalHyperlink({
                anchor: entry.href,
                children: [run],
            });
        }

        return run;
    }
}
