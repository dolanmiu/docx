// http://www.datypic.com/sc/ooxml/e-w_compat-1.html
import { OnOffElement, XmlComponent } from "@file/xml-components";
import { CompatibilitySetting } from "./compatibility-setting/compatibility-setting";

// <xsd:complexType name="CT_Compat">
// <xsd:sequence>
//   <xsd:element name="useSingleBorderforContiguousCells" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="wpJustification" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="noTabHangInd" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="noLeading" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="spaceForUL" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="noColumnBalance" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="balanceSingleByteDoubleByteWidth" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="noExtraLineSpacing" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="doNotLeaveBackslashAlone" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="ulTrailSpace" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="doNotExpandShiftReturn" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="spacingInWholePoints" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="lineWrapLikeWord6" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="printBodyTextBeforeHeader" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="printColBlack" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="wpSpaceWidth" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="showBreaksInFrames" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="subFontBySize" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="suppressBottomSpacing" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="suppressTopSpacing" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="suppressSpacingAtTopOfPage" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="suppressTopSpacingWP" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="suppressSpBfAfterPgBrk" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="swapBordersFacingPages" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="convMailMergeEsc" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="truncateFontHeightsLikeWP6" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="mwSmallCaps" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="usePrinterMetrics" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="doNotSuppressParagraphBorders" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="wrapTrailSpaces" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="footnoteLayoutLikeWW8" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="shapeLayoutLikeWW8" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="alignTablesRowByRow" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="forgetLastTabAlignment" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="adjustLineHeightInTable" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="autoSpaceLikeWord95" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="noSpaceRaiseLower" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="doNotUseHTMLParagraphAutoSpacing" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="layoutRawTableWidth" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="layoutTableRowsApart" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="useWord97LineBreakRules" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="doNotBreakWrappedTables" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="doNotSnapToGridInCell" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="selectFldWithFirstOrLastChar" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="applyBreakingRules" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="doNotWrapTextWithPunct" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="doNotUseEastAsianBreakRules" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="useWord2002TableStyleRules" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="growAutofit" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="useFELayout" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="useNormalStyleForList" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="doNotUseIndentAsNumberingTabStop" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="useAltKinsokuLineBreakRules" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="allowSpaceOfSameStyleInTable" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="doNotSuppressIndentation" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="doNotAutofitConstrainedTables" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="autofitToFirstFixedWidthCell" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="underlineTabInNumList" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="displayHangulFixedWidth" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="splitPgBreakAndParaMark" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="doNotVertAlignCellWithSp" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="doNotBreakConstrainedForcedTable" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="doNotVertAlignInTxbx" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="useAnsiKerningPairs" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="cachedColBalance" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="compatSetting" type="CT_CompatSetting" minOccurs="0" maxOccurs="unbounded"
//   />
// </xsd:sequence>
// </xsd:complexType>

export interface ICompatibilityOptions {
    readonly version?: number;
    /** Use Simplified Rules For Table Border Conflicts */
    readonly useSingleBorderforContiguousCells?: boolean;
    /** Emulate WordPerfect 6.x Paragraph Justification */
    readonly wordPerfectJustification?: boolean;
    /** Do Not Create Custom Tab Stop for Hanging Indent */
    readonly noTabStopForHangingIndent?: boolean;
    /** Do Not Add Leading Between Lines of Text */
    readonly noLeading?: boolean;
    /** Add Additional Space Below Baseline For Underlined East Asian Text */
    readonly spaceForUnderline?: boolean;
    /** Do Not Balance Text Columns within a Section */
    readonly noColumnBalance?: boolean;
    /** Balance Single Byte and Double Byte Characters */
    readonly balanceSingleByteDoubleByteWidth?: boolean;
    /** Do Not Center Content on Lines With Exact Line Height */
    readonly noExtraLineSpacing?: boolean;
    /** Convert Backslash To Yen Sign When Entered */
    readonly doNotLeaveBackslashAlone?: boolean;
    /** Underline All Trailing Spaces */
    readonly underlineTrailingSpaces?: boolean;
    /** Don't Justify Lines Ending in Soft Line Break */
    readonly doNotExpandShiftReturn?: boolean;
    /** Only Expand/Condense Text By Whole Points */
    readonly spacingInWholePoints?: boolean;
    /** Emulate Word 6.0 Line Wrapping for East Asian Text */
    readonly lineWrapLikeWord6?: boolean;
    /** Print Body Text before Header/Footer Contents */
    readonly printBodyTextBeforeHeader?: boolean;
    /** Print Colors as Black And White without Dithering */
    readonly printColorsBlack?: boolean;
    /** Space width */
    readonly spaceWidth?: boolean;
    /** Display Page/Column Breaks Present in Frames */
    readonly showBreaksInFrames?: boolean;
    /** Increase Priority Of Font Size During Font Substitution */
    readonly subFontBySize?: boolean;
    /** Ignore Exact Line Height for Last Line on Page */
    readonly suppressBottomSpacing?: boolean;
    /** Ignore Minimum and Exact Line Height for First Line on Page */
    readonly suppressTopSpacing?: boolean;
    /** Ignore Minimum Line Height for First Line on Page */
    readonly suppressSpacingAtTopOfPage?: boolean;
    /** Emulate WordPerfect 5.x Line Spacing */
    readonly suppressTopSpacingWP?: boolean;
    /** Do Not Use Space Before On First Line After a Page Break */
    readonly suppressSpBfAfterPgBrk?: boolean;
    /** Swap Paragraph Borders on Odd Numbered Pages */
    readonly swapBordersFacingPages?: boolean;
    /** Treat Backslash Quotation Delimiter as Two Quotation Marks */
    readonly convertMailMergeEsc?: boolean;
    /** Emulate WordPerfect 6.x Font Height Calculation */
    readonly truncateFontHeightsLikeWP6?: boolean;
    /** Emulate Word 5.x for the Macintosh Small Caps Formatting */
    readonly macWordSmallCaps?: boolean;
    /** Use Printer Metrics To Display Documents */
    readonly usePrinterMetrics?: boolean;
    /** Do Not Suppress Paragraph Borders Next To Frames */
    readonly doNotSuppressParagraphBorders?: boolean;
    /** Line Wrap Trailing Spaces */
    readonly wrapTrailSpaces?: boolean;
    /** Emulate Word 6.x/95/97 Footnote Placement */
    readonly footnoteLayoutLikeWW8?: boolean;
    /** Emulate Word 97 Text Wrapping Around Floating Objects */
    readonly shapeLayoutLikeWW8?: boolean;
    /** Align Table Rows Independently */
    readonly alignTablesRowByRow?: boolean;
    /** Ignore Width of Last Tab Stop When Aligning Paragraph If It Is Not Left Aligned */
    readonly forgetLastTabAlignment?: boolean;
    /** Add Document Grid Line Pitch To Lines in Table Cells */
    readonly adjustLineHeightInTable?: boolean;
    /** Emulate Word 95 Full-Width Character Spacing */
    readonly autoSpaceLikeWord95?: boolean;
    /** Do Not Increase Line Height for Raised/Lowered Text */
    readonly noSpaceRaiseLower?: boolean;
    /** Use Fixed Paragraph Spacing for HTML Auto Setting */
    readonly doNotUseHTMLParagraphAutoSpacing?: boolean;
    /** Ignore Space Before Table When Deciding If Table Should Wrap Floating Object */
    readonly layoutRawTableWidth?: boolean;
    /** Allow Table Rows to Wrap Inline Objects Independently */
    readonly layoutTableRowsApart?: boolean;
    /** Emulate Word 97 East Asian Line Breaking */
    readonly useWord97LineBreakRules?: boolean;
    /** Do Not Allow Floating Tables To Break Across Pages */
    readonly doNotBreakWrappedTables?: boolean;
    /** Do Not Snap to Document Grid in Table Cells with Objects */
    readonly doNotSnapToGridInCell?: boolean;
    /** Select Field When First or Last Character Is Selected */
    readonly selectFieldWithFirstOrLastCharacter?: boolean;
    /** Use Legacy Ethiopic and Amharic Line Breaking Rules */
    readonly applyBreakingRules?: boolean;
    /** Do Not Allow Hanging Punctuation With Character Grid */
    readonly doNotWrapTextWithPunctuation?: boolean;
    /** Do Not Compress Compressible Characters When Using Document Grid */
    readonly doNotUseEastAsianBreakRules?: boolean;
    /** Emulate Word 2002 Table Style Rules */
    readonly useWord2002TableStyleRules?: boolean;
    /** Allow Tables to AutoFit Into Page Margins */
    readonly growAutofit?: boolean;
    /** Do Not Bypass East Asian/Complex Script Layout Code */
    readonly useFELayout?: boolean;
    /** Do Not Automatically Apply List Paragraph Style To Bulleted/Numbered Text */
    readonly useNormalStyleForList?: boolean;
    /** Ignore Hanging Indent When Creating Tab Stop After Numbering */
    readonly doNotUseIndentAsNumberingTabStop?: boolean;
    /** Use Alternate Set of East Asian Line Breaking Rules */
    readonly useAlternateEastAsianLineBreakRules?: boolean;
    /** Allow Contextual Spacing of Paragraphs in Tables */
    readonly allowSpaceOfSameStyleInTable?: boolean;
    /** Do Not Ignore Floating Objects When Calculating Paragraph Indentation */
    readonly doNotSuppressIndentation?: boolean;
    /** Do Not AutoFit Tables To Fit Next To Wrapped Objects */
    readonly doNotAutofitConstrainedTables?: boolean;
    /** Allow Table Columns To Exceed Preferred Widths of Constituent Cells */
    readonly autofitToFirstFixedWidthCell?: boolean;
    /** Underline Following Character Following Numbering */
    readonly underlineTabInNumberingList?: boolean;
    /** Always Use Fixed Width for Hangul Characters */
    readonly displayHangulFixedWidth?: boolean;
    /** Always Move Paragraph Mark to Page after a Page Break */
    readonly splitPgBreakAndParaMark?: boolean;
    /** Don't Vertically Align Cells Containing Floating Objects */
    readonly doNotVerticallyAlignCellWithSp?: boolean;
    /** Don't Break Table Rows Around Floating Tables */
    readonly doNotBreakConstrainedForcedTable?: boolean;
    /** Ignore Vertical Alignment in Textboxes */
    readonly ignoreVerticalAlignmentInTextboxes?: boolean;
    /** Use ANSI Kerning Pairs from Fonts */
    readonly useAnsiKerningPairs?: boolean;
    /** Use Cached Paragraph Information for Column Balancing */
    readonly cachedColumnBalance?: boolean;
}

export class Compatibility extends XmlComponent {
    public constructor(options: ICompatibilityOptions) {
        super("w:compat");

        if (options.version) {
            this.root.push(new CompatibilitySetting(options.version));
        }

        if (options.useSingleBorderforContiguousCells) {
            this.root.push(new OnOffElement("w:useSingleBorderforContiguousCells", options.useSingleBorderforContiguousCells));
        }

        if (options.wordPerfectJustification) {
            this.root.push(new OnOffElement("w:wpJustification", options.wordPerfectJustification));
        }

        if (options.noTabStopForHangingIndent) {
            this.root.push(new OnOffElement("w:noTabHangInd", options.noTabStopForHangingIndent));
        }

        if (options.noLeading) {
            this.root.push(new OnOffElement("w:noLeading", options.noLeading));
        }

        if (options.spaceForUnderline) {
            this.root.push(new OnOffElement("w:spaceForUL", options.spaceForUnderline));
        }

        if (options.noColumnBalance) {
            this.root.push(new OnOffElement("w:noColumnBalance", options.noColumnBalance));
        }

        if (options.balanceSingleByteDoubleByteWidth) {
            this.root.push(new OnOffElement("w:balanceSingleByteDoubleByteWidth", options.balanceSingleByteDoubleByteWidth));
        }

        if (options.noExtraLineSpacing) {
            this.root.push(new OnOffElement("w:noExtraLineSpacing", options.noExtraLineSpacing));
        }

        if (options.doNotLeaveBackslashAlone) {
            this.root.push(new OnOffElement("w:doNotLeaveBackslashAlone", options.doNotLeaveBackslashAlone));
        }

        if (options.underlineTrailingSpaces) {
            this.root.push(new OnOffElement("w:ulTrailSpace", options.underlineTrailingSpaces));
        }

        if (options.doNotExpandShiftReturn) {
            this.root.push(new OnOffElement("w:doNotExpandShiftReturn", options.doNotExpandShiftReturn));
        }

        if (options.spacingInWholePoints) {
            this.root.push(new OnOffElement("w:spacingInWholePoints", options.spacingInWholePoints));
        }

        if (options.lineWrapLikeWord6) {
            this.root.push(new OnOffElement("w:lineWrapLikeWord6", options.lineWrapLikeWord6));
        }

        if (options.printBodyTextBeforeHeader) {
            this.root.push(new OnOffElement("w:printBodyTextBeforeHeader", options.printBodyTextBeforeHeader));
        }

        if (options.printColorsBlack) {
            this.root.push(new OnOffElement("w:printColBlack", options.printColorsBlack));
        }

        if (options.spaceWidth) {
            this.root.push(new OnOffElement("w:wpSpaceWidth", options.spaceWidth));
        }

        if (options.showBreaksInFrames) {
            this.root.push(new OnOffElement("w:showBreaksInFrames", options.showBreaksInFrames));
        }

        if (options.subFontBySize) {
            this.root.push(new OnOffElement("w:subFontBySize", options.subFontBySize));
        }

        if (options.suppressBottomSpacing) {
            this.root.push(new OnOffElement("w:suppressBottomSpacing", options.suppressBottomSpacing));
        }

        if (options.suppressTopSpacing) {
            this.root.push(new OnOffElement("w:suppressTopSpacing", options.suppressTopSpacing));
        }

        if (options.suppressSpacingAtTopOfPage) {
            this.root.push(new OnOffElement("w:suppressSpacingAtTopOfPage", options.suppressSpacingAtTopOfPage));
        }

        if (options.suppressTopSpacingWP) {
            this.root.push(new OnOffElement("w:suppressTopSpacingWP", options.suppressTopSpacingWP));
        }

        if (options.suppressSpBfAfterPgBrk) {
            this.root.push(new OnOffElement("w:suppressSpBfAfterPgBrk", options.suppressSpBfAfterPgBrk));
        }

        if (options.swapBordersFacingPages) {
            this.root.push(new OnOffElement("w:swapBordersFacingPages", options.swapBordersFacingPages));
        }

        if (options.convertMailMergeEsc) {
            this.root.push(new OnOffElement("w:convMailMergeEsc", options.convertMailMergeEsc));
        }

        if (options.truncateFontHeightsLikeWP6) {
            this.root.push(new OnOffElement("w:truncateFontHeightsLikeWP6", options.truncateFontHeightsLikeWP6));
        }

        if (options.macWordSmallCaps) {
            this.root.push(new OnOffElement("w:mwSmallCaps", options.macWordSmallCaps));
        }

        if (options.usePrinterMetrics) {
            this.root.push(new OnOffElement("w:usePrinterMetrics", options.usePrinterMetrics));
        }

        if (options.doNotSuppressParagraphBorders) {
            this.root.push(new OnOffElement("w:doNotSuppressParagraphBorders", options.doNotSuppressParagraphBorders));
        }

        if (options.wrapTrailSpaces) {
            this.root.push(new OnOffElement("w:wrapTrailSpaces", options.wrapTrailSpaces));
        }

        if (options.footnoteLayoutLikeWW8) {
            this.root.push(new OnOffElement("w:footnoteLayoutLikeWW8", options.footnoteLayoutLikeWW8));
        }

        if (options.shapeLayoutLikeWW8) {
            this.root.push(new OnOffElement("w:shapeLayoutLikeWW8", options.shapeLayoutLikeWW8));
        }

        if (options.alignTablesRowByRow) {
            this.root.push(new OnOffElement("w:alignTablesRowByRow", options.alignTablesRowByRow));
        }

        if (options.forgetLastTabAlignment) {
            this.root.push(new OnOffElement("w:forgetLastTabAlignment", options.forgetLastTabAlignment));
        }

        if (options.adjustLineHeightInTable) {
            this.root.push(new OnOffElement("w:adjustLineHeightInTable", options.adjustLineHeightInTable));
        }

        if (options.autoSpaceLikeWord95) {
            this.root.push(new OnOffElement("w:autoSpaceLikeWord95", options.autoSpaceLikeWord95));
        }

        if (options.noSpaceRaiseLower) {
            this.root.push(new OnOffElement("w:noSpaceRaiseLower", options.noSpaceRaiseLower));
        }

        if (options.doNotUseHTMLParagraphAutoSpacing) {
            this.root.push(new OnOffElement("w:doNotUseHTMLParagraphAutoSpacing", options.doNotUseHTMLParagraphAutoSpacing));
        }

        if (options.layoutRawTableWidth) {
            this.root.push(new OnOffElement("w:layoutRawTableWidth", options.layoutRawTableWidth));
        }

        if (options.layoutTableRowsApart) {
            this.root.push(new OnOffElement("w:layoutTableRowsApart", options.layoutTableRowsApart));
        }

        if (options.useWord97LineBreakRules) {
            this.root.push(new OnOffElement("w:useWord97LineBreakRules", options.useWord97LineBreakRules));
        }

        if (options.doNotBreakWrappedTables) {
            this.root.push(new OnOffElement("w:doNotBreakWrappedTables", options.doNotBreakWrappedTables));
        }

        if (options.doNotSnapToGridInCell) {
            this.root.push(new OnOffElement("w:doNotSnapToGridInCell", options.doNotSnapToGridInCell));
        }

        if (options.selectFieldWithFirstOrLastCharacter) {
            this.root.push(new OnOffElement("w:selectFldWithFirstOrLastChar", options.selectFieldWithFirstOrLastCharacter));
        }

        if (options.applyBreakingRules) {
            this.root.push(new OnOffElement("w:applyBreakingRules", options.applyBreakingRules));
        }

        if (options.doNotWrapTextWithPunctuation) {
            this.root.push(new OnOffElement("w:doNotWrapTextWithPunct", options.doNotWrapTextWithPunctuation));
        }

        if (options.doNotUseEastAsianBreakRules) {
            this.root.push(new OnOffElement("w:doNotUseEastAsianBreakRules", options.doNotUseEastAsianBreakRules));
        }

        if (options.useWord2002TableStyleRules) {
            this.root.push(new OnOffElement("w:useWord2002TableStyleRules", options.useWord2002TableStyleRules));
        }

        if (options.growAutofit) {
            this.root.push(new OnOffElement("w:growAutofit", options.growAutofit));
        }

        if (options.useFELayout) {
            this.root.push(new OnOffElement("w:useFELayout", options.useFELayout));
        }

        if (options.useNormalStyleForList) {
            this.root.push(new OnOffElement("w:useNormalStyleForList", options.useNormalStyleForList));
        }

        if (options.doNotUseIndentAsNumberingTabStop) {
            this.root.push(new OnOffElement("w:doNotUseIndentAsNumberingTabStop", options.doNotUseIndentAsNumberingTabStop));
        }

        if (options.useAlternateEastAsianLineBreakRules) {
            this.root.push(new OnOffElement("w:useAltKinsokuLineBreakRules", options.useAlternateEastAsianLineBreakRules));
        }

        if (options.allowSpaceOfSameStyleInTable) {
            this.root.push(new OnOffElement("w:allowSpaceOfSameStyleInTable", options.allowSpaceOfSameStyleInTable));
        }

        if (options.doNotSuppressIndentation) {
            this.root.push(new OnOffElement("w:doNotSuppressIndentation", options.doNotSuppressIndentation));
        }

        if (options.doNotAutofitConstrainedTables) {
            this.root.push(new OnOffElement("w:doNotAutofitConstrainedTables", options.doNotAutofitConstrainedTables));
        }

        if (options.autofitToFirstFixedWidthCell) {
            this.root.push(new OnOffElement("w:autofitToFirstFixedWidthCell", options.autofitToFirstFixedWidthCell));
        }

        if (options.underlineTabInNumberingList) {
            this.root.push(new OnOffElement("w:underlineTabInNumList", options.underlineTabInNumberingList));
        }

        if (options.displayHangulFixedWidth) {
            this.root.push(new OnOffElement("w:displayHangulFixedWidth", options.displayHangulFixedWidth));
        }

        if (options.splitPgBreakAndParaMark) {
            this.root.push(new OnOffElement("w:splitPgBreakAndParaMark", options.splitPgBreakAndParaMark));
        }

        if (options.doNotVerticallyAlignCellWithSp) {
            this.root.push(new OnOffElement("w:doNotVertAlignCellWithSp", options.doNotVerticallyAlignCellWithSp));
        }

        if (options.doNotBreakConstrainedForcedTable) {
            this.root.push(new OnOffElement("w:doNotBreakConstrainedForcedTable", options.doNotBreakConstrainedForcedTable));
        }

        if (options.ignoreVerticalAlignmentInTextboxes) {
            this.root.push(new OnOffElement("w:doNotVertAlignInTxbx", options.ignoreVerticalAlignmentInTextboxes));
        }

        if (options.useAnsiKerningPairs) {
            this.root.push(new OnOffElement("w:useAnsiKerningPairs", options.useAnsiKerningPairs));
        }

        if (options.cachedColumnBalance) {
            this.root.push(new OnOffElement("w:cachedColBalance", options.cachedColumnBalance));
        }
    }
}
