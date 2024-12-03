// http://officeopenxml.com/WPtext.php
import { FootnoteReferenceRun } from "@file/footnotes/footnote/run/reference-run";
import { FieldInstruction } from "@file/table-of-contents/field-instruction";
import { XmlComponent } from "@file/xml-components";

import { Break } from "./break";
import {
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
import { Begin, End, Separate } from "./field";
import { CurrentSection, NumberOfPages, NumberOfPagesSection, Page } from "./page-number";
import { PositionalTab } from "./positional-tab";
import { IRunPropertiesOptions, RunProperties } from "./properties";
import { Text } from "./run-components/text";

export type IRunOptions = {
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
        | Begin
        | FieldInstruction
        | Separate
        | End
        | (typeof PageNumber)[keyof typeof PageNumber]
        | FootnoteReferenceRun
        | Break
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
        | PositionalTab
        | string
    )[];
    readonly break?: number;
    readonly text?: string;
} & IRunPropertiesOptions;

export const PageNumber = {
    CURRENT: "CURRENT",
    TOTAL_PAGES: "TOTAL_PAGES",
    TOTAL_PAGES_IN_SECTION: "TOTAL_PAGES_IN_SECTION",
    CURRENT_SECTION: "SECTION",
} as const;

export class Run extends XmlComponent {
    protected readonly properties: RunProperties;

    public constructor(options: IRunOptions) {
        super("w:r");
        this.properties = new RunProperties(options);
        this.root.push(this.properties);

        if (options.break) {
            for (let i = 0; i < options.break; i++) {
                this.root.push(new Break());
            }
        }

        if (options.children) {
            for (const child of options.children) {
                if (typeof child === "string") {
                    switch (child) {
                        case PageNumber.CURRENT:
                            this.root.push(new Begin());
                            this.root.push(new Page());
                            this.root.push(new Separate());
                            this.root.push(new End());
                            break;
                        case PageNumber.TOTAL_PAGES:
                            this.root.push(new Begin());
                            this.root.push(new NumberOfPages());
                            this.root.push(new Separate());
                            this.root.push(new End());
                            break;
                        case PageNumber.TOTAL_PAGES_IN_SECTION:
                            this.root.push(new Begin());
                            this.root.push(new NumberOfPagesSection());
                            this.root.push(new Separate());
                            this.root.push(new End());
                            break;
                        case PageNumber.CURRENT_SECTION:
                            this.root.push(new Begin());
                            this.root.push(new CurrentSection());
                            this.root.push(new Separate());
                            this.root.push(new End());
                            break;
                        default:
                            this.root.push(new Text(child));
                            break;
                    }
                    continue;
                }

                this.root.push(child);
            }
        } else if (options.text !== undefined) {
            this.root.push(new Text(options.text));
        }
    }
}
