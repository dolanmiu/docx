# Document

> The `Document` object is the starting point of your `.docx` journey, this is the literal Word Document. You add all your content such as `Paragraphs` to this `Document`, and at the end export it however you like.

To create a new document, it is very easy:

```ts
const doc = new docx.Document();
```

## Document properties

You can add properties to the Word document by specifying options, for example:

```ts
const doc = new docx.Document({
    creator: "Dolan Miu",
    description: "My extremely interesting document",
    title: "My Document",
});
```

### Full list of options:

| Property                   | Type                                                     | Notes    |
| -------------------------- | -------------------------------------------------------- | -------- |
| sections                   | `ISectionOptions[]`                                      | Optional |
| title                      | `string`                                                 | Optional |
| subject                    | `string`                                                 | Optional |
| creator                    | `string`                                                 | Optional |
| keywords                   | `string`                                                 | Optional |
| description                | `string`                                                 | Optional |
| lastModifiedBy             | `string`                                                 | Optional |
| revision                   | `number`                                                 | Optional |
| externalStyles             | `string`                                                 | Optional |
| styles                     | `IStylesOptions`                                         | Optional |
| numbering                  | `INumberingOptions`                                      | Optional |
| comments                   | `ICommentsOptions`                                       | Optional |
| footnotes                  | `Record<string, { children: Paragraph[] }>`              | Optional |
| background                 | `IDocumentBackgroundOptions`                             | Optional |
| features                   | `{ trackRevisions?: boolean;  updateFields?: boolean; }` | Optional |
| compatabilityModeVersion   | `number`                                                 | Optional |
| compatibility              | `ICompatibilityOptions`                                  | Optional |
| customProperties           | ` ICustomPropertyOptions`[]                              | Optional |
| evenAndOddHeaderAndFooters | `boolean`                                                | Optional |
| defaultTabStop             | `number`                                                 | Optional |
| fonts                      | ` FontOptions[]`                                         | Optional |
| hyphenation                | `IHyphenationOptions`                                    | Optional |

### Change background color of Document

Set the hex value in the document like so:

```ts
const doc = new docx.Document({
    background: {
        color: "C45911",
    },
});
```

You can mix and match whatever properties you want, or provide no properties.

### Units for positioning

Various parts of the API require positioning arguments. The units are "20ths of a point" from the [OOXML](http://officeopenxml.com/index.php) specification.
See [Lars Corneliussen's blog post](https://startbigthinksmall.wordpress.com/2010/01/04/points-inches-and-emus-measuring-units-in-office-open-xml/) for more information and how to convert units.

## Compatibility

Compatibility Settings are optional settings used to preserve visual fidelity of documents created in earlier word processing applications. Some of these settings provide ability for specific behaviors, described in detail below; and others simply instruct applications to mimic the behavior of an existing word processing application.

```ts
const doc = new docx.Document({
    compatibility: {
        version: 15,
        doNotExpandShiftReturn: true,
    },
});
```

### Compatibility Options

| Property                            | Type      | Notes    | Possible Values              |
| ----------------------------------- | --------- | -------- | ---------------------------- |
| version                             | `number`  | Optional | `15`, `16`, `17`             |
| useSingleBorderforContiguousCells   | `boolean` | Optional | `true`, `false`, `undefined` |
| wordPerfectJustification            | `boolean` | Optional | `true`, `false`, `undefined` |
| noTabStopForHangingIndent           | `boolean` | Optional | `true`, `false`, `undefined` |
| noLeading                           | `boolean` | Optional | `true`, `false`, `undefined` |
| spaceForUnderline                   | `boolean` | Optional | `true`, `false`, `undefined` |
| noColumnBalance                     | `boolean` | Optional | `true`, `false`, `undefined` |
| balanceSingleByteDoubleByteWidth    | `boolean` | Optional | `true`, `false`, `undefined` |
| noExtraLineSpacing                  | `boolean` | Optional | `true`, `false`, `undefined` |
| doNotLeaveBackslashAlone            | `boolean` | Optional | `true`, `false`, `undefined` |
| underlineTrailingSpaces             | `boolean` | Optional | `true`, `false`, `undefined` |
| doNotExpandShiftReturn              | `boolean` | Optional | `true`, `false`, `undefined` |
| spacingInWholePoints                | `boolean` | Optional | `true`, `false`, `undefined` |
| lineWrapLikeWord6                   | `boolean` | Optional | `true`, `false`, `undefined` |
| printBodyTextBeforeHeader           | `boolean` | Optional | `true`, `false`, `undefined` |
| printColorsBlack                    | `boolean` | Optional | `true`, `false`, `undefined` |
| spaceWidth                          | `boolean` | Optional | `true`, `false`, `undefined` |
| showBreaksInFrames                  | `boolean` | Optional | `true`, `false`, `undefined` |
| subFontBySize                       | `boolean` | Optional | `true`, `false`, `undefined` |
| suppressBottomSpacing               | `boolean` | Optional | `true`, `false`, `undefined` |
| suppressTopSpacing                  | `boolean` | Optional | `true`, `false`, `undefined` |
| suppressSpacingAtTopOfPage          | `boolean` | Optional | `true`, `false`, `undefined` |
| suppressTopSpacingWP                | `boolean` | Optional | `true`, `false`, `undefined` |
| suppressSpBfAfterPgBrk              | `boolean` | Optional | `true`, `false`, `undefined` |
| swapBordersFacingPages              | `boolean` | Optional | `true`, `false`, `undefined` |
| convertMailMergeEsc                 | `boolean` | Optional | `true`, `false`, `undefined` |
| truncateFontHeightsLikeWP6          | `boolean` | Optional | `true`, `false`, `undefined` |
| macWordSmallCaps                    | `boolean` | Optional | `true`, `false`, `undefined` |
| usePrinterMetrics                   | `boolean` | Optional | `true`, `false`, `undefined` |
| doNotSuppressParagraphBorders       | `boolean` | Optional | `true`, `false`, `undefined` |
| wrapTrailSpaces                     | `boolean` | Optional | `true`, `false`, `undefined` |
| footnoteLayoutLikeWW8               | `boolean` | Optional | `true`, `false`, `undefined` |
| shapeLayoutLikeWW8                  | `boolean` | Optional | `true`, `false`, `undefined` |
| alignTablesRowByRow                 | `boolean` | Optional | `true`, `false`, `undefined` |
| forgetLastTabAlignment              | `boolean` | Optional | `true`, `false`, `undefined` |
| adjustLineHeightInTable             | `boolean` | Optional | `true`, `false`, `undefined` |
| autoSpaceLikeWord95                 | `boolean` | Optional | `true`, `false`, `undefined` |
| noSpaceRaiseLower                   | `boolean` | Optional | `true`, `false`, `undefined` |
| doNotUseHTMLParagraphAutoSpacing    | `boolean` | Optional | `true`, `false`, `undefined` |
| layoutRawTableWidth                 | `boolean` | Optional | `true`, `false`, `undefined` |
| layoutTableRowsApart                | `boolean` | Optional | `true`, `false`, `undefined` |
| useWord97LineBreakRules             | `boolean` | Optional | `true`, `false`, `undefined` |
| doNotBreakWrappedTables             | `boolean` | Optional | `true`, `false`, `undefined` |
| doNotSnapToGridInCell               | `boolean` | Optional | `true`, `false`, `undefined` |
| selectFieldWithFirstOrLastCharacter | `boolean` | Optional | `true`, `false`, `undefined` |
| applyBreakingRules                  | `boolean` | Optional | `true`, `false`, `undefined` |
| doNotWrapTextWithPunctuation        | `boolean` | Optional | `true`, `false`, `undefined` |
| doNotUseEastAsianBreakRules         | `boolean` | Optional | `true`, `false`, `undefined` |
| useWord2002TableStyleRules          | `boolean` | Optional | `true`, `false`, `undefined` |
| growAutofit                         | `boolean` | Optional | `true`, `false`, `undefined` |
| useFELayout                         | `boolean` | Optional | `true`, `false`, `undefined` |
| useNormalStyleForList               | `boolean` | Optional | `true`, `false`, `undefined` |
| doNotUseIndentAsNumberingTabStop    | `boolean` | Optional | `true`, `false`, `undefined` |
| useAlternateEastAsianLineBreakRules | `boolean` | Optional | `true`, `false`, `undefined` |
| allowSpaceOfSameStyleInTable        | `boolean` | Optional | `true`, `false`, `undefined` |
| doNotSuppressIndentation            | `boolean` | Optional | `true`, `false`, `undefined` |
| doNotAutofitConstrainedTables       | `boolean` | Optional | `true`, `false`, `undefined` |
| autofitToFirstFixedWidthCell        | `boolean` | Optional | `true`, `false`, `undefined` |
| underlineTabInNumberingList         | `boolean` | Optional | `true`, `false`, `undefined` |
| displayHangulFixedWidth             | `boolean` | Optional | `true`, `false`, `undefined` |
| splitPgBreakAndParaMark             | `boolean` | Optional | `true`, `false`, `undefined` |
| doNotVerticallyAlignCellWithSp      | `boolean` | Optional | `true`, `false`, `undefined` |
| doNotBreakConstrainedForcedTable    | `boolean` | Optional | `true`, `false`, `undefined` |
| ignoreVerticalAlignmentInTextboxes  | `boolean` | Optional | `true`, `false`, `undefined` |
| useAnsiKerningPairs                 | `boolean` | Optional | `true`, `false`, `undefined` |
| cachedColumnBalance                 | `boolean` | Optional | `true`, `false`, `undefined` |
