/**
 * Adjustments for preset shapes: the values behind the handles that change a shape's proportions in Word,
 * such as the corner radius of a rounded rectangle or the thickness of an arrow's shaft.
 *
 * Each shape has its own adjustments, named after what they change. Lengths and positions are percentages
 * and angles are in degrees. They are written as the shape guides of the Office Open XML preset shape
 * definitions (`adj`, `adj1`, `adj2`, ...), which store percentages in thousandths of a percent and
 * angles in 60,000ths of a degree.
 *
 * @module
 */
import type { PresetShapeType } from "./preset-shape-type";

/* cspell:disable */
/**
 * The adjustments of each preset shape that has them, by shape type.
 *
 * Angles are measured clockwise from 3 o'clock. Word keeps each value within the range the shape
 * allows, so a value that is too large acts like the largest allowed value.
 *
 * @publicApi
 */
export type PresetShapeAdjustments = {
    readonly accentBorderCallout1: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-38.333` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.5` */
        readonly lineEndY?: number;
    };
    readonly accentBorderCallout2: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** Bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly bendX?: number;
        /** Bend in the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly bendY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-46.667` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.5` */
        readonly lineEndY?: number;
    };
    readonly accentBorderCallout3: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** First bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly firstBendX?: number;
        /** First bend in the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly firstBendY?: number;
        /** Second bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly secondBendX?: number;
        /** Second bend in the callout line, from the top edge, as a percent of the height. Default `100` */
        readonly secondBendY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.963` */
        readonly lineEndY?: number;
    };
    readonly accentCallout1: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-38.333` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.5` */
        readonly lineEndY?: number;
    };
    readonly accentCallout2: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** Bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly bendX?: number;
        /** Bend in the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly bendY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-46.667` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.5` */
        readonly lineEndY?: number;
    };
    readonly accentCallout3: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** First bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly firstBendX?: number;
        /** First bend in the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly firstBendY?: number;
        /** Second bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly secondBendX?: number;
        /** Second bend in the callout line, from the top edge, as a percent of the height. Default `100` */
        readonly secondBendY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.963` */
        readonly lineEndY?: number;
    };
    readonly arc: {
        /** Angle where the arc starts, in degrees clockwise from 3 o'clock. Default `270` */
        readonly startAngle?: number;
        /** Angle where the arc ends, in degrees clockwise from 3 o'clock. Default `0` */
        readonly endAngle?: number;
    };
    readonly bentArrow: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
        /** Outer radius of the bend, as a percent of the shorter side. Default `43.75` */
        readonly bendRadius?: number;
    };
    readonly bentConnector3: {
        /** Where the connector bends, from the left edge, as a percent of the width. Default `50` */
        readonly bendX?: number;
    };
    readonly bentConnector4: {
        /** Where the connector first bends, from the left edge, as a percent of the width. Default `50` */
        readonly firstBendX?: number;
        /** Where the connector bends a second time, from the top edge, as a percent of the height. Default `50` */
        readonly secondBendY?: number;
    };
    readonly bentConnector5: {
        /** Where the connector first bends, from the left edge, as a percent of the width. Default `50` */
        readonly firstBendX?: number;
        /** Where the connector bends a second time, from the top edge, as a percent of the height. Default `50` */
        readonly secondBendY?: number;
        /** Where the connector bends a third time, from the left edge, as a percent of the width. Default `50` */
        readonly thirdBendX?: number;
    };
    readonly bentUpArrow: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
    };
    readonly bevel: {
        /** Width of the bevelled edge, as a percent of the shorter side. Default `12.5` */
        readonly bevelWidth?: number;
    };
    readonly blockArc: {
        /** Angle where the arc starts, in degrees clockwise from 3 o'clock. Default `180` */
        readonly startAngle?: number;
        /** Angle where the arc ends, in degrees clockwise from 3 o'clock. Default `0` */
        readonly endAngle?: number;
        /** Thickness of the arc, as a percent of the shorter side. Default `25` */
        readonly thickness?: number;
    };
    readonly borderCallout1: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-38.333` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.5` */
        readonly lineEndY?: number;
    };
    readonly borderCallout2: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** Bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly bendX?: number;
        /** Bend in the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly bendY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-46.667` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.5` */
        readonly lineEndY?: number;
    };
    readonly borderCallout3: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** First bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly firstBendX?: number;
        /** First bend in the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly firstBendY?: number;
        /** Second bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly secondBendX?: number;
        /** Second bend in the callout line, from the top edge, as a percent of the height. Default `100` */
        readonly secondBendY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.963` */
        readonly lineEndY?: number;
    };
    readonly bracePair: {
        /** Radius of the curves in the braces, as a percent of the shorter side. Default `8.333` */
        readonly curveRadius?: number;
    };
    readonly bracketPair: {
        /** Radius of the corners of the brackets, as a percent of the shorter side. Default `16.667` */
        readonly cornerRadius?: number;
    };
    readonly callout1: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-38.333` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.5` */
        readonly lineEndY?: number;
    };
    readonly callout2: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** Bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly bendX?: number;
        /** Bend in the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly bendY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-46.667` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.5` */
        readonly lineEndY?: number;
    };
    readonly callout3: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** First bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly firstBendX?: number;
        /** First bend in the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly firstBendY?: number;
        /** Second bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly secondBendX?: number;
        /** Second bend in the callout line, from the top edge, as a percent of the height. Default `100` */
        readonly secondBendY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.963` */
        readonly lineEndY?: number;
    };
    readonly can: {
        /** Height of the elliptical top, as a percent of the shorter side. Default `25` */
        readonly topHeight?: number;
    };
    readonly chevron: {
        /** Length of the point, as a percent of the shorter side. Default `50` */
        readonly pointLength?: number;
    };
    readonly chord: {
        /** Angle where the chord starts, in degrees clockwise from 3 o'clock. Default `45` */
        readonly startAngle?: number;
        /** Angle where the chord ends, in degrees clockwise from 3 o'clock. Default `270` */
        readonly endAngle?: number;
    };
    readonly circularArrow: {
        /** Thickness of the arrow's body, as a percent of the shorter side. Default `12.5` */
        readonly shaftThickness?: number;
        /** Angle the arrowhead covers, in degrees. Default `19.039` */
        readonly headAngle?: number;
        /** Angle where the arrow ends, in degrees clockwise from 3 o'clock. Default `340.961` */
        readonly endAngle?: number;
        /** Angle where the arrow starts, in degrees clockwise from 3 o'clock. Default `180` */
        readonly startAngle?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headWidth?: number;
    };
    readonly cloudCallout: {
        /** Tip of the pointer, from the centre, as a percent of the width. Negative values are to the left. Default `-20.833` */
        readonly pointerX?: number;
        /** Tip of the pointer, from the centre, as a percent of the height. Negative values are above the centre. Default `62.5` */
        readonly pointerY?: number;
    };
    readonly corner: {
        /** Thickness of the horizontal arm, as a percent of the shorter side. Default `50` */
        readonly horizontalArmThickness?: number;
        /** Thickness of the vertical arm, as a percent of the shorter side. Default `50` */
        readonly verticalArmThickness?: number;
    };
    readonly cube: {
        /** Depth of the top and side faces, as a percent of the shorter side. Default `25` */
        readonly depth?: number;
    };
    readonly curvedConnector3: {
        /** Where the connector bends, from the left edge, as a percent of the width. Default `50` */
        readonly bendX?: number;
    };
    readonly curvedConnector4: {
        /** Where the connector first bends, from the left edge, as a percent of the width. Default `50` */
        readonly firstBendX?: number;
        /** Where the connector bends a second time, from the top edge, as a percent of the height. Default `50` */
        readonly secondBendY?: number;
    };
    readonly curvedConnector5: {
        /** Where the connector first bends, from the left edge, as a percent of the width. Default `50` */
        readonly firstBendX?: number;
        /** Where the connector bends a second time, from the top edge, as a percent of the height. Default `50` */
        readonly secondBendY?: number;
        /** Where the connector bends a third time, from the left edge, as a percent of the width. Default `50` */
        readonly thirdBendX?: number;
    };
    readonly curvedDownArrow: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
    };
    readonly curvedLeftArrow: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
    };
    readonly curvedRightArrow: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
    };
    readonly curvedUpArrow: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
    };
    readonly diagStripe: {
        /** How much of the top and left edges the stripe covers, as a percent of the width and height. Default `50` */
        readonly stripeWidth?: number;
    };
    readonly donut: {
        /** Thickness of the ring, as a percent of the shorter side. Default `25` */
        readonly thickness?: number;
    };
    readonly doubleWave: {
        /** Height of the waves, as a percent of the height. Default `6.25` */
        readonly waveHeight?: number;
        /** Shifts the waves sideways, as a percent of the width, from -10 to 10. Default `0` */
        readonly skew?: number;
    };
    readonly downArrow: {
        /** Thickness of the shaft, as a percent of the width. Default `50` */
        readonly shaftThickness?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headLength?: number;
    };
    readonly downArrowCallout: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
        /** Height of the box, as a percent of the height. Default `64.977` */
        readonly boxHeight?: number;
    };
    readonly ellipseRibbon: {
        /** Thickness of the ribbon, as a percent of the height. Default `25` */
        readonly thickness?: number;
        /** Width of the centre section, as a percent of the width. Default `50` */
        readonly centerWidth?: number;
        /** How far the ribbon curves, as a percent of the height. Default `12.5` */
        readonly curveDepth?: number;
    };
    readonly ellipseRibbon2: {
        /** Thickness of the ribbon, as a percent of the height. Default `25` */
        readonly thickness?: number;
        /** Width of the centre section, as a percent of the width. Default `50` */
        readonly centerWidth?: number;
        /** How far the ribbon curves, as a percent of the height. Default `12.5` */
        readonly curveDepth?: number;
    };
    readonly foldedCorner: {
        /** Size of the folded corner, as a percent of the shorter side. Default `16.667` */
        readonly foldSize?: number;
    };
    readonly frame: {
        /** Thickness of the frame, as a percent of the shorter side. Default `12.5` */
        readonly thickness?: number;
    };
    readonly gear6: {
        /** Height of the teeth, as a percent of the shorter side. Default `15` */
        readonly toothHeight?: number;
        /** Width of the top of each tooth, as a percent of the shorter side. Default `3.526` */
        readonly toothWidth?: number;
    };
    readonly gear9: {
        /** Height of the teeth, as a percent of the shorter side. Default `10` */
        readonly toothHeight?: number;
        /** Width of the top of each tooth, as a percent of the shorter side. Default `1.763` */
        readonly toothWidth?: number;
    };
    readonly halfFrame: {
        /** Thickness of the horizontal arm, as a percent of the shorter side. Default `33.333` */
        readonly horizontalArmThickness?: number;
        /** Thickness of the vertical arm, as a percent of the shorter side. Default `33.333` */
        readonly verticalArmThickness?: number;
    };
    readonly hexagon: {
        /** How far the left and right points stick out, as a percent of the shorter side. Default `25` */
        readonly pointLength?: number;
    };
    readonly homePlate: {
        /** Length of the point, as a percent of the shorter side. Default `50` */
        readonly pointLength?: number;
    };
    readonly horizontalScroll: {
        /** Size of the rolled ends, as a percent of the shorter side. Default `12.5` */
        readonly rollSize?: number;
    };
    readonly leftArrow: {
        /** Thickness of the shaft, as a percent of the height. Default `50` */
        readonly shaftThickness?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headLength?: number;
    };
    readonly leftArrowCallout: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
        /** Width of the box, as a percent of the width. Default `64.977` */
        readonly boxWidth?: number;
    };
    readonly leftBrace: {
        /** Height of the curves, as a percent of the shorter side. Default `8.333` */
        readonly curveHeight?: number;
        /** Where the middle point is, from the top, as a percent of the height. Default `50` */
        readonly pointPosition?: number;
    };
    readonly leftBracket: {
        /** Height of the curved corners, as a percent of the shorter side. Default `8.333` */
        readonly cornerHeight?: number;
    };
    readonly leftCircularArrow: {
        /** Thickness of the arrow's body, as a percent of the shorter side. Default `12.5` */
        readonly shaftThickness?: number;
        /** Angle the arrowhead covers, in degrees. Negative, because the arrow turns anticlockwise. Default `-19.039` */
        readonly headAngle?: number;
        /** Angle where the arrow ends, in degrees clockwise from 3 o'clock. Default `19.039` */
        readonly endAngle?: number;
        /** Angle where the arrow starts, in degrees clockwise from 3 o'clock. Default `180` */
        readonly startAngle?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headWidth?: number;
    };
    readonly leftRightArrow: {
        /** Thickness of the shaft, as a percent of the height. Default `50` */
        readonly shaftThickness?: number;
        /** Length of each arrowhead, as a percent of the shorter side. Default `50` */
        readonly headLength?: number;
    };
    readonly leftRightArrowCallout: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of each arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of each arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
        /** Width of the box, as a percent of the width. Default `48.123` */
        readonly boxWidth?: number;
    };
    readonly leftRightCircularArrow: {
        /** Thickness of the arrow's body, as a percent of the shorter side. Default `12.5` */
        readonly shaftThickness?: number;
        /** Angle each arrowhead covers, in degrees. Default `19.039` */
        readonly headAngle?: number;
        /** Angle where the arrow ends, in degrees clockwise from 3 o'clock. Default `340.961` */
        readonly endAngle?: number;
        /** Angle where the arrow starts, in degrees clockwise from 3 o'clock. Default `199.039` */
        readonly startAngle?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headWidth?: number;
    };
    readonly leftRightRibbon: {
        /** Thickness of the ribbon, as a percent of the height. Default `50` */
        readonly thickness?: number;
        /** Length of the pointed ends, as a percent of the shorter side. Default `50` */
        readonly endLength?: number;
        /** How far the right half is offset from the left half, as a percent of the height. Default `16.667` */
        readonly verticalOffset?: number;
    };
    readonly leftRightUpArrow: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of each arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of each arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
    };
    readonly leftUpArrow: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of each arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of each arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
    };
    readonly mathDivide: {
        /** Thickness of the bar, as a percent of the height. Default `23.52` */
        readonly thickness?: number;
        /** Gap between the bar and each dot, as a percent of the height. Default `5.88` */
        readonly gap?: number;
        /** Radius of the dots, as a percent of the height. Default `11.76` */
        readonly dotRadius?: number;
    };
    readonly mathEqual: {
        /** Thickness of each bar, as a percent of the height. Default `23.52` */
        readonly thickness?: number;
        /** Gap between the bars, as a percent of the height. Default `11.76` */
        readonly gap?: number;
    };
    readonly mathMinus: {
        /** Thickness of the bar, as a percent of the height. Default `23.52` */
        readonly thickness?: number;
    };
    readonly mathMultiply: {
        /** Thickness of the strokes, as a percent of the shorter side. Default `23.52` */
        readonly thickness?: number;
    };
    readonly mathNotEqual: {
        /** Thickness of each bar, as a percent of the height. Default `23.52` */
        readonly thickness?: number;
        /** Angle of the slash, in degrees. Default `110` */
        readonly slashAngle?: number;
        /** Gap between the bars, as a percent of the height. Default `11.76` */
        readonly gap?: number;
    };
    readonly mathPlus: {
        /** Thickness of the strokes, as a percent of the shorter side. Default `23.52` */
        readonly thickness?: number;
    };
    readonly moon: {
        /** Thickness of the crescent at its widest, as a percent of the shorter side. Default `50` */
        readonly thickness?: number;
    };
    readonly nonIsoscelesTrapezoid: {
        /** How far in the top-left corner is, as a percent of the shorter side. Default `25` */
        readonly leftSlant?: number;
        /** How far in the top-right corner is, as a percent of the shorter side. Default `25` */
        readonly rightSlant?: number;
    };
    readonly noSmoking: {
        /** Thickness of the ring and the bar, as a percent of the shorter side. Default `18.75` */
        readonly thickness?: number;
    };
    readonly notchedRightArrow: {
        /** Thickness of the shaft, as a percent of the height. Default `50` */
        readonly shaftThickness?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headLength?: number;
    };
    readonly octagon: {
        /** Size of the cut corners, as a percent of the shorter side. Default `29.289` */
        readonly cornerSize?: number;
    };
    readonly parallelogram: {
        /** How far right the top edge is shifted, as a percent of the shorter side. Default `25` */
        readonly slant?: number;
    };
    readonly pie: {
        /** Angle where the slice starts, in degrees clockwise from 3 o'clock. Default `0` */
        readonly startAngle?: number;
        /** Angle where the slice ends, in degrees clockwise from 3 o'clock. Default `270` */
        readonly endAngle?: number;
    };
    readonly plaque: {
        /** Radius of the curved-in corners, as a percent of the shorter side. Default `16.667` */
        readonly cornerRadius?: number;
    };
    readonly plus: {
        /** Size of the cut-away corners, as a percent of the shorter side. Larger values make thinner arms. Default `25` */
        readonly cornerSize?: number;
    };
    readonly quadArrow: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `22.5` */
        readonly shaftThickness?: number;
        /** Width of each arrowhead, as a percent of the shorter side. Default `45` */
        readonly headWidth?: number;
        /** Length of each arrowhead, as a percent of the shorter side. Default `22.5` */
        readonly headLength?: number;
    };
    readonly quadArrowCallout: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `18.515` */
        readonly shaftThickness?: number;
        /** Width of each arrowhead, as a percent of the shorter side. Default `37.03` */
        readonly headWidth?: number;
        /** Length of each arrowhead, as a percent of the shorter side. Default `18.515` */
        readonly headLength?: number;
        /** Size of the box, as a percent of the width and height. Default `48.123` */
        readonly boxSize?: number;
    };
    readonly ribbon: {
        /** How far the ends are offset from the centre section, as a percent of the height. Default `16.667` */
        readonly endOffset?: number;
        /** Width of the centre section, as a percent of the width. Default `50` */
        readonly centerWidth?: number;
    };
    readonly ribbon2: {
        /** How far the ends are offset from the centre section, as a percent of the height. Default `16.667` */
        readonly endOffset?: number;
        /** Width of the centre section, as a percent of the width. Default `50` */
        readonly centerWidth?: number;
    };
    readonly rightArrow: {
        /** Thickness of the shaft, as a percent of the height. Default `50` */
        readonly shaftThickness?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headLength?: number;
    };
    readonly rightArrowCallout: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
        /** Width of the box, as a percent of the width. Default `64.977` */
        readonly boxWidth?: number;
    };
    readonly rightBrace: {
        /** Height of the curves, as a percent of the shorter side. Default `8.333` */
        readonly curveHeight?: number;
        /** Where the middle point is, from the top, as a percent of the height. Default `50` */
        readonly pointPosition?: number;
    };
    readonly rightBracket: {
        /** Height of the curved corners, as a percent of the shorter side. Default `8.333` */
        readonly cornerHeight?: number;
    };
    readonly round1Rect: {
        /** Radius of the top-right corner, as a percent of the shorter side. Default `16.667` */
        readonly cornerRadius?: number;
    };
    readonly round2DiagRect: {
        /** Radius of the top-left and bottom-right corners, as a percent of the shorter side. Default `16.667` */
        readonly topLeftBottomRightRadius?: number;
        /** Radius of the top-right and bottom-left corners, as a percent of the shorter side. Default `0` */
        readonly topRightBottomLeftRadius?: number;
    };
    readonly round2SameRect: {
        /** Radius of the top corners, as a percent of the shorter side. Default `16.667` */
        readonly topCornerRadius?: number;
        /** Radius of the bottom corners, as a percent of the shorter side. Default `0` */
        readonly bottomCornerRadius?: number;
    };
    readonly roundRect: {
        /** Radius of the corners, as a percent of the shorter side. 50 makes the ends fully round. Default `16.667` */
        readonly cornerRadius?: number;
    };
    readonly smileyFace: {
        /** How much the mouth curves, as a percent of the height. Negative values frown. Default `4.653` */
        readonly smile?: number;
    };
    readonly snip1Rect: {
        /** Size of the cut top-right corner, as a percent of the shorter side. Default `16.667` */
        readonly cornerSize?: number;
    };
    readonly snip2DiagRect: {
        /** Size of the cut top-left and bottom-right corners, as a percent of the shorter side. Default `0` */
        readonly topLeftBottomRightSize?: number;
        /** Size of the cut top-right and bottom-left corners, as a percent of the shorter side. Default `16.667` */
        readonly topRightBottomLeftSize?: number;
    };
    readonly snip2SameRect: {
        /** Size of the cut top corners, as a percent of the shorter side. Default `16.667` */
        readonly topCornerSize?: number;
        /** Size of the cut bottom corners, as a percent of the shorter side. Default `0` */
        readonly bottomCornerSize?: number;
    };
    readonly snipRoundRect: {
        /** Radius of the rounded top-left corner, as a percent of the shorter side. Default `16.667` */
        readonly roundedCornerRadius?: number;
        /** Size of the cut top-right corner, as a percent of the shorter side. Default `16.667` */
        readonly snippedCornerSize?: number;
    };
    readonly star10: {
        /** Radius of the inner points, as a percent of the outer radius. Default `85.066` */
        readonly innerRadius?: number;
    };
    readonly star12: {
        /** Radius of the inner points, as a percent of the outer radius. Default `75` */
        readonly innerRadius?: number;
    };
    readonly star16: {
        /** Radius of the inner points, as a percent of the outer radius. Default `75` */
        readonly innerRadius?: number;
    };
    readonly star24: {
        /** Radius of the inner points, as a percent of the outer radius. Default `75` */
        readonly innerRadius?: number;
    };
    readonly star32: {
        /** Radius of the inner points, as a percent of the outer radius. Default `75` */
        readonly innerRadius?: number;
    };
    readonly star4: {
        /** Radius of the inner points, as a percent of the outer radius. Default `25` */
        readonly innerRadius?: number;
    };
    readonly star5: {
        /** Radius of the inner points, as a percent of the outer radius. Default `38.196` */
        readonly innerRadius?: number;
    };
    readonly star6: {
        /** Radius of the inner points, as a percent of the outer radius. Default `57.736` */
        readonly innerRadius?: number;
    };
    readonly star7: {
        /** Radius of the inner points, as a percent of the outer radius. Default `69.202` */
        readonly innerRadius?: number;
    };
    readonly star8: {
        /** Radius of the inner points, as a percent of the outer radius. Default `75` */
        readonly innerRadius?: number;
    };
    readonly stripedRightArrow: {
        /** Thickness of the shaft, as a percent of the height. Default `50` */
        readonly shaftThickness?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headLength?: number;
    };
    readonly sun: {
        /** Length of the rays, from the edge to the central disc, as a percent of the width and height. Default `25` */
        readonly rayLength?: number;
    };
    readonly swooshArrow: {
        /** Thickness of the shaft where it meets the arrowhead, as a percent of the height. Default `25` */
        readonly shaftThickness?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `16.667` */
        readonly headLength?: number;
    };
    readonly teardrop: {
        /** How far the point reaches, as a percent of the distance from the centre to the top-right corner. Default `100` */
        readonly pointLength?: number;
    };
    readonly trapezoid: {
        /** How far in the top corners are, as a percent of the shorter side. Default `25` */
        readonly slant?: number;
    };
    readonly triangle: {
        /** Where the top point is, from the left edge, as a percent of the width. Default `50` */
        readonly apexPosition?: number;
    };
    readonly upArrow: {
        /** Thickness of the shaft, as a percent of the width. Default `50` */
        readonly shaftThickness?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headLength?: number;
    };
    readonly upArrowCallout: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
        /** Height of the box, as a percent of the height. Default `64.977` */
        readonly boxHeight?: number;
    };
    readonly upDownArrow: {
        /** Thickness of the shaft, as a percent of the width. Default `50` */
        readonly shaftThickness?: number;
        /** Length of each arrowhead, as a percent of the shorter side. Default `50` */
        readonly headLength?: number;
    };
    readonly upDownArrowCallout: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of each arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of each arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
        /** Height of the box, as a percent of the height. Default `48.123` */
        readonly boxHeight?: number;
    };
    readonly uturnArrow: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
        /** Outer radius of the bend, as a percent of the shorter side. Default `43.75` */
        readonly bendRadius?: number;
        /** How far down the tip of the arrowhead reaches, as a percent of the height. Default `75` */
        readonly tipPosition?: number;
    };
    readonly verticalScroll: {
        /** Size of the rolled ends, as a percent of the shorter side. Default `12.5` */
        readonly rollSize?: number;
    };
    readonly wave: {
        /** Height of the waves, as a percent of the height. Default `12.5` */
        readonly waveHeight?: number;
        /** Shifts the waves sideways, as a percent of the width, from -10 to 10. Default `0` */
        readonly skew?: number;
    };
    readonly wedgeEllipseCallout: {
        /** Tip of the pointer, from the centre, as a percent of the width. Negative values are to the left. Default `-20.833` */
        readonly pointerX?: number;
        /** Tip of the pointer, from the centre, as a percent of the height. Negative values are above the centre. Default `62.5` */
        readonly pointerY?: number;
    };
    readonly wedgeRectCallout: {
        /** Tip of the pointer, from the centre, as a percent of the width. Negative values are to the left. Default `-20.833` */
        readonly pointerX?: number;
        /** Tip of the pointer, from the centre, as a percent of the height. Negative values are above the centre. Default `62.5` */
        readonly pointerY?: number;
    };
    readonly wedgeRoundRectCallout: {
        /** Tip of the pointer, from the centre, as a percent of the width. Negative values are to the left. Default `-20.833` */
        readonly pointerX?: number;
        /** Tip of the pointer, from the centre, as a percent of the height. Negative values are above the centre. Default `62.5` */
        readonly pointerY?: number;
        /** Radius of the corners, as a percent of the shorter side. Default `16.667` */
        readonly cornerRadius?: number;
    };
};
/* cspell:enable */

/**
 * The adjustments a shape of type `T` accepts, such as `{ cornerRadius?: number }` for `"roundRect"`.
 * It is `never` for shapes without handles, which take no adjustments.
 *
 * @publicApi
 */
export type ShapeAdjustments<T extends PresetShapeType = PresetShapeType> = T extends keyof PresetShapeAdjustments
    ? PresetShapeAdjustments[T]
    : never;

/**
 * How an adjustment is written as a shape guide: `offset + value * factor`.
 */
type AdjustmentDefinition = {
    readonly guide: string;
    readonly factor: number;
    readonly offset?: number;
};

// Guides store percentages in thousandths of a percent. `scale` is 0.5 when the guide holds half the length the adjustment describes
const percent = (guide: string, scale = 1): AdjustmentDefinition => ({ guide, factor: 1000 * scale });
// Guides store angles in 60,000ths of a degree
const degrees = (guide: string): AdjustmentDefinition => ({ guide, factor: 60000 });
// The guide holds the rest of the length: 100% minus the adjustment
const remainingPercent = (guide: string): AdjustmentDefinition => ({ guide, factor: -1000, offset: 100000 });

/* cspell:disable */
const PRESET_SHAPE_ADJUSTMENTS: {
    readonly [T in keyof PresetShapeAdjustments]: { readonly [K in keyof PresetShapeAdjustments[T]]-?: AdjustmentDefinition };
} = {
    accentBorderCallout1: {
        lineStartX: percent("adj2"),
        lineStartY: percent("adj1"),
        lineEndX: percent("adj4"),
        lineEndY: percent("adj3"),
    },
    accentBorderCallout2: {
        lineStartX: percent("adj2"),
        lineStartY: percent("adj1"),
        bendX: percent("adj4"),
        bendY: percent("adj3"),
        lineEndX: percent("adj6"),
        lineEndY: percent("adj5"),
    },
    accentBorderCallout3: {
        lineStartX: percent("adj2"),
        lineStartY: percent("adj1"),
        firstBendX: percent("adj4"),
        firstBendY: percent("adj3"),
        secondBendX: percent("adj6"),
        secondBendY: percent("adj5"),
        lineEndX: percent("adj8"),
        lineEndY: percent("adj7"),
    },
    accentCallout1: { lineStartX: percent("adj2"), lineStartY: percent("adj1"), lineEndX: percent("adj4"), lineEndY: percent("adj3") },
    accentCallout2: {
        lineStartX: percent("adj2"),
        lineStartY: percent("adj1"),
        bendX: percent("adj4"),
        bendY: percent("adj3"),
        lineEndX: percent("adj6"),
        lineEndY: percent("adj5"),
    },
    accentCallout3: {
        lineStartX: percent("adj2"),
        lineStartY: percent("adj1"),
        firstBendX: percent("adj4"),
        firstBendY: percent("adj3"),
        secondBendX: percent("adj6"),
        secondBendY: percent("adj5"),
        lineEndX: percent("adj8"),
        lineEndY: percent("adj7"),
    },
    arc: { startAngle: degrees("adj1"), endAngle: degrees("adj2") },
    bentArrow: {
        shaftThickness: percent("adj1"),
        headWidth: percent("adj2", 0.5),
        headLength: percent("adj3"),
        bendRadius: percent("adj4"),
    },
    bentConnector3: { bendX: percent("adj1") },
    bentConnector4: { firstBendX: percent("adj1"), secondBendY: percent("adj2") },
    bentConnector5: { firstBendX: percent("adj1"), secondBendY: percent("adj2"), thirdBendX: percent("adj3") },
    bentUpArrow: { shaftThickness: percent("adj1"), headWidth: percent("adj2", 0.5), headLength: percent("adj3") },
    bevel: { bevelWidth: percent("adj") },
    blockArc: { startAngle: degrees("adj1"), endAngle: degrees("adj2"), thickness: percent("adj3") },
    borderCallout1: { lineStartX: percent("adj2"), lineStartY: percent("adj1"), lineEndX: percent("adj4"), lineEndY: percent("adj3") },
    borderCallout2: {
        lineStartX: percent("adj2"),
        lineStartY: percent("adj1"),
        bendX: percent("adj4"),
        bendY: percent("adj3"),
        lineEndX: percent("adj6"),
        lineEndY: percent("adj5"),
    },
    borderCallout3: {
        lineStartX: percent("adj2"),
        lineStartY: percent("adj1"),
        firstBendX: percent("adj4"),
        firstBendY: percent("adj3"),
        secondBendX: percent("adj6"),
        secondBendY: percent("adj5"),
        lineEndX: percent("adj8"),
        lineEndY: percent("adj7"),
    },
    bracePair: { curveRadius: percent("adj") },
    bracketPair: { cornerRadius: percent("adj") },
    callout1: { lineStartX: percent("adj2"), lineStartY: percent("adj1"), lineEndX: percent("adj4"), lineEndY: percent("adj3") },
    callout2: {
        lineStartX: percent("adj2"),
        lineStartY: percent("adj1"),
        bendX: percent("adj4"),
        bendY: percent("adj3"),
        lineEndX: percent("adj6"),
        lineEndY: percent("adj5"),
    },
    callout3: {
        lineStartX: percent("adj2"),
        lineStartY: percent("adj1"),
        firstBendX: percent("adj4"),
        firstBendY: percent("adj3"),
        secondBendX: percent("adj6"),
        secondBendY: percent("adj5"),
        lineEndX: percent("adj8"),
        lineEndY: percent("adj7"),
    },
    can: { topHeight: percent("adj") },
    chevron: { pointLength: percent("adj") },
    chord: { startAngle: degrees("adj1"), endAngle: degrees("adj2") },
    circularArrow: {
        shaftThickness: percent("adj1"),
        headAngle: degrees("adj2"),
        endAngle: degrees("adj3"),
        startAngle: degrees("adj4"),
        headWidth: percent("adj5", 0.5),
    },
    cloudCallout: { pointerX: percent("adj1"), pointerY: percent("adj2") },
    corner: { horizontalArmThickness: percent("adj1"), verticalArmThickness: percent("adj2") },
    cube: { depth: percent("adj") },
    curvedConnector3: { bendX: percent("adj1") },
    curvedConnector4: { firstBendX: percent("adj1"), secondBendY: percent("adj2") },
    curvedConnector5: { firstBendX: percent("adj1"), secondBendY: percent("adj2"), thirdBendX: percent("adj3") },
    curvedDownArrow: { shaftThickness: percent("adj1"), headWidth: percent("adj2"), headLength: percent("adj3") },
    curvedLeftArrow: { shaftThickness: percent("adj1"), headWidth: percent("adj2"), headLength: percent("adj3") },
    curvedRightArrow: { shaftThickness: percent("adj1"), headWidth: percent("adj2"), headLength: percent("adj3") },
    curvedUpArrow: { shaftThickness: percent("adj1"), headWidth: percent("adj2"), headLength: percent("adj3") },
    diagStripe: { stripeWidth: remainingPercent("adj") },
    donut: { thickness: percent("adj") },
    doubleWave: { waveHeight: percent("adj1"), skew: percent("adj2") },
    downArrow: { shaftThickness: percent("adj1"), headLength: percent("adj2") },
    downArrowCallout: {
        shaftThickness: percent("adj1"),
        headWidth: percent("adj2", 0.5),
        headLength: percent("adj3"),
        boxHeight: percent("adj4"),
    },
    ellipseRibbon: { thickness: percent("adj1"), centerWidth: percent("adj2"), curveDepth: percent("adj3") },
    ellipseRibbon2: { thickness: percent("adj1"), centerWidth: percent("adj2"), curveDepth: percent("adj3") },
    foldedCorner: { foldSize: percent("adj") },
    frame: { thickness: percent("adj1") },
    gear6: { toothHeight: percent("adj1"), toothWidth: percent("adj2") },
    gear9: { toothHeight: percent("adj1"), toothWidth: percent("adj2") },
    halfFrame: { horizontalArmThickness: percent("adj1"), verticalArmThickness: percent("adj2") },
    hexagon: { pointLength: percent("adj") },
    homePlate: { pointLength: percent("adj") },
    horizontalScroll: { rollSize: percent("adj") },
    leftArrow: { shaftThickness: percent("adj1"), headLength: percent("adj2") },
    leftArrowCallout: {
        shaftThickness: percent("adj1"),
        headWidth: percent("adj2", 0.5),
        headLength: percent("adj3"),
        boxWidth: percent("adj4"),
    },
    leftBrace: { curveHeight: percent("adj1"), pointPosition: percent("adj2") },
    leftBracket: { cornerHeight: percent("adj") },
    leftCircularArrow: {
        shaftThickness: percent("adj1"),
        headAngle: degrees("adj2"),
        endAngle: degrees("adj3"),
        startAngle: degrees("adj4"),
        headWidth: percent("adj5", 0.5),
    },
    leftRightArrow: { shaftThickness: percent("adj1"), headLength: percent("adj2") },
    leftRightArrowCallout: {
        shaftThickness: percent("adj1"),
        headWidth: percent("adj2", 0.5),
        headLength: percent("adj3"),
        boxWidth: percent("adj4"),
    },
    leftRightCircularArrow: {
        shaftThickness: percent("adj1"),
        headAngle: degrees("adj2"),
        endAngle: degrees("adj3"),
        startAngle: degrees("adj4"),
        headWidth: percent("adj5", 0.5),
    },
    leftRightRibbon: { thickness: percent("adj1"), endLength: percent("adj2"), verticalOffset: percent("adj3") },
    leftRightUpArrow: { shaftThickness: percent("adj1"), headWidth: percent("adj2", 0.5), headLength: percent("adj3") },
    leftUpArrow: { shaftThickness: percent("adj1"), headWidth: percent("adj2", 0.5), headLength: percent("adj3") },
    mathDivide: { thickness: percent("adj1"), gap: percent("adj2"), dotRadius: percent("adj3") },
    mathEqual: { thickness: percent("adj1"), gap: percent("adj2") },
    mathMinus: { thickness: percent("adj1") },
    mathMultiply: { thickness: percent("adj1") },
    mathNotEqual: { thickness: percent("adj1"), slashAngle: degrees("adj2"), gap: percent("adj3") },
    mathPlus: { thickness: percent("adj1") },
    moon: { thickness: percent("adj") },
    nonIsoscelesTrapezoid: { leftSlant: percent("adj1"), rightSlant: percent("adj2") },
    noSmoking: { thickness: percent("adj") },
    notchedRightArrow: { shaftThickness: percent("adj1"), headLength: percent("adj2") },
    octagon: { cornerSize: percent("adj") },
    parallelogram: { slant: percent("adj") },
    pie: { startAngle: degrees("adj1"), endAngle: degrees("adj2") },
    plaque: { cornerRadius: percent("adj") },
    plus: { cornerSize: percent("adj") },
    quadArrow: { shaftThickness: percent("adj1"), headWidth: percent("adj2", 0.5), headLength: percent("adj3") },
    quadArrowCallout: {
        shaftThickness: percent("adj1"),
        headWidth: percent("adj2", 0.5),
        headLength: percent("adj3"),
        boxSize: percent("adj4"),
    },
    ribbon: { endOffset: percent("adj1"), centerWidth: percent("adj2") },
    ribbon2: { endOffset: percent("adj1"), centerWidth: percent("adj2") },
    rightArrow: { shaftThickness: percent("adj1"), headLength: percent("adj2") },
    rightArrowCallout: {
        shaftThickness: percent("adj1"),
        headWidth: percent("adj2", 0.5),
        headLength: percent("adj3"),
        boxWidth: percent("adj4"),
    },
    rightBrace: { curveHeight: percent("adj1"), pointPosition: percent("adj2") },
    rightBracket: { cornerHeight: percent("adj") },
    round1Rect: { cornerRadius: percent("adj") },
    round2DiagRect: { topLeftBottomRightRadius: percent("adj1"), topRightBottomLeftRadius: percent("adj2") },
    round2SameRect: { topCornerRadius: percent("adj1"), bottomCornerRadius: percent("adj2") },
    roundRect: { cornerRadius: percent("adj") },
    smileyFace: { smile: percent("adj") },
    snip1Rect: { cornerSize: percent("adj") },
    snip2DiagRect: { topLeftBottomRightSize: percent("adj1"), topRightBottomLeftSize: percent("adj2") },
    snip2SameRect: { topCornerSize: percent("adj1"), bottomCornerSize: percent("adj2") },
    snipRoundRect: { roundedCornerRadius: percent("adj1"), snippedCornerSize: percent("adj2") },
    star10: { innerRadius: percent("adj", 0.5) },
    star12: { innerRadius: percent("adj", 0.5) },
    star16: { innerRadius: percent("adj", 0.5) },
    star24: { innerRadius: percent("adj", 0.5) },
    star32: { innerRadius: percent("adj", 0.5) },
    star4: { innerRadius: percent("adj", 0.5) },
    star5: { innerRadius: percent("adj", 0.5) },
    star6: { innerRadius: percent("adj", 0.5) },
    star7: { innerRadius: percent("adj", 0.5) },
    star8: { innerRadius: percent("adj", 0.5) },
    stripedRightArrow: { shaftThickness: percent("adj1"), headLength: percent("adj2") },
    sun: { rayLength: percent("adj") },
    swooshArrow: { shaftThickness: percent("adj1"), headLength: percent("adj2") },
    teardrop: { pointLength: percent("adj") },
    trapezoid: { slant: percent("adj") },
    triangle: { apexPosition: percent("adj") },
    upArrow: { shaftThickness: percent("adj1"), headLength: percent("adj2") },
    upArrowCallout: {
        shaftThickness: percent("adj1"),
        headWidth: percent("adj2", 0.5),
        headLength: percent("adj3"),
        boxHeight: percent("adj4"),
    },
    upDownArrow: { shaftThickness: percent("adj1"), headLength: percent("adj2") },
    upDownArrowCallout: {
        shaftThickness: percent("adj1"),
        headWidth: percent("adj2", 0.5),
        headLength: percent("adj3"),
        boxHeight: percent("adj4"),
    },
    uturnArrow: {
        shaftThickness: percent("adj1"),
        headWidth: percent("adj2", 0.5),
        headLength: percent("adj3"),
        bendRadius: percent("adj4"),
        tipPosition: percent("adj5"),
    },
    verticalScroll: { rollSize: percent("adj") },
    wave: { waveHeight: percent("adj1"), skew: percent("adj2") },
    wedgeEllipseCallout: { pointerX: percent("adj1"), pointerY: percent("adj2") },
    wedgeRectCallout: { pointerX: percent("adj1"), pointerY: percent("adj2") },
    wedgeRoundRectCallout: { pointerX: percent("adj1"), pointerY: percent("adj2"), cornerRadius: percent("adj3") },
};
/* cspell:enable */

/**
 * Converts a shape's adjustments to the shape guides written in `a:avLst`, keyed by guide name.
 *
 * @throws If the shape does not have an adjustment with one of the given names
 *
 * @example
 * ```typescript
 * createShapeGuides("roundRect", { cornerRadius: 25 }); // { adj: 25000 }
 * createShapeGuides("pie", { startAngle: 0, endAngle: 270 }); // { adj1: 0, adj2: 16200000 }
 * ```
 */
export const createShapeGuides = (
    type: PresetShapeType,
    adjustments: Readonly<Record<string, number | undefined>> = {},
): Readonly<Record<string, number>> => {
    const definitions: Readonly<Record<string, AdjustmentDefinition>> =
        type in PRESET_SHAPE_ADJUSTMENTS ? PRESET_SHAPE_ADJUSTMENTS[type as keyof PresetShapeAdjustments] : {};
    const names = Object.keys(definitions);

    return Object.fromEntries(
        Object.entries(adjustments).flatMap(([name, value]) => {
            if (!names.includes(name)) {
                throw new Error(
                    names.length === 0
                        ? `Invalid adjustment "${name}". Shape "${type}" has no adjustments`
                        : `Invalid adjustment "${name}" for shape "${type}". Expected one of: ${names.join(", ")}`,
                );
            }
            const { guide, factor, offset = 0 } = definitions[name];
            return value === undefined ? [] : [[guide, offset + value * factor] as const];
        }),
    );
};
