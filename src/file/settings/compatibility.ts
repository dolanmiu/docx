import { OnOffElement, XmlComponent } from "file/xml-components";
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
    readonly doNotExpandShiftReturn?: boolean;
    readonly version?: number;
}

export class Compatibility extends XmlComponent {
    constructor(options: ICompatibilityOptions) {
        super("w:compat");

        // Don't justify lines ending in soft line break setting
        if (options.doNotExpandShiftReturn !== undefined) {
            this.root.push(new OnOffElement("w:doNotExpandShiftReturn", options.doNotExpandShiftReturn));
        }

        if (options.version) {
            this.root.push(new CompatibilitySetting(options.version));
        }
    }
}
