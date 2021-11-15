import { FootnoteReferenceRun } from "../../file/footnotes/footnote/run/reference-run";
import { IContext, IXmlableObject, XmlComponent } from "../../file/xml-components";
import { DeletedTextRun, InsertedTextRun } from "../track-revision";
import { ColumnBreak, PageBreak } from "./formatting/break";
import { Bookmark, ExternalHyperlink, InternalHyperlink } from "./links";
import { Math } from "./math";
import { IParagraphPropertiesOptions } from "./properties";
import { ImageRun, Run, SequentialIdentifier, SimpleField, SimpleMailMergeField, SymbolRun, TextRun } from "./run";
export declare type ParagraphChild = TextRun | ImageRun | SymbolRun | Bookmark | PageBreak | ColumnBreak | SequentialIdentifier | FootnoteReferenceRun | InternalHyperlink | ExternalHyperlink | InsertedTextRun | DeletedTextRun | Math | SimpleField | SimpleMailMergeField;
export interface IParagraphOptions extends IParagraphPropertiesOptions {
    readonly text?: string;
    readonly children?: ParagraphChild[];
}
export declare class Paragraph extends XmlComponent {
    private readonly properties;
    constructor(options: string | IParagraphOptions);
    prepForXml(context: IContext): IXmlableObject | undefined;
    addRunToFront(run: Run): Paragraph;
}
