/**
 * Run module for WordprocessingML documents.
 *
 * A run is a region of text with a common set of properties. It is the primary
 * unit of inline content in a paragraph.
 *
 * Reference: http://officeopenxml.com/WPtext.php
 *
 * @module
 */
import type { FootnoteReferenceRun } from "@file/footnotes/footnote/run/reference-run";
import type { FieldInstruction } from "@file/table-of-contents/field-instruction";
import { type BaseXmlComponent, XmlComponent, elementOf } from "@file/xml-components";

import { createBreak } from "./break";
import type {
    AnnotationReference,
    CarriageReturn,
    ContinuationSeparator,
    DayLong,
    DayShort,
    EndnoteReference,
    FootnoteReferenceElement,
    LastRenderedPageBreak,
    MonthLong,
    MonthShort,
    NoBreakHyphen,
    PageNumberElement,
    Separator,
    SoftHyphen,
    Tab,
    YearLong,
    YearShort,
} from "./empty-children";
import { createBegin, createEnd, createSeparate } from "./field";
import { CurrentSection, NumberOfPages, NumberOfPagesSection, Page } from "./page-number";
import { type IParagraphRunPropertiesOptions, type IRunPropertiesOptions, RunProperties } from "./properties";
import { Text } from "./run-components/text";

type IRunOptionsBase = {
    // <xsd:choice>
    //     <xsd:element name="br" type="CT_Br" />
    //     <xsd:element name="t" type="CT_Text" />
    //     <xsd:element name="contentPart" type="CT_Rel" />
    //     <xsd:element name="delText" type="CT_Text" />
    //     <xsd:element name="instrText" type="CT_Text" />
    //     <xsd:element name="delInstrText" type="CT_Text" />
    //     <xsd:element name="noBreakHyphen" type="CT_Empty" />
    //     <xsd:element name="softHyphen" type="CT_Empty" minOccurs="0" />
    //     <xsd:element name="dayShort" type="CT_Empty" minOccurs="0" />
    //     <xsd:element name="monthShort" type="CT_Empty" minOccurs="0" />
    //     <xsd:element name="yearShort" type="CT_Empty" minOccurs="0" />
    //     <xsd:element name="dayLong" type="CT_Empty" minOccurs="0" />
    //     <xsd:element name="monthLong" type="CT_Empty" minOccurs="0" />
    //     <xsd:element name="yearLong" type="CT_Empty" minOccurs="0" />
    //     <xsd:element name="annotationRef" type="CT_Empty" minOccurs="0" />
    //     <xsd:element name="footnoteRef" type="CT_Empty" minOccurs="0" />
    //     <xsd:element name="endnoteRef" type="CT_Empty" minOccurs="0" />
    //     <xsd:element name="separator" type="CT_Empty" minOccurs="0" />
    //     <xsd:element name="continuationSeparator" type="CT_Empty" minOccurs="0" />
    //     <xsd:element name="sym" type="CT_Sym" minOccurs="0" />
    //     <xsd:element name="pgNum" type="CT_Empty" minOccurs="0" />
    //     <xsd:element name="cr" type="CT_Empty" minOccurs="0" />
    //     <xsd:element name="tab" type="CT_Empty" minOccurs="0" />
    //     <xsd:element name="object" type="CT_Object" />
    //     <xsd:element name="pict" type="CT_Picture" />
    //     <xsd:element name="fldChar" type="CT_FldChar" />
    //     <xsd:element name="ruby" type="CT_Ruby" />
    //     <xsd:element name="footnoteReference" type="CT_FtnEdnRef" />
    //     <xsd:element name="endnoteReference" type="CT_FtnEdnRef" />
    //     <xsd:element name="commentReference" type="CT_Markup" />
    //     <xsd:element name="drawing" type="CT_Drawing" />
    //     <xsd:element name="ptab" type="CT_PTab" minOccurs="0" />
    //     <xsd:element name="lastRenderedPageBreak" type="CT_Empty" minOccurs="0" maxOccurs="1" />
    // </xsd:choice>
    readonly children?: readonly (
        | FieldInstruction
        | (typeof PageNumber)[keyof typeof PageNumber]
        | FootnoteReferenceRun
        | AnnotationReference
        | CarriageReturn
        | ContinuationSeparator
        | DayLong
        | DayShort
        | EndnoteReference
        | FootnoteReferenceElement
        | LastRenderedPageBreak
        | MonthLong
        | MonthShort
        | NoBreakHyphen
        | PageNumberElement
        | Separator
        | SoftHyphen
        | Tab
        | YearLong
        | YearShort
        | XmlComponent
        | string
    )[];
    readonly break?: number;
    readonly text?: string;
};

/**
 * Options for creating a Run element.
 *
 * The run element specifies a region of text with a common set of properties.
 * The children property can contain various inline content elements.
 *
 * @see {@link Run}
 */
export type IRunOptions = IRunOptionsBase & IRunPropertiesOptions;

export type IParagraphRunOptions = IRunOptionsBase & IParagraphRunPropertiesOptions;

/**
 * Constants for page number field types.
 *
 * These values are used to insert dynamic page number fields into a document.
 *
 * Reference: http://officeopenxml.com/WPfields.php
 *
 * @publicApi
 */
export const PageNumber = {
    /** Inserts the current page number */
    CURRENT: "CURRENT",
    /** Inserts the total number of pages in the document */
    TOTAL_PAGES: "TOTAL_PAGES",
    /** Inserts the total number of pages in the current section */
    TOTAL_PAGES_IN_SECTION: "TOTAL_PAGES_IN_SECTION",
    /** Inserts the current section number */
    CURRENT_SECTION: "SECTION",
} as const;

/** The parts of the field a page number child shows, in order, or undefined when the child is text */
const pageNumberFieldOf = (child: string): readonly XmlComponent[] | undefined => {
    switch (child) {
        case PageNumber.CURRENT:
            return [createBegin(), new Page(), createSeparate(), createEnd()];
        case PageNumber.TOTAL_PAGES:
            return [createBegin(), new NumberOfPages(), createSeparate(), createEnd()];
        case PageNumber.TOTAL_PAGES_IN_SECTION:
            return [createBegin(), new NumberOfPagesSection(), createSeparate(), createEnd()];
        case PageNumber.CURRENT_SECTION:
            return [createBegin(), new CurrentSection(), createSeparate(), createEnd()];
        default:
            return undefined;
    }
};

/**
 * Represents a run of text with uniform formatting in a WordprocessingML document.
 *
 * A run is the lowest level unit of text in a paragraph. All content within a run
 * shares the same formatting properties (bold, italic, font, size, etc.).
 *
 * Reference: http://officeopenxml.com/WPtext.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_R">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_RPr" minOccurs="0"/>
 *     <xsd:group ref="EG_RunInnerContent" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="rsidRPr" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidDel" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidR" type="ST_LongHexNumber"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Simple run with text
 * new Run({ text: "Hello World" });
 *
 * // Bold and italic run
 * new Run({ text: "Formatted", bold: true, italics: true });
 *
 * // Run with page number
 * new Run({ children: [PageNumber.CURRENT] });
 * ```
 */
export class Run extends XmlComponent {
    protected readonly properties: RunProperties;
    // A run given in the children, such as a FootnoteReferenceRun, or the runs of a page number field, then the run of
    // the children after it
    private readonly following: readonly Run[] = [];

    public constructor(options: IRunOptions) {
        super("w:r");
        this.properties = new RunProperties(options);
        this.root.push(this.properties);

        if (options.break) {
            for (let i = 0; i < options.break; i++) {
                this.root.push(createBreak());
            }
        }

        if (options.children) {
            for (const [index, child] of options.children.entries()) {
                if (elementOf(child) === "w:r") {
                    // A run can't be inside another, so this run ends before it, and the children after it go in a run
                    // with this run's properties. The run may be from another copy of docx
                    const rest = options.children.slice(index + 1);
                    this.following = [
                        child as Run,
                        ...(rest.length > 0 ? [new Run({ ...options, break: undefined, children: rest })] : []),
                    ];
                    break;
                }

                if (typeof child === "string") {
                    const field = pageNumberFieldOf(child);
                    if (field) {
                        // Each part of the field is written in a run of its own with this run's properties, as Word
                        // writes fields. LibreOffice doesn't format a field in a run with other content by the run's
                        // properties, nor the text after it, so a page number in a run's font was drawn in the default
                        // one. The field begins this run when it is the first thing in it, and the children after it go
                        // in a run with this run's properties
                        const rest = options.children.slice(index + 1);
                        const runOf = (children: NonNullable<IRunOptions["children"]>): Run =>
                            new Run({ ...options, break: undefined, children });
                        const beginsHere = this.root.length === 1;
                        if (beginsHere) {
                            this.root.push(field[0]);
                        }
                        const parts = beginsHere ? field.slice(1) : field;
                        this.following = [...parts.map((part) => runOf([part])), ...(rest.length > 0 ? [runOf(rest)] : [])];
                        break;
                    }

                    this.root.push(new Text(child));
                    continue;
                }

                this.root.push(child);
            }
        } else if (options.text !== undefined) {
            this.root.push(new Text(options.text));
        }
    }

    public get writtenAs(): readonly BaseXmlComponent[] | undefined {
        // This run, then the ones after it, each written as it would be on its own
        return this.following.length > 0 ? [this, ...this.following.flatMap((run) => run.writtenAs ?? run)] : undefined;
    }
}
