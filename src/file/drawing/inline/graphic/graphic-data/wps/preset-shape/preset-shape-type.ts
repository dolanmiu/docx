/**
 * Preset shape types for DrawingML shapes.
 *
 * Reference: ST_ShapeType in ooxml-schemas/ISO-IEC29500-4_2016/dml-main.xsd
 *
 * @module
 */

/* cspell:disable */
/**
 * Every preset shape, by the name this library gives it, mapped to its name in OOXML (`a:prstGeom/@prst`).
 * The OOXML names are often abbreviated (`roundRect`) or numbered (`ribbon2`), so the library uses names
 * that say what the shape is.
 */
export const PRESET_SHAPE_OOXML_NAMES = {
    // Lines and connectors
    line: "line",
    inverseLine: "lineInv",
    straightConnector: "straightConnector1",
    elbowConnectorOneBend: "bentConnector2",
    elbowConnector: "bentConnector3",
    elbowConnectorThreeBends: "bentConnector4",
    elbowConnectorFourBends: "bentConnector5",
    curvedConnectorOneBend: "curvedConnector2",
    curvedConnector: "curvedConnector3",
    curvedConnectorThreeBends: "curvedConnector4",
    curvedConnectorFourBends: "curvedConnector5",
    // Basic shapes
    triangle: "triangle",
    rightTriangle: "rtTriangle",
    diamond: "diamond",
    parallelogram: "parallelogram",
    trapezoid: "trapezoid",
    nonIsoscelesTrapezoid: "nonIsoscelesTrapezoid",
    pentagon: "pentagon",
    hexagon: "hexagon",
    heptagon: "heptagon",
    octagon: "octagon",
    decagon: "decagon",
    dodecagon: "dodecagon",
    ellipse: "ellipse",
    teardrop: "teardrop",
    pieWedge: "pieWedge",
    pie: "pie",
    blockArc: "blockArc",
    donut: "donut",
    noSymbol: "noSmoking",
    chord: "chord",
    arc: "arc",
    frame: "frame",
    halfFrame: "halfFrame",
    lShape: "corner",
    diagonalStripe: "diagStripe",
    cross: "plus",
    plaque: "plaque",
    cylinder: "can",
    cube: "cube",
    beveledRectangle: "bevel",
    foldedCorner: "foldedCorner",
    smileyFace: "smileyFace",
    heart: "heart",
    lightningBolt: "lightningBolt",
    sun: "sun",
    moon: "moon",
    cloud: "cloud",
    leftBracket: "leftBracket",
    rightBracket: "rightBracket",
    leftBrace: "leftBrace",
    rightBrace: "rightBrace",
    bracketPair: "bracketPair",
    bracePair: "bracePair",
    // Rectangles
    rectangle: "rect",
    roundedRectangle: "roundRect",
    roundedCornerRectangle: "round1Rect",
    topRoundedCornersRectangle: "round2SameRect",
    diagonalRoundedCornersRectangle: "round2DiagRect",
    snippedCornerRectangle: "snip1Rect",
    topSnippedCornersRectangle: "snip2SameRect",
    diagonalSnippedCornersRectangle: "snip2DiagRect",
    roundedAndSnippedCornersRectangle: "snipRoundRect",
    // Block arrows
    rightArrow: "rightArrow",
    leftArrow: "leftArrow",
    upArrow: "upArrow",
    downArrow: "downArrow",
    leftRightArrow: "leftRightArrow",
    upDownArrow: "upDownArrow",
    quadArrow: "quadArrow",
    leftRightUpArrow: "leftRightUpArrow",
    bentArrow: "bentArrow",
    uTurnArrow: "uturnArrow",
    leftUpArrow: "leftUpArrow",
    bentUpArrow: "bentUpArrow",
    curvedRightArrow: "curvedRightArrow",
    curvedLeftArrow: "curvedLeftArrow",
    curvedUpArrow: "curvedUpArrow",
    curvedDownArrow: "curvedDownArrow",
    stripedRightArrow: "stripedRightArrow",
    notchedRightArrow: "notchedRightArrow",
    pentagonArrow: "homePlate",
    chevron: "chevron",
    rightArrowCallout: "rightArrowCallout",
    downArrowCallout: "downArrowCallout",
    leftArrowCallout: "leftArrowCallout",
    upArrowCallout: "upArrowCallout",
    leftRightArrowCallout: "leftRightArrowCallout",
    upDownArrowCallout: "upDownArrowCallout",
    quadArrowCallout: "quadArrowCallout",
    circularArrow: "circularArrow",
    leftCircularArrow: "leftCircularArrow",
    leftRightCircularArrow: "leftRightCircularArrow",
    swooshArrow: "swooshArrow",
    // Equation shapes
    mathPlus: "mathPlus",
    mathMinus: "mathMinus",
    mathMultiply: "mathMultiply",
    mathDivide: "mathDivide",
    mathEqual: "mathEqual",
    mathNotEqual: "mathNotEqual",
    // Flowchart
    flowChartProcess: "flowChartProcess",
    flowChartAlternateProcess: "flowChartAlternateProcess",
    flowChartDecision: "flowChartDecision",
    flowChartInputOutput: "flowChartInputOutput",
    flowChartPredefinedProcess: "flowChartPredefinedProcess",
    flowChartInternalStorage: "flowChartInternalStorage",
    flowChartDocument: "flowChartDocument",
    flowChartMultidocument: "flowChartMultidocument",
    flowChartTerminator: "flowChartTerminator",
    flowChartPreparation: "flowChartPreparation",
    flowChartManualInput: "flowChartManualInput",
    flowChartManualOperation: "flowChartManualOperation",
    flowChartConnector: "flowChartConnector",
    flowChartOffpageConnector: "flowChartOffpageConnector",
    flowChartPunchedCard: "flowChartPunchedCard",
    flowChartPunchedTape: "flowChartPunchedTape",
    flowChartSummingJunction: "flowChartSummingJunction",
    flowChartOr: "flowChartOr",
    flowChartCollate: "flowChartCollate",
    flowChartSort: "flowChartSort",
    flowChartExtract: "flowChartExtract",
    flowChartMerge: "flowChartMerge",
    flowChartOfflineStorage: "flowChartOfflineStorage",
    flowChartOnlineStorage: "flowChartOnlineStorage",
    flowChartDelay: "flowChartDelay",
    flowChartMagneticTape: "flowChartMagneticTape",
    flowChartMagneticDisk: "flowChartMagneticDisk",
    flowChartMagneticDrum: "flowChartMagneticDrum",
    flowChartDisplay: "flowChartDisplay",
    // Stars and banners
    explosion12: "irregularSeal1",
    explosion14: "irregularSeal2",
    star4: "star4",
    star5: "star5",
    star6: "star6",
    star7: "star7",
    star8: "star8",
    star10: "star10",
    star12: "star12",
    star16: "star16",
    star24: "star24",
    star32: "star32",
    ribbonUp: "ribbon2",
    ribbonDown: "ribbon",
    curvedRibbonUp: "ellipseRibbon2",
    curvedRibbonDown: "ellipseRibbon",
    leftRightRibbon: "leftRightRibbon",
    verticalScroll: "verticalScroll",
    horizontalScroll: "horizontalScroll",
    wave: "wave",
    doubleWave: "doubleWave",
    // Callouts
    rectangularCallout: "wedgeRectCallout",
    roundedRectangularCallout: "wedgeRoundRectCallout",
    ellipticalCallout: "wedgeEllipseCallout",
    cloudCallout: "cloudCallout",
    lineCallout: "borderCallout1",
    bentLineCallout: "borderCallout2",
    doubleBentLineCallout: "borderCallout3",
    lineCalloutWithAccentBar: "accentCallout1",
    bentLineCalloutWithAccentBar: "accentCallout2",
    doubleBentLineCalloutWithAccentBar: "accentCallout3",
    lineCalloutWithNoBorder: "callout1",
    bentLineCalloutWithNoBorder: "callout2",
    doubleBentLineCalloutWithNoBorder: "callout3",
    lineCalloutWithBorderAndAccentBar: "accentBorderCallout1",
    bentLineCalloutWithBorderAndAccentBar: "accentBorderCallout2",
    doubleBentLineCalloutWithBorderAndAccentBar: "accentBorderCallout3",
    // Action buttons
    actionButtonBlank: "actionButtonBlank",
    actionButtonHome: "actionButtonHome",
    actionButtonHelp: "actionButtonHelp",
    actionButtonInformation: "actionButtonInformation",
    actionButtonForwardNext: "actionButtonForwardNext",
    actionButtonBackPrevious: "actionButtonBackPrevious",
    actionButtonEnd: "actionButtonEnd",
    actionButtonBeginning: "actionButtonBeginning",
    actionButtonReturn: "actionButtonReturn",
    actionButtonDocument: "actionButtonDocument",
    actionButtonSound: "actionButtonSound",
    actionButtonMovie: "actionButtonMovie",
    // Other shapes
    gear6: "gear6",
    gear9: "gear9",
    funnel: "funnel",
    cornerTabs: "cornerTabs",
    squareTabs: "squareTabs",
    plaqueTabs: "plaqueTabs",
    chartX: "chartX",
    chartStar: "chartStar",
    chartPlus: "chartPlus",
} as const;
/* cspell:enable */

/**
 * The name of a preset shape.
 *
 * Covers all 187 preset shapes in OOXML, from basic shapes such as `"rectangle"`, `"ellipse"` and `"triangle"`
 * to lines and connectors, block arrows, stars, callouts and flowchart symbols.
 *
 * @publicApi
 */
export type PresetShapeType = keyof typeof PRESET_SHAPE_OOXML_NAMES;

const OOXML_NAMES: ReadonlyMap<string, string> = new Map(Object.entries(PRESET_SHAPE_OOXML_NAMES));
const NAMES_BY_OOXML_NAME: ReadonlyMap<string, string> = new Map(
    Object.entries(PRESET_SHAPE_OOXML_NAMES).map(([name, ooxml]) => [ooxml, name]),
);

/**
 * The OOXML name (`ST_ShapeType`) of a preset shape, such as `"roundRect"` for a `"roundedRectangle"`.
 *
 * @throws If `type` is not a preset shape. The error suggests the right name when `type` is an OOXML name
 */
export const getOoxmlShapeName = (type: PresetShapeType): string => {
    const ooxmlName = OOXML_NAMES.get(type);
    if (ooxmlName === undefined) {
        const suggestion = NAMES_BY_OOXML_NAME.get(type);
        throw new Error(`Invalid shape type "${type}".${suggestion ? ` Did you mean "${suggestion}"?` : ""}`);
    }
    return ooxmlName;
};

const CONNECTOR_SHAPE_TYPES: ReadonlySet<PresetShapeType> = new Set<PresetShapeType>([
    "line",
    "inverseLine",
    "straightConnector",
    "elbowConnectorOneBend",
    "elbowConnector",
    "elbowConnectorThreeBends",
    "elbowConnectorFourBends",
    "curvedConnectorOneBend",
    "curvedConnector",
    "curvedConnectorThreeBends",
    "curvedConnectorFourBends",
]);

/**
 * Whether a preset is a line or connector. Word writes these with `wps:cNvCnPr`
 * (connector properties) instead of `wps:cNvSpPr`.
 */
export const isConnectorShapeType = (type: PresetShapeType): boolean => CONNECTOR_SHAPE_TYPES.has(type);
