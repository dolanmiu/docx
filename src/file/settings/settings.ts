import { OnOffElement, XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import { Compatibility, ICompatibilityOptions } from "./compatibility";

export class SettingsAttributes extends XmlAttributeComponent<{
    readonly wpc?: string;
    readonly mc?: string;
    readonly o?: string;
    readonly r?: string;
    readonly m?: string;
    readonly v?: string;
    readonly wp14?: string;
    readonly wp?: string;
    readonly w10?: string;
    readonly w?: string;
    readonly w14?: string;
    readonly w15?: string;
    readonly wpg?: string;
    readonly wpi?: string;
    readonly wne?: string;
    readonly wps?: string;
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

// <xsd:complexType name="CT_Settings">
// <xsd:sequence>
//   <xsd:element name="writeProtection" type="CT_WriteProtection" minOccurs="0"/>
//   <xsd:element name="view" type="CT_View" minOccurs="0"/>
//   <xsd:element name="zoom" type="CT_Zoom" minOccurs="0"/>
//   <xsd:element name="removePersonalInformation" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="removeDateAndTime" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="doNotDisplayPageBoundaries" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="displayBackgroundShape" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="printPostScriptOverText" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="printFractionalCharacterWidth" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="printFormsData" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="embedTrueTypeFonts" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="embedSystemFonts" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="saveSubsetFonts" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="saveFormsData" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="mirrorMargins" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="alignBordersAndEdges" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="bordersDoNotSurroundHeader" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="bordersDoNotSurroundFooter" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="gutterAtTop" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="hideSpellingErrors" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="hideGrammaticalErrors" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="activeWritingStyle" type="CT_WritingStyle" minOccurs="0"
//     maxOccurs="unbounded"/>
//   <xsd:element name="proofState" type="CT_Proof" minOccurs="0"/>
//   <xsd:element name="formsDesign" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="attachedTemplate" type="CT_Rel" minOccurs="0"/>
//   <xsd:element name="linkStyles" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="stylePaneFormatFilter" type="CT_StylePaneFilter" minOccurs="0"/>
//   <xsd:element name="stylePaneSortMethod" type="CT_StyleSort" minOccurs="0"/>
//   <xsd:element name="documentType" type="CT_DocType" minOccurs="0"/>
//   <xsd:element name="mailMerge" type="CT_MailMerge" minOccurs="0"/>
//   <xsd:element name="revisionView" type="CT_TrackChangesView" minOccurs="0"/>
//   <xsd:element name="trackRevisions" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="doNotTrackMoves" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="doNotTrackFormatting" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="documentProtection" type="CT_DocProtect" minOccurs="0"/>
//   <xsd:element name="autoFormatOverride" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="styleLockTheme" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="styleLockQFSet" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="defaultTabStop" type="CT_TwipsMeasure" minOccurs="0"/>
//   <xsd:element name="autoHyphenation" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="consecutiveHyphenLimit" type="CT_DecimalNumber" minOccurs="0"/>
//   <xsd:element name="hyphenationZone" type="CT_TwipsMeasure" minOccurs="0"/>
//   <xsd:element name="doNotHyphenateCaps" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="showEnvelope" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="summaryLength" type="CT_DecimalNumberOrPrecent" minOccurs="0"/>
//   <xsd:element name="clickAndTypeStyle" type="CT_String" minOccurs="0"/>
//   <xsd:element name="defaultTableStyle" type="CT_String" minOccurs="0"/>
//   <xsd:element name="evenAndOddHeaders" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="bookFoldRevPrinting" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="bookFoldPrinting" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="bookFoldPrintingSheets" type="CT_DecimalNumber" minOccurs="0"/>
//   <xsd:element name="drawingGridHorizontalSpacing" type="CT_TwipsMeasure" minOccurs="0"/>
//   <xsd:element name="drawingGridVerticalSpacing" type="CT_TwipsMeasure" minOccurs="0"/>
//   <xsd:element name="displayHorizontalDrawingGridEvery" type="CT_DecimalNumber" minOccurs="0"/>
//   <xsd:element name="displayVerticalDrawingGridEvery" type="CT_DecimalNumber" minOccurs="0"/>
//   <xsd:element name="doNotUseMarginsForDrawingGridOrigin" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="drawingGridHorizontalOrigin" type="CT_TwipsMeasure" minOccurs="0"/>
//   <xsd:element name="drawingGridVerticalOrigin" type="CT_TwipsMeasure" minOccurs="0"/>
//   <xsd:element name="doNotShadeFormData" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="noPunctuationKerning" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="characterSpacingControl" type="CT_CharacterSpacing" minOccurs="0"/>
//   <xsd:element name="printTwoOnOne" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="strictFirstAndLastChars" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="noLineBreaksAfter" type="CT_Kinsoku" minOccurs="0"/>
//   <xsd:element name="noLineBreaksBefore" type="CT_Kinsoku" minOccurs="0"/>
//   <xsd:element name="savePreviewPicture" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="doNotValidateAgainstSchema" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="saveInvalidXml" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="ignoreMixedContent" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="alwaysShowPlaceholderText" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="doNotDemarcateInvalidXml" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="saveXmlDataOnly" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="useXSLTWhenSaving" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="saveThroughXslt" type="CT_SaveThroughXslt" minOccurs="0"/>
//   <xsd:element name="showXMLTags" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="alwaysMergeEmptyNamespace" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="updateFields" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="hdrShapeDefaults" type="CT_ShapeDefaults" minOccurs="0"/>
//   <xsd:element name="footnotePr" type="CT_FtnDocProps" minOccurs="0"/>
//   <xsd:element name="endnotePr" type="CT_EdnDocProps" minOccurs="0"/>
//   <xsd:element name="compat" type="CT_Compat" minOccurs="0"/>
//   <xsd:element name="docVars" type="CT_DocVars" minOccurs="0"/>
//   <xsd:element name="rsids" type="CT_DocRsids" minOccurs="0"/>
//   <xsd:element ref="m:mathPr" minOccurs="0" maxOccurs="1"/>
//   <xsd:element name="attachedSchema" type="CT_String" minOccurs="0" maxOccurs="unbounded"/>
//   <xsd:element name="themeFontLang" type="CT_Language" minOccurs="0" maxOccurs="1"/>
//   <xsd:element name="clrSchemeMapping" type="CT_ColorSchemeMapping" minOccurs="0"/>
//   <xsd:element name="doNotIncludeSubdocsInStats" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="doNotAutoCompressPictures" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="forceUpgrade" type="CT_Empty" minOccurs="0" maxOccurs="1"/>
//   <xsd:element name="captions" type="CT_Captions" minOccurs="0" maxOccurs="1"/>
//   <xsd:element name="readModeInkLockDown" type="CT_ReadingModeInkLockDown" minOccurs="0"/>
//   <xsd:element name="smartTagType" type="CT_SmartTagType" minOccurs="0" maxOccurs="unbounded"/>
//   <xsd:element ref="sl:schemaLibrary" minOccurs="0" maxOccurs="1"/>
//   <xsd:element name="shapeDefaults" type="CT_ShapeDefaults" minOccurs="0"/>
//   <xsd:element name="doNotEmbedSmartTags" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="decimalSymbol" type="CT_String" minOccurs="0" maxOccurs="1"/>
//   <xsd:element name="listSeparator" type="CT_String" minOccurs="0" maxOccurs="1"/>
// </xsd:sequence>
// </xsd:complexType>

export interface ISettingsOptions {
    readonly compatibilityModeVersion?: number;
    readonly evenAndOddHeaders?: boolean;
    readonly trackRevisions?: boolean;
    readonly updateFields?: boolean;
    readonly compatibility?: ICompatibilityOptions;
}

export class Settings extends XmlComponent {
    public constructor(options: ISettingsOptions) {
        super("w:settings");
        this.root.push(
            new SettingsAttributes({
                wpc: "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
                mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
                o: "urn:schemas-microsoft-com:office:office",
                r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                m: "http://schemas.openxmlformats.org/officeDocument/2006/math",
                v: "urn:schemas-microsoft-com:vml",
                wp14: "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
                wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
                w10: "urn:schemas-microsoft-com:office:word",
                w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                w14: "http://schemas.microsoft.com/office/word/2010/wordml",
                w15: "http://schemas.microsoft.com/office/word/2012/wordml",
                wpg: "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
                wpi: "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
                wne: "http://schemas.microsoft.com/office/word/2006/wordml",
                wps: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
                Ignorable: "w14 w15 wp14",
            }),
        );

        // http://officeopenxml.com/WPdocument.php
        // https://c-rex.net/projects/samples/ooxml/e1/Part4/OOXML_P4_DOCX_displayBackgroundSha_topic_ID0ET4SX.html
        this.root.push(new OnOffElement("w:displayBackgroundShape", true));

        // https://c-rex.net/projects/samples/ooxml/e1/Part4/OOXML_P4_DOCX_trackRevisions_topic_ID0EKXKY.html
        if (options.trackRevisions !== undefined) {
            this.root.push(new OnOffElement("w:trackRevisions", options.trackRevisions));
        }

        // http://officeopenxml.com/WPSectionFooterReference.php
        // https://c-rex.net/projects/samples/ooxml/e1/Part4/OOXML_P4_DOCX_evenAndOddHeaders_topic_ID0ET1WU.html
        if (options.evenAndOddHeaders !== undefined) {
            this.root.push(new OnOffElement("w:evenAndOddHeaders", options.evenAndOddHeaders));
        }

        if (options.updateFields !== undefined) {
            this.root.push(new OnOffElement("w:updateFields", options.updateFields));
        }

        this.root.push(
            new Compatibility({
                ...(options.compatibility ?? {}),
                version: options.compatibility?.version ?? options.compatibilityModeVersion ?? 15,
            }),
        );
    }
}
