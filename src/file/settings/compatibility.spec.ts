import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { Compatibility } from "./compatibility";

describe("Compatibility", () => {
    describe("#constructor", () => {
        it("creates an initially empty property object", () => {
            const compatibility = new Compatibility({});

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": {} });
        });
    });

    describe("#version", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                version: 10,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({
                "w:compat": [
                    {
                        "w:compatSetting": {
                            _attr: {
                                "w:name": "compatibilityMode",
                                "w:uri": "http://schemas.microsoft.com/office/word",
                                "w:val": 10,
                            },
                        },
                    },
                ],
            });
        });
    });

    describe("#useSingleBorderforContiguousCells", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                useSingleBorderforContiguousCells: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:useSingleBorderforContiguousCells": {} }] });
        });
    });

    describe("#wordPerfectJustification", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                wordPerfectJustification: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:wpJustification": {} }] });
        });
    });

    describe("#noTabStopForHangingIndent", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                noTabStopForHangingIndent: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:noTabHangInd": {} }] });
        });
    });

    describe("#noLeading", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                noLeading: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:noLeading": {} }] });
        });
    });

    describe("#spaceForUnderline", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                spaceForUnderline: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:spaceForUL": {} }] });
        });
    });

    describe("#noColumnBalance", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                noColumnBalance: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:noColumnBalance": {} }] });
        });
    });

    describe("#balanceSingleByteDoubleByteWidth", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                balanceSingleByteDoubleByteWidth: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:balanceSingleByteDoubleByteWidth": {} }] });
        });
    });

    describe("#noExtraLineSpacing", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                noExtraLineSpacing: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:noExtraLineSpacing": {} }] });
        });
    });

    describe("#doNotLeaveBackslashAlone", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                doNotLeaveBackslashAlone: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:doNotLeaveBackslashAlone": {} }] });
        });
    });

    describe("#underlineTrailingSpaces", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                underlineTrailingSpaces: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:ulTrailSpace": {} }] });
        });
    });

    describe("#doNotExpandShiftReturn", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                doNotExpandShiftReturn: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:doNotExpandShiftReturn": {} }] });
        });
    });

    describe("#spacingInWholePoints", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                spacingInWholePoints: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:spacingInWholePoints": {} }] });
        });
    });

    describe("#lineWrapLikeWord6", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                lineWrapLikeWord6: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:lineWrapLikeWord6": {} }] });
        });
    });

    describe("#printBodyTextBeforeHeader", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                printBodyTextBeforeHeader: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:printBodyTextBeforeHeader": {} }] });
        });
    });

    describe("#printColorsBlack", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                printColorsBlack: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:printColBlack": {} }] });
        });
    });

    describe("#spaceWidth", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                spaceWidth: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:wpSpaceWidth": {} }] });
        });
    });

    describe("#showBreaksInFrames", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                showBreaksInFrames: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:showBreaksInFrames": {} }] });
        });
    });

    describe("#subFontBySize", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                subFontBySize: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:subFontBySize": {} }] });
        });
    });

    describe("#suppressBottomSpacing", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                suppressBottomSpacing: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:suppressBottomSpacing": {} }] });
        });
    });

    describe("#suppressTopSpacing", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                suppressTopSpacing: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:suppressTopSpacing": {} }] });
        });
    });

    describe("#suppressSpacingAtTopOfPage", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                suppressSpacingAtTopOfPage: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:suppressSpacingAtTopOfPage": {} }] });
        });
    });

    describe("#suppressTopSpacingWP", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                suppressTopSpacingWP: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:suppressTopSpacingWP": {} }] });
        });
    });

    describe("#suppressSpBfAfterPgBrk", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                suppressSpBfAfterPgBrk: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:suppressSpBfAfterPgBrk": {} }] });
        });
    });

    describe("#swapBordersFacingPages", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                swapBordersFacingPages: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:swapBordersFacingPages": {} }] });
        });
    });

    describe("#convertMailMergeEsc", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                convertMailMergeEsc: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:convMailMergeEsc": {} }] });
        });
    });

    describe("#truncateFontHeightsLikeWP6", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                truncateFontHeightsLikeWP6: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:truncateFontHeightsLikeWP6": {} }] });
        });
    });

    describe("#macWordSmallCaps", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                macWordSmallCaps: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:mwSmallCaps": {} }] });
        });
    });

    describe("#usePrinterMetrics", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                usePrinterMetrics: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:usePrinterMetrics": {} }] });
        });
    });

    describe("#doNotSuppressParagraphBorders", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                doNotSuppressParagraphBorders: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:doNotSuppressParagraphBorders": {} }] });
        });
    });

    describe("#wrapTrailSpaces", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                wrapTrailSpaces: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:wrapTrailSpaces": {} }] });
        });
    });

    describe("#footnoteLayoutLikeWW8", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                footnoteLayoutLikeWW8: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:footnoteLayoutLikeWW8": {} }] });
        });
    });

    describe("#shapeLayoutLikeWW8", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                shapeLayoutLikeWW8: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:shapeLayoutLikeWW8": {} }] });
        });
    });

    describe("#alignTablesRowByRow", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                alignTablesRowByRow: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:alignTablesRowByRow": {} }] });
        });
    });

    describe("#forgetLastTabAlignment", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                forgetLastTabAlignment: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:forgetLastTabAlignment": {} }] });
        });
    });

    describe("#adjustLineHeightInTable", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                adjustLineHeightInTable: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:adjustLineHeightInTable": {} }] });
        });
    });

    describe("#autoSpaceLikeWord95", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                autoSpaceLikeWord95: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:autoSpaceLikeWord95": {} }] });
        });
    });

    describe("#noSpaceRaiseLower", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                noSpaceRaiseLower: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:noSpaceRaiseLower": {} }] });
        });
    });

    describe("#doNotUseHTMLParagraphAutoSpacing", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                doNotUseHTMLParagraphAutoSpacing: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:doNotUseHTMLParagraphAutoSpacing": {} }] });
        });
    });

    describe("#layoutRawTableWidth", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                layoutRawTableWidth: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:layoutRawTableWidth": {} }] });
        });
    });

    describe("#layoutTableRowsApart", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                layoutTableRowsApart: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:layoutTableRowsApart": {} }] });
        });
    });

    describe("#useWord97LineBreakRules", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                useWord97LineBreakRules: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:useWord97LineBreakRules": {} }] });
        });
    });

    describe("#doNotBreakWrappedTables", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                doNotBreakWrappedTables: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:doNotBreakWrappedTables": {} }] });
        });
    });

    describe("#doNotSnapToGridInCell", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                doNotSnapToGridInCell: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:doNotSnapToGridInCell": {} }] });
        });
    });

    describe("#selectFieldWithFirstOrLastCharacter", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                selectFieldWithFirstOrLastCharacter: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:selectFldWithFirstOrLastChar": {} }] });
        });
    });

    describe("#applyBreakingRules", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                applyBreakingRules: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:applyBreakingRules": {} }] });
        });
    });

    describe("#doNotWrapTextWithPunctuation", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                doNotWrapTextWithPunctuation: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:doNotWrapTextWithPunct": {} }] });
        });
    });

    describe("#doNotUseEastAsianBreakRules", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                doNotUseEastAsianBreakRules: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:doNotUseEastAsianBreakRules": {} }] });
        });
    });

    describe("#useWord2002TableStyleRules", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                useWord2002TableStyleRules: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:useWord2002TableStyleRules": {} }] });
        });
    });

    describe("#growAutofit", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                growAutofit: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:growAutofit": {} }] });
        });
    });

    describe("#useFELayout", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                useFELayout: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:useFELayout": {} }] });
        });
    });

    describe("#useNormalStyleForList", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                useNormalStyleForList: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:useNormalStyleForList": {} }] });
        });
    });

    describe("#doNotUseIndentAsNumberingTabStop", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                doNotUseIndentAsNumberingTabStop: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:doNotUseIndentAsNumberingTabStop": {} }] });
        });
    });

    describe("#useAlternateEastAsianLineBreakRules", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                useAlternateEastAsianLineBreakRules: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:useAltKinsokuLineBreakRules": {} }] });
        });
    });

    describe("#allowSpaceOfSameStyleInTable", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                allowSpaceOfSameStyleInTable: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:allowSpaceOfSameStyleInTable": {} }] });
        });
    });

    describe("#doNotSuppressIndentation", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                doNotSuppressIndentation: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:doNotSuppressIndentation": {} }] });
        });
    });

    describe("#doNotAutofitConstrainedTables", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                doNotAutofitConstrainedTables: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:doNotAutofitConstrainedTables": {} }] });
        });
    });

    describe("#autofitToFirstFixedWidthCell", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                autofitToFirstFixedWidthCell: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:autofitToFirstFixedWidthCell": {} }] });
        });
    });

    describe("#underlineTabInNumberingList", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                underlineTabInNumberingList: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:underlineTabInNumList": {} }] });
        });
    });

    describe("#displayHangulFixedWidth", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                displayHangulFixedWidth: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:displayHangulFixedWidth": {} }] });
        });
    });

    describe("#splitPgBreakAndParaMark", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                splitPgBreakAndParaMark: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:splitPgBreakAndParaMark": {} }] });
        });
    });

    describe("#doNotVerticallyAlignCellWithSp", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                doNotVerticallyAlignCellWithSp: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:doNotVertAlignCellWithSp": {} }] });
        });
    });

    describe("#doNotBreakConstrainedForcedTable", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                doNotBreakConstrainedForcedTable: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:doNotBreakConstrainedForcedTable": {} }] });
        });
    });

    describe("#ignoreVerticalAlignmentInTextboxes", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                ignoreVerticalAlignmentInTextboxes: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:doNotVertAlignInTxbx": {} }] });
        });
    });

    describe("#useAnsiKerningPairs", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                useAnsiKerningPairs: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:useAnsiKerningPairs": {} }] });
        });
    });

    describe("#cachedColumnBalance", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                cachedColumnBalance: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:cachedColBalance": {} }] });
        });
    });
});
