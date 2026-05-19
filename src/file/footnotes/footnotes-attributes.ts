/**
 * Footnotes attributes module for WordprocessingML documents.
 *
 * This module defines XML namespace attributes for the footnotes element.
 *
 * Reference: http://officeopenxml.com/WPfootnotes.php
 *
 * @module
 */
import { XmlAttributeComponent } from "@file/xml-components";

/**
 * Represents the XML namespace attributes for the footnotes root element.
 *
 * FootnotesAttributes defines all necessary XML namespace declarations
 * for the footnotes.xml part of a WordprocessingML document.
 *
 * @internal
 */
export class FootnotesAttributes extends XmlAttributeComponent<{
    /** WordprocessingCanvas namespace */
    readonly wpc?: string;
    /** Markup Compatibility namespace */
    readonly mc?: string;
    /** Office namespace */
    readonly o?: string;
    /** Relationships namespace */
    readonly r?: string;
    /** Math namespace */
    readonly m?: string;
    /** VML namespace */
    readonly v?: string;
    /** WordprocessingDrawing 2010 namespace */
    readonly wp14?: string;
    /** WordprocessingDrawing namespace */
    readonly wp?: string;
    /** Office Word 2003 namespace */
    readonly w10?: string;
    /** WordprocessingML main namespace */
    readonly w?: string;
    /** WordprocessingML 2010 namespace */
    readonly w14?: string;
    /** WordprocessingML 2012 namespace */
    readonly w15?: string;
    /** WordprocessingGroup namespace */
    readonly wpg?: string;
    /** WordprocessingInk namespace */
    readonly wpi?: string;
    /** WordprocessingML namespace extension */
    readonly wne?: string;
    /** WordprocessingShape namespace */
    readonly wps?: string;
    /** Markup compatibility ignorable namespaces */
    readonly Ignorable?: string;
}> {
    protected readonly xmlKeys = {
        wpc: "xmlns:wpc",
        mc: "xmlns:mc",
        o: "xmlns:o",
        r: "xmlns:r",
        m: "xmlns:m",
        v: "xmlns:v",
        wp14: "xmlns:wp14",
        wp: "xmlns:wp",
        w10: "xmlns:w10",
        w: "xmlns:w",
        w14: "xmlns:w14",
        w15: "xmlns:w15",
        wpg: "xmlns:wpg",
        wpi: "xmlns:wpi",
        wne: "xmlns:wne",
        wps: "xmlns:wps",
        Ignorable: "mc:Ignorable",
    };
}
