# Shape Adjustments

Adjustments change the proportions of a [shape](usage/shapes.md), the same way as dragging its yellow handles in Word. This page lists the adjustments of every shape that has them. Shapes that aren't listed, such as `rectangle`, `ellipse` and the flowchart shapes, have none.

```ts
new ShapeRun({
    type: "rightArrowCallout",
    adjustments: { shaftThickness: 20, headWidth: 50, headLength: 25, boxWidth: 60 },
    transformation: { width: 200, height: 80 },
});
```

- Lengths and positions are percentages. The description says what each one is a percentage of. Positions can be negative or over `100` to reach outside the shape, for example the end of a callout's pointer.
- Angles are in degrees, clockwise from 3 o'clock.
- Word keeps each value within the range the shape allows, so a value that is too large acts like the largest allowed value.
- The OOXML column gives the name of the shape guide each adjustment is written to. [Shape Types](usage/shape-types.md) gives each shape's own OOXML name. Both are useful for reading the XML or the [preset shape definitions](https://www.ecma-international.org/publications-and-standards/standards/ecma-376/).

<!-- cspell:disable -->

| Shape                                         | Adjustment                 | Description                                                                                           | Default   | OOXML  |
| --------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------- | --------- | ------ |
| `arc`                                         | `startAngle`               | Angle where the arc starts, in degrees clockwise from 3 o'clock                                       | `270`     | `adj1` |
|                                               | `endAngle`                 | Angle where the arc ends, in degrees clockwise from 3 o'clock                                         | `0`       | `adj2` |
| `bentArrow`                                   | `shaftThickness`           | Thickness of the shaft, as a percent of the shorter side                                              | `25`      | `adj1` |
|                                               | `headWidth`                | Width of the arrowhead, as a percent of the shorter side                                              | `50`      | `adj2` |
|                                               | `headLength`               | Length of the arrowhead, as a percent of the shorter side                                             | `25`      | `adj3` |
|                                               | `bendRadius`               | Outer radius of the bend, as a percent of the shorter side                                            | `43.75`   | `adj4` |
| `bentLineCallout`                             | `lineStartX`               | Start of the callout line, from the left edge, as a percent of the width                              | `-8.333`  | `adj2` |
|                                               | `lineStartY`               | Start of the callout line, from the top edge, as a percent of the height                              | `18.75`   | `adj1` |
|                                               | `bendX`                    | Bend in the callout line, from the left edge, as a percent of the width                               | `-16.667` | `adj4` |
|                                               | `bendY`                    | Bend in the callout line, from the top edge, as a percent of the height                               | `18.75`   | `adj3` |
|                                               | `lineEndX`                 | End of the callout line, where it points, from the left edge, as a percent of the width               | `-46.667` | `adj6` |
|                                               | `lineEndY`                 | End of the callout line, where it points, from the top edge, as a percent of the height               | `112.5`   | `adj5` |
| `bentLineCalloutWithAccentBar`                | `lineStartX`               | Start of the callout line, from the left edge, as a percent of the width                              | `-8.333`  | `adj2` |
|                                               | `lineStartY`               | Start of the callout line, from the top edge, as a percent of the height                              | `18.75`   | `adj1` |
|                                               | `bendX`                    | Bend in the callout line, from the left edge, as a percent of the width                               | `-16.667` | `adj4` |
|                                               | `bendY`                    | Bend in the callout line, from the top edge, as a percent of the height                               | `18.75`   | `adj3` |
|                                               | `lineEndX`                 | End of the callout line, where it points, from the left edge, as a percent of the width               | `-46.667` | `adj6` |
|                                               | `lineEndY`                 | End of the callout line, where it points, from the top edge, as a percent of the height               | `112.5`   | `adj5` |
| `bentLineCalloutWithBorderAndAccentBar`       | `lineStartX`               | Start of the callout line, from the left edge, as a percent of the width                              | `-8.333`  | `adj2` |
|                                               | `lineStartY`               | Start of the callout line, from the top edge, as a percent of the height                              | `18.75`   | `adj1` |
|                                               | `bendX`                    | Bend in the callout line, from the left edge, as a percent of the width                               | `-16.667` | `adj4` |
|                                               | `bendY`                    | Bend in the callout line, from the top edge, as a percent of the height                               | `18.75`   | `adj3` |
|                                               | `lineEndX`                 | End of the callout line, where it points, from the left edge, as a percent of the width               | `-46.667` | `adj6` |
|                                               | `lineEndY`                 | End of the callout line, where it points, from the top edge, as a percent of the height               | `112.5`   | `adj5` |
| `bentLineCalloutWithNoBorder`                 | `lineStartX`               | Start of the callout line, from the left edge, as a percent of the width                              | `-8.333`  | `adj2` |
|                                               | `lineStartY`               | Start of the callout line, from the top edge, as a percent of the height                              | `18.75`   | `adj1` |
|                                               | `bendX`                    | Bend in the callout line, from the left edge, as a percent of the width                               | `-16.667` | `adj4` |
|                                               | `bendY`                    | Bend in the callout line, from the top edge, as a percent of the height                               | `18.75`   | `adj3` |
|                                               | `lineEndX`                 | End of the callout line, where it points, from the left edge, as a percent of the width               | `-46.667` | `adj6` |
|                                               | `lineEndY`                 | End of the callout line, where it points, from the top edge, as a percent of the height               | `112.5`   | `adj5` |
| `bentUpArrow`                                 | `shaftThickness`           | Thickness of the shaft, as a percent of the shorter side                                              | `25`      | `adj1` |
|                                               | `headWidth`                | Width of the arrowhead, as a percent of the shorter side                                              | `50`      | `adj2` |
|                                               | `headLength`               | Length of the arrowhead, as a percent of the shorter side                                             | `25`      | `adj3` |
| `beveledRectangle`                            | `bevelWidth`               | Width of the bevelled edge, as a percent of the shorter side                                          | `12.5`    | `adj`  |
| `blockArc`                                    | `startAngle`               | Angle where the arc starts, in degrees clockwise from 3 o'clock                                       | `180`     | `adj1` |
|                                               | `endAngle`                 | Angle where the arc ends, in degrees clockwise from 3 o'clock                                         | `0`       | `adj2` |
|                                               | `thickness`                | Thickness of the arc, as a percent of the shorter side                                                | `25`      | `adj3` |
| `bracePair`                                   | `curveRadius`              | Radius of the curves in the braces, as a percent of the shorter side                                  | `8.333`   | `adj`  |
| `bracketPair`                                 | `cornerRadius`             | Radius of the corners of the brackets, as a percent of the shorter side                               | `16.667`  | `adj`  |
| `chevron`                                     | `pointLength`              | Length of the point, as a percent of the shorter side                                                 | `50`      | `adj`  |
| `chord`                                       | `startAngle`               | Angle where the chord starts, in degrees clockwise from 3 o'clock                                     | `45`      | `adj1` |
|                                               | `endAngle`                 | Angle where the chord ends, in degrees clockwise from 3 o'clock                                       | `270`     | `adj2` |
| `circularArrow`                               | `shaftThickness`           | Thickness of the arrow's body, as a percent of the shorter side                                       | `12.5`    | `adj1` |
|                                               | `headAngle`                | Angle the arrowhead covers, in degrees                                                                | `19.039`  | `adj2` |
|                                               | `endAngle`                 | Angle where the arrow ends, in degrees clockwise from 3 o'clock                                       | `340.961` | `adj3` |
|                                               | `startAngle`               | Angle where the arrow starts, in degrees clockwise from 3 o'clock                                     | `180`     | `adj4` |
|                                               | `headWidth`                | Width of the arrowhead, as a percent of the shorter side                                              | `25`      | `adj5` |
| `cloudCallout`                                | `pointerX`                 | Tip of the pointer, from the centre, as a percent of the width. Negative values are to the left       | `-20.833` | `adj1` |
|                                               | `pointerY`                 | Tip of the pointer, from the centre, as a percent of the height. Negative values are above the centre | `62.5`    | `adj2` |
| `cross`                                       | `cornerSize`               | Size of the cut-away corners, as a percent of the shorter side. Larger values make thinner arms       | `25`      | `adj`  |
| `cube`                                        | `depth`                    | Depth of the top and side faces, as a percent of the shorter side                                     | `25`      | `adj`  |
| `curvedConnector`                             | `bendX`                    | Where the connector bends, from the left edge, as a percent of the width                              | `50`      | `adj1` |
| `curvedConnectorFourBends`                    | `firstBendX`               | Where the connector first bends, from the left edge, as a percent of the width                        | `50`      | `adj1` |
|                                               | `secondBendY`              | Where the connector bends a second time, from the top edge, as a percent of the height                | `50`      | `adj2` |
|                                               | `thirdBendX`               | Where the connector bends a third time, from the left edge, as a percent of the width                 | `50`      | `adj3` |
| `curvedConnectorThreeBends`                   | `firstBendX`               | Where the connector first bends, from the left edge, as a percent of the width                        | `50`      | `adj1` |
|                                               | `secondBendY`              | Where the connector bends a second time, from the top edge, as a percent of the height                | `50`      | `adj2` |
| `curvedDownArrow`                             | `shaftThickness`           | Thickness of the shaft, as a percent of the shorter side                                              | `25`      | `adj1` |
|                                               | `headWidth`                | Width of the arrowhead, as a percent of the shorter side                                              | `50`      | `adj2` |
|                                               | `headLength`               | Length of the arrowhead, as a percent of the shorter side                                             | `25`      | `adj3` |
| `curvedLeftArrow`                             | `shaftThickness`           | Thickness of the shaft, as a percent of the shorter side                                              | `25`      | `adj1` |
|                                               | `headWidth`                | Width of the arrowhead, as a percent of the shorter side                                              | `50`      | `adj2` |
|                                               | `headLength`               | Length of the arrowhead, as a percent of the shorter side                                             | `25`      | `adj3` |
| `curvedRibbonDown`                            | `thickness`                | Thickness of the ribbon, as a percent of the height                                                   | `25`      | `adj1` |
|                                               | `centerWidth`              | Width of the centre section, as a percent of the width                                                | `50`      | `adj2` |
|                                               | `curveDepth`               | How far the ribbon curves, as a percent of the height                                                 | `12.5`    | `adj3` |
| `curvedRibbonUp`                              | `thickness`                | Thickness of the ribbon, as a percent of the height                                                   | `25`      | `adj1` |
|                                               | `centerWidth`              | Width of the centre section, as a percent of the width                                                | `50`      | `adj2` |
|                                               | `curveDepth`               | How far the ribbon curves, as a percent of the height                                                 | `12.5`    | `adj3` |
| `curvedRightArrow`                            | `shaftThickness`           | Thickness of the shaft, as a percent of the shorter side                                              | `25`      | `adj1` |
|                                               | `headWidth`                | Width of the arrowhead, as a percent of the shorter side                                              | `50`      | `adj2` |
|                                               | `headLength`               | Length of the arrowhead, as a percent of the shorter side                                             | `25`      | `adj3` |
| `curvedUpArrow`                               | `shaftThickness`           | Thickness of the shaft, as a percent of the shorter side                                              | `25`      | `adj1` |
|                                               | `headWidth`                | Width of the arrowhead, as a percent of the shorter side                                              | `50`      | `adj2` |
|                                               | `headLength`               | Length of the arrowhead, as a percent of the shorter side                                             | `25`      | `adj3` |
| `cylinder`                                    | `topHeight`                | Height of the elliptical top, as a percent of the shorter side                                        | `25`      | `adj`  |
| `diagonalRoundedCornersRectangle`             | `topLeftBottomRightRadius` | Radius of the top-left and bottom-right corners, as a percent of the shorter side                     | `16.667`  | `adj1` |
|                                               | `topRightBottomLeftRadius` | Radius of the top-right and bottom-left corners, as a percent of the shorter side                     | `0`       | `adj2` |
| `diagonalSnippedCornersRectangle`             | `topLeftBottomRightSize`   | Size of the cut top-left and bottom-right corners, as a percent of the shorter side                   | `0`       | `adj1` |
|                                               | `topRightBottomLeftSize`   | Size of the cut top-right and bottom-left corners, as a percent of the shorter side                   | `16.667`  | `adj2` |
| `diagonalStripe`                              | `stripeWidth`              | How much of the top and left edges the stripe covers, as a percent of the width and height            | `50`      | `adj`  |
| `donut`                                       | `thickness`                | Thickness of the ring, as a percent of the shorter side                                               | `25`      | `adj`  |
| `doubleBentLineCallout`                       | `lineStartX`               | Start of the callout line, from the left edge, as a percent of the width                              | `-8.333`  | `adj2` |
|                                               | `lineStartY`               | Start of the callout line, from the top edge, as a percent of the height                              | `18.75`   | `adj1` |
|                                               | `firstBendX`               | First bend in the callout line, from the left edge, as a percent of the width                         | `-16.667` | `adj4` |
|                                               | `firstBendY`               | First bend in the callout line, from the top edge, as a percent of the height                         | `18.75`   | `adj3` |
|                                               | `secondBendX`              | Second bend in the callout line, from the left edge, as a percent of the width                        | `-16.667` | `adj6` |
|                                               | `secondBendY`              | Second bend in the callout line, from the top edge, as a percent of the height                        | `100`     | `adj5` |
|                                               | `lineEndX`                 | End of the callout line, where it points, from the left edge, as a percent of the width               | `-8.333`  | `adj8` |
|                                               | `lineEndY`                 | End of the callout line, where it points, from the top edge, as a percent of the height               | `112.963` | `adj7` |
| `doubleBentLineCalloutWithAccentBar`          | `lineStartX`               | Start of the callout line, from the left edge, as a percent of the width                              | `-8.333`  | `adj2` |
|                                               | `lineStartY`               | Start of the callout line, from the top edge, as a percent of the height                              | `18.75`   | `adj1` |
|                                               | `firstBendX`               | First bend in the callout line, from the left edge, as a percent of the width                         | `-16.667` | `adj4` |
|                                               | `firstBendY`               | First bend in the callout line, from the top edge, as a percent of the height                         | `18.75`   | `adj3` |
|                                               | `secondBendX`              | Second bend in the callout line, from the left edge, as a percent of the width                        | `-16.667` | `adj6` |
|                                               | `secondBendY`              | Second bend in the callout line, from the top edge, as a percent of the height                        | `100`     | `adj5` |
|                                               | `lineEndX`                 | End of the callout line, where it points, from the left edge, as a percent of the width               | `-8.333`  | `adj8` |
|                                               | `lineEndY`                 | End of the callout line, where it points, from the top edge, as a percent of the height               | `112.963` | `adj7` |
| `doubleBentLineCalloutWithBorderAndAccentBar` | `lineStartX`               | Start of the callout line, from the left edge, as a percent of the width                              | `-8.333`  | `adj2` |
|                                               | `lineStartY`               | Start of the callout line, from the top edge, as a percent of the height                              | `18.75`   | `adj1` |
|                                               | `firstBendX`               | First bend in the callout line, from the left edge, as a percent of the width                         | `-16.667` | `adj4` |
|                                               | `firstBendY`               | First bend in the callout line, from the top edge, as a percent of the height                         | `18.75`   | `adj3` |
|                                               | `secondBendX`              | Second bend in the callout line, from the left edge, as a percent of the width                        | `-16.667` | `adj6` |
|                                               | `secondBendY`              | Second bend in the callout line, from the top edge, as a percent of the height                        | `100`     | `adj5` |
|                                               | `lineEndX`                 | End of the callout line, where it points, from the left edge, as a percent of the width               | `-8.333`  | `adj8` |
|                                               | `lineEndY`                 | End of the callout line, where it points, from the top edge, as a percent of the height               | `112.963` | `adj7` |
| `doubleBentLineCalloutWithNoBorder`           | `lineStartX`               | Start of the callout line, from the left edge, as a percent of the width                              | `-8.333`  | `adj2` |
|                                               | `lineStartY`               | Start of the callout line, from the top edge, as a percent of the height                              | `18.75`   | `adj1` |
|                                               | `firstBendX`               | First bend in the callout line, from the left edge, as a percent of the width                         | `-16.667` | `adj4` |
|                                               | `firstBendY`               | First bend in the callout line, from the top edge, as a percent of the height                         | `18.75`   | `adj3` |
|                                               | `secondBendX`              | Second bend in the callout line, from the left edge, as a percent of the width                        | `-16.667` | `adj6` |
|                                               | `secondBendY`              | Second bend in the callout line, from the top edge, as a percent of the height                        | `100`     | `adj5` |
|                                               | `lineEndX`                 | End of the callout line, where it points, from the left edge, as a percent of the width               | `-8.333`  | `adj8` |
|                                               | `lineEndY`                 | End of the callout line, where it points, from the top edge, as a percent of the height               | `112.963` | `adj7` |
| `doubleWave`                                  | `waveHeight`               | Height of the waves, as a percent of the height                                                       | `6.25`    | `adj1` |
|                                               | `skew`                     | Shifts the waves sideways, as a percent of the width, from -10 to 10                                  | `0`       | `adj2` |
| `downArrow`                                   | `shaftThickness`           | Thickness of the shaft, as a percent of the width                                                     | `50`      | `adj1` |
|                                               | `headLength`               | Length of the arrowhead, as a percent of the shorter side                                             | `50`      | `adj2` |
| `downArrowCallout`                            | `shaftThickness`           | Thickness of the shaft, as a percent of the shorter side                                              | `25`      | `adj1` |
|                                               | `headWidth`                | Width of the arrowhead, as a percent of the shorter side                                              | `50`      | `adj2` |
|                                               | `headLength`               | Length of the arrowhead, as a percent of the shorter side                                             | `25`      | `adj3` |
|                                               | `boxHeight`                | Height of the box, as a percent of the height                                                         | `64.977`  | `adj4` |
| `elbowConnector`                              | `bendX`                    | Where the connector bends, from the left edge, as a percent of the width                              | `50`      | `adj1` |
| `elbowConnectorFourBends`                     | `firstBendX`               | Where the connector first bends, from the left edge, as a percent of the width                        | `50`      | `adj1` |
|                                               | `secondBendY`              | Where the connector bends a second time, from the top edge, as a percent of the height                | `50`      | `adj2` |
|                                               | `thirdBendX`               | Where the connector bends a third time, from the left edge, as a percent of the width                 | `50`      | `adj3` |
| `elbowConnectorThreeBends`                    | `firstBendX`               | Where the connector first bends, from the left edge, as a percent of the width                        | `50`      | `adj1` |
|                                               | `secondBendY`              | Where the connector bends a second time, from the top edge, as a percent of the height                | `50`      | `adj2` |
| `ellipticalCallout`                           | `pointerX`                 | Tip of the pointer, from the centre, as a percent of the width. Negative values are to the left       | `-20.833` | `adj1` |
|                                               | `pointerY`                 | Tip of the pointer, from the centre, as a percent of the height. Negative values are above the centre | `62.5`    | `adj2` |
| `foldedCorner`                                | `foldSize`                 | Size of the folded corner, as a percent of the shorter side                                           | `16.667`  | `adj`  |
| `frame`                                       | `thickness`                | Thickness of the frame, as a percent of the shorter side                                              | `12.5`    | `adj1` |
| `gear6`                                       | `toothHeight`              | Height of the teeth, as a percent of the shorter side                                                 | `15`      | `adj1` |
|                                               | `toothWidth`               | Width of the top of each tooth, as a percent of the shorter side                                      | `3.526`   | `adj2` |
| `gear9`                                       | `toothHeight`              | Height of the teeth, as a percent of the shorter side                                                 | `10`      | `adj1` |
|                                               | `toothWidth`               | Width of the top of each tooth, as a percent of the shorter side                                      | `1.763`   | `adj2` |
| `halfFrame`                                   | `horizontalArmThickness`   | Thickness of the horizontal arm, as a percent of the shorter side                                     | `33.333`  | `adj1` |
|                                               | `verticalArmThickness`     | Thickness of the vertical arm, as a percent of the shorter side                                       | `33.333`  | `adj2` |
| `hexagon`                                     | `pointLength`              | How far the left and right points stick out, as a percent of the shorter side                         | `25`      | `adj`  |
| `horizontalScroll`                            | `rollSize`                 | Size of the rolled ends, as a percent of the shorter side                                             | `12.5`    | `adj`  |
| `leftArrow`                                   | `shaftThickness`           | Thickness of the shaft, as a percent of the height                                                    | `50`      | `adj1` |
|                                               | `headLength`               | Length of the arrowhead, as a percent of the shorter side                                             | `50`      | `adj2` |
| `leftArrowCallout`                            | `shaftThickness`           | Thickness of the shaft, as a percent of the shorter side                                              | `25`      | `adj1` |
|                                               | `headWidth`                | Width of the arrowhead, as a percent of the shorter side                                              | `50`      | `adj2` |
|                                               | `headLength`               | Length of the arrowhead, as a percent of the shorter side                                             | `25`      | `adj3` |
|                                               | `boxWidth`                 | Width of the box, as a percent of the width                                                           | `64.977`  | `adj4` |
| `leftBrace`                                   | `curveHeight`              | Height of the curves, as a percent of the shorter side                                                | `8.333`   | `adj1` |
|                                               | `pointPosition`            | Where the middle point is, from the top, as a percent of the height                                   | `50`      | `adj2` |
| `leftBracket`                                 | `cornerHeight`             | Height of the curved corners, as a percent of the shorter side                                        | `8.333`   | `adj`  |
| `leftCircularArrow`                           | `shaftThickness`           | Thickness of the arrow's body, as a percent of the shorter side                                       | `12.5`    | `adj1` |
|                                               | `headAngle`                | Angle the arrowhead covers, in degrees. Negative, because the arrow turns anticlockwise               | `-19.039` | `adj2` |
|                                               | `endAngle`                 | Angle where the arrow ends, in degrees clockwise from 3 o'clock                                       | `19.039`  | `adj3` |
|                                               | `startAngle`               | Angle where the arrow starts, in degrees clockwise from 3 o'clock                                     | `180`     | `adj4` |
|                                               | `headWidth`                | Width of the arrowhead, as a percent of the shorter side                                              | `25`      | `adj5` |
| `leftRightArrow`                              | `shaftThickness`           | Thickness of the shaft, as a percent of the height                                                    | `50`      | `adj1` |
|                                               | `headLength`               | Length of each arrowhead, as a percent of the shorter side                                            | `50`      | `adj2` |
| `leftRightArrowCallout`                       | `shaftThickness`           | Thickness of the shaft, as a percent of the shorter side                                              | `25`      | `adj1` |
|                                               | `headWidth`                | Width of each arrowhead, as a percent of the shorter side                                             | `50`      | `adj2` |
|                                               | `headLength`               | Length of each arrowhead, as a percent of the shorter side                                            | `25`      | `adj3` |
|                                               | `boxWidth`                 | Width of the box, as a percent of the width                                                           | `48.123`  | `adj4` |
| `leftRightCircularArrow`                      | `shaftThickness`           | Thickness of the arrow's body, as a percent of the shorter side                                       | `12.5`    | `adj1` |
|                                               | `headAngle`                | Angle each arrowhead covers, in degrees                                                               | `19.039`  | `adj2` |
|                                               | `endAngle`                 | Angle where the arrow ends, in degrees clockwise from 3 o'clock                                       | `340.961` | `adj3` |
|                                               | `startAngle`               | Angle where the arrow starts, in degrees clockwise from 3 o'clock                                     | `199.039` | `adj4` |
|                                               | `headWidth`                | Width of the arrowhead, as a percent of the shorter side                                              | `25`      | `adj5` |
| `leftRightRibbon`                             | `thickness`                | Thickness of the ribbon, as a percent of the height                                                   | `50`      | `adj1` |
|                                               | `endLength`                | Length of the pointed ends, as a percent of the shorter side                                          | `50`      | `adj2` |
|                                               | `verticalOffset`           | How far the right half is offset from the left half, as a percent of the height                       | `16.667`  | `adj3` |
| `leftRightUpArrow`                            | `shaftThickness`           | Thickness of the shaft, as a percent of the shorter side                                              | `25`      | `adj1` |
|                                               | `headWidth`                | Width of each arrowhead, as a percent of the shorter side                                             | `50`      | `adj2` |
|                                               | `headLength`               | Length of each arrowhead, as a percent of the shorter side                                            | `25`      | `adj3` |
| `leftUpArrow`                                 | `shaftThickness`           | Thickness of the shaft, as a percent of the shorter side                                              | `25`      | `adj1` |
|                                               | `headWidth`                | Width of each arrowhead, as a percent of the shorter side                                             | `50`      | `adj2` |
|                                               | `headLength`               | Length of each arrowhead, as a percent of the shorter side                                            | `25`      | `adj3` |
| `lineCallout`                                 | `lineStartX`               | Start of the callout line, from the left edge, as a percent of the width                              | `-8.333`  | `adj2` |
|                                               | `lineStartY`               | Start of the callout line, from the top edge, as a percent of the height                              | `18.75`   | `adj1` |
|                                               | `lineEndX`                 | End of the callout line, where it points, from the left edge, as a percent of the width               | `-38.333` | `adj4` |
|                                               | `lineEndY`                 | End of the callout line, where it points, from the top edge, as a percent of the height               | `112.5`   | `adj3` |
| `lineCalloutWithAccentBar`                    | `lineStartX`               | Start of the callout line, from the left edge, as a percent of the width                              | `-8.333`  | `adj2` |
|                                               | `lineStartY`               | Start of the callout line, from the top edge, as a percent of the height                              | `18.75`   | `adj1` |
|                                               | `lineEndX`                 | End of the callout line, where it points, from the left edge, as a percent of the width               | `-38.333` | `adj4` |
|                                               | `lineEndY`                 | End of the callout line, where it points, from the top edge, as a percent of the height               | `112.5`   | `adj3` |
| `lineCalloutWithBorderAndAccentBar`           | `lineStartX`               | Start of the callout line, from the left edge, as a percent of the width                              | `-8.333`  | `adj2` |
|                                               | `lineStartY`               | Start of the callout line, from the top edge, as a percent of the height                              | `18.75`   | `adj1` |
|                                               | `lineEndX`                 | End of the callout line, where it points, from the left edge, as a percent of the width               | `-38.333` | `adj4` |
|                                               | `lineEndY`                 | End of the callout line, where it points, from the top edge, as a percent of the height               | `112.5`   | `adj3` |
| `lineCalloutWithNoBorder`                     | `lineStartX`               | Start of the callout line, from the left edge, as a percent of the width                              | `-8.333`  | `adj2` |
|                                               | `lineStartY`               | Start of the callout line, from the top edge, as a percent of the height                              | `18.75`   | `adj1` |
|                                               | `lineEndX`                 | End of the callout line, where it points, from the left edge, as a percent of the width               | `-38.333` | `adj4` |
|                                               | `lineEndY`                 | End of the callout line, where it points, from the top edge, as a percent of the height               | `112.5`   | `adj3` |
| `lShape`                                      | `horizontalArmThickness`   | Thickness of the horizontal arm, as a percent of the shorter side                                     | `50`      | `adj1` |
|                                               | `verticalArmThickness`     | Thickness of the vertical arm, as a percent of the shorter side                                       | `50`      | `adj2` |
| `mathDivide`                                  | `thickness`                | Thickness of the bar, as a percent of the height                                                      | `23.52`   | `adj1` |
|                                               | `gap`                      | Gap between the bar and each dot, as a percent of the height                                          | `5.88`    | `adj2` |
|                                               | `dotRadius`                | Radius of the dots, as a percent of the height                                                        | `11.76`   | `adj3` |
| `mathEqual`                                   | `thickness`                | Thickness of each bar, as a percent of the height                                                     | `23.52`   | `adj1` |
|                                               | `gap`                      | Gap between the bars, as a percent of the height                                                      | `11.76`   | `adj2` |
| `mathMinus`                                   | `thickness`                | Thickness of the bar, as a percent of the height                                                      | `23.52`   | `adj1` |
| `mathMultiply`                                | `thickness`                | Thickness of the strokes, as a percent of the shorter side                                            | `23.52`   | `adj1` |
| `mathNotEqual`                                | `thickness`                | Thickness of each bar, as a percent of the height                                                     | `23.52`   | `adj1` |
|                                               | `slashAngle`               | Angle of the slash, in degrees                                                                        | `110`     | `adj2` |
|                                               | `gap`                      | Gap between the bars, as a percent of the height                                                      | `11.76`   | `adj3` |
| `mathPlus`                                    | `thickness`                | Thickness of the strokes, as a percent of the shorter side                                            | `23.52`   | `adj1` |
| `moon`                                        | `thickness`                | Thickness of the crescent at its widest, as a percent of the shorter side                             | `50`      | `adj`  |
| `nonIsoscelesTrapezoid`                       | `leftSlant`                | How far in the top-left corner is, as a percent of the shorter side                                   | `25`      | `adj1` |
|                                               | `rightSlant`               | How far in the top-right corner is, as a percent of the shorter side                                  | `25`      | `adj2` |
| `noSymbol`                                    | `thickness`                | Thickness of the ring and the bar, as a percent of the shorter side                                   | `18.75`   | `adj`  |
| `notchedRightArrow`                           | `shaftThickness`           | Thickness of the shaft, as a percent of the height                                                    | `50`      | `adj1` |
|                                               | `headLength`               | Length of the arrowhead, as a percent of the shorter side                                             | `50`      | `adj2` |
| `octagon`                                     | `cornerSize`               | Size of the cut corners, as a percent of the shorter side                                             | `29.289`  | `adj`  |
| `parallelogram`                               | `slant`                    | How far right the top edge is shifted, as a percent of the shorter side                               | `25`      | `adj`  |
| `pentagonArrow`                               | `pointLength`              | Length of the point, as a percent of the shorter side                                                 | `50`      | `adj`  |
| `pie`                                         | `startAngle`               | Angle where the slice starts, in degrees clockwise from 3 o'clock                                     | `0`       | `adj1` |
|                                               | `endAngle`                 | Angle where the slice ends, in degrees clockwise from 3 o'clock                                       | `270`     | `adj2` |
| `plaque`                                      | `cornerRadius`             | Radius of the curved-in corners, as a percent of the shorter side                                     | `16.667`  | `adj`  |
| `quadArrow`                                   | `shaftThickness`           | Thickness of the shaft, as a percent of the shorter side                                              | `22.5`    | `adj1` |
|                                               | `headWidth`                | Width of each arrowhead, as a percent of the shorter side                                             | `45`      | `adj2` |
|                                               | `headLength`               | Length of each arrowhead, as a percent of the shorter side                                            | `22.5`    | `adj3` |
| `quadArrowCallout`                            | `shaftThickness`           | Thickness of the shaft, as a percent of the shorter side                                              | `18.515`  | `adj1` |
|                                               | `headWidth`                | Width of each arrowhead, as a percent of the shorter side                                             | `37.03`   | `adj2` |
|                                               | `headLength`               | Length of each arrowhead, as a percent of the shorter side                                            | `18.515`  | `adj3` |
|                                               | `boxSize`                  | Size of the box, as a percent of the width and height                                                 | `48.123`  | `adj4` |
| `rectangularCallout`                          | `pointerX`                 | Tip of the pointer, from the centre, as a percent of the width. Negative values are to the left       | `-20.833` | `adj1` |
|                                               | `pointerY`                 | Tip of the pointer, from the centre, as a percent of the height. Negative values are above the centre | `62.5`    | `adj2` |
| `ribbonDown`                                  | `endOffset`                | How far the ends are offset from the centre section, as a percent of the height                       | `16.667`  | `adj1` |
|                                               | `centerWidth`              | Width of the centre section, as a percent of the width                                                | `50`      | `adj2` |
| `ribbonUp`                                    | `endOffset`                | How far the ends are offset from the centre section, as a percent of the height                       | `16.667`  | `adj1` |
|                                               | `centerWidth`              | Width of the centre section, as a percent of the width                                                | `50`      | `adj2` |
| `rightArrow`                                  | `shaftThickness`           | Thickness of the shaft, as a percent of the height                                                    | `50`      | `adj1` |
|                                               | `headLength`               | Length of the arrowhead, as a percent of the shorter side                                             | `50`      | `adj2` |
| `rightArrowCallout`                           | `shaftThickness`           | Thickness of the shaft, as a percent of the shorter side                                              | `25`      | `adj1` |
|                                               | `headWidth`                | Width of the arrowhead, as a percent of the shorter side                                              | `50`      | `adj2` |
|                                               | `headLength`               | Length of the arrowhead, as a percent of the shorter side                                             | `25`      | `adj3` |
|                                               | `boxWidth`                 | Width of the box, as a percent of the width                                                           | `64.977`  | `adj4` |
| `rightBrace`                                  | `curveHeight`              | Height of the curves, as a percent of the shorter side                                                | `8.333`   | `adj1` |
|                                               | `pointPosition`            | Where the middle point is, from the top, as a percent of the height                                   | `50`      | `adj2` |
| `rightBracket`                                | `cornerHeight`             | Height of the curved corners, as a percent of the shorter side                                        | `8.333`   | `adj`  |
| `roundedAndSnippedCornersRectangle`           | `roundedCornerRadius`      | Radius of the rounded top-left corner, as a percent of the shorter side                               | `16.667`  | `adj1` |
|                                               | `snippedCornerSize`        | Size of the cut top-right corner, as a percent of the shorter side                                    | `16.667`  | `adj2` |
| `roundedCornerRectangle`                      | `cornerRadius`             | Radius of the top-right corner, as a percent of the shorter side                                      | `16.667`  | `adj`  |
| `roundedRectangle`                            | `cornerRadius`             | Radius of the corners, as a percent of the shorter side. 50 makes the ends fully round                | `16.667`  | `adj`  |
| `roundedRectangularCallout`                   | `pointerX`                 | Tip of the pointer, from the centre, as a percent of the width. Negative values are to the left       | `-20.833` | `adj1` |
|                                               | `pointerY`                 | Tip of the pointer, from the centre, as a percent of the height. Negative values are above the centre | `62.5`    | `adj2` |
|                                               | `cornerRadius`             | Radius of the corners, as a percent of the shorter side                                               | `16.667`  | `adj3` |
| `smileyFace`                                  | `smile`                    | How much the mouth curves, as a percent of the height. Negative values frown                          | `4.653`   | `adj`  |
| `snippedCornerRectangle`                      | `cornerSize`               | Size of the cut top-right corner, as a percent of the shorter side                                    | `16.667`  | `adj`  |
| `star10`                                      | `innerRadius`              | Radius of the inner points, as a percent of the outer radius                                          | `85.066`  | `adj`  |
| `star12`                                      | `innerRadius`              | Radius of the inner points, as a percent of the outer radius                                          | `75`      | `adj`  |
| `star16`                                      | `innerRadius`              | Radius of the inner points, as a percent of the outer radius                                          | `75`      | `adj`  |
| `star24`                                      | `innerRadius`              | Radius of the inner points, as a percent of the outer radius                                          | `75`      | `adj`  |
| `star32`                                      | `innerRadius`              | Radius of the inner points, as a percent of the outer radius                                          | `75`      | `adj`  |
| `star4`                                       | `innerRadius`              | Radius of the inner points, as a percent of the outer radius                                          | `25`      | `adj`  |
| `star5`                                       | `innerRadius`              | Radius of the inner points, as a percent of the outer radius                                          | `38.196`  | `adj`  |
| `star6`                                       | `innerRadius`              | Radius of the inner points, as a percent of the outer radius                                          | `57.736`  | `adj`  |
| `star7`                                       | `innerRadius`              | Radius of the inner points, as a percent of the outer radius                                          | `69.202`  | `adj`  |
| `star8`                                       | `innerRadius`              | Radius of the inner points, as a percent of the outer radius                                          | `75`      | `adj`  |
| `stripedRightArrow`                           | `shaftThickness`           | Thickness of the shaft, as a percent of the height                                                    | `50`      | `adj1` |
|                                               | `headLength`               | Length of the arrowhead, as a percent of the shorter side                                             | `50`      | `adj2` |
| `sun`                                         | `rayLength`                | Length of the rays, from the edge to the central disc, as a percent of the width and height           | `25`      | `adj`  |
| `swooshArrow`                                 | `shaftThickness`           | Thickness of the shaft where it meets the arrowhead, as a percent of the height                       | `25`      | `adj1` |
|                                               | `headLength`               | Length of the arrowhead, as a percent of the shorter side                                             | `16.667`  | `adj2` |
| `teardrop`                                    | `pointLength`              | How far the point reaches, as a percent of the distance from the centre to the top-right corner       | `100`     | `adj`  |
| `topRoundedCornersRectangle`                  | `topCornerRadius`          | Radius of the top corners, as a percent of the shorter side                                           | `16.667`  | `adj1` |
|                                               | `bottomCornerRadius`       | Radius of the bottom corners, as a percent of the shorter side                                        | `0`       | `adj2` |
| `topSnippedCornersRectangle`                  | `topCornerSize`            | Size of the cut top corners, as a percent of the shorter side                                         | `16.667`  | `adj1` |
|                                               | `bottomCornerSize`         | Size of the cut bottom corners, as a percent of the shorter side                                      | `0`       | `adj2` |
| `trapezoid`                                   | `slant`                    | How far in the top corners are, as a percent of the shorter side                                      | `25`      | `adj`  |
| `triangle`                                    | `apexPosition`             | Where the top point is, from the left edge, as a percent of the width                                 | `50`      | `adj`  |
| `upArrow`                                     | `shaftThickness`           | Thickness of the shaft, as a percent of the width                                                     | `50`      | `adj1` |
|                                               | `headLength`               | Length of the arrowhead, as a percent of the shorter side                                             | `50`      | `adj2` |
| `upArrowCallout`                              | `shaftThickness`           | Thickness of the shaft, as a percent of the shorter side                                              | `25`      | `adj1` |
|                                               | `headWidth`                | Width of the arrowhead, as a percent of the shorter side                                              | `50`      | `adj2` |
|                                               | `headLength`               | Length of the arrowhead, as a percent of the shorter side                                             | `25`      | `adj3` |
|                                               | `boxHeight`                | Height of the box, as a percent of the height                                                         | `64.977`  | `adj4` |
| `upDownArrow`                                 | `shaftThickness`           | Thickness of the shaft, as a percent of the width                                                     | `50`      | `adj1` |
|                                               | `headLength`               | Length of each arrowhead, as a percent of the shorter side                                            | `50`      | `adj2` |
| `upDownArrowCallout`                          | `shaftThickness`           | Thickness of the shaft, as a percent of the shorter side                                              | `25`      | `adj1` |
|                                               | `headWidth`                | Width of each arrowhead, as a percent of the shorter side                                             | `50`      | `adj2` |
|                                               | `headLength`               | Length of each arrowhead, as a percent of the shorter side                                            | `25`      | `adj3` |
|                                               | `boxHeight`                | Height of the box, as a percent of the height                                                         | `48.123`  | `adj4` |
| `uTurnArrow`                                  | `shaftThickness`           | Thickness of the shaft, as a percent of the shorter side                                              | `25`      | `adj1` |
|                                               | `headWidth`                | Width of the arrowhead, as a percent of the shorter side                                              | `50`      | `adj2` |
|                                               | `headLength`               | Length of the arrowhead, as a percent of the shorter side                                             | `25`      | `adj3` |
|                                               | `bendRadius`               | Outer radius of the bend, as a percent of the shorter side                                            | `43.75`   | `adj4` |
|                                               | `tipPosition`              | How far down the tip of the arrowhead reaches, as a percent of the height                             | `75`      | `adj5` |
| `verticalScroll`                              | `rollSize`                 | Size of the rolled ends, as a percent of the shorter side                                             | `12.5`    | `adj`  |
| `wave`                                        | `waveHeight`               | Height of the waves, as a percent of the height                                                       | `12.5`    | `adj1` |
|                                               | `skew`                     | Shifts the waves sideways, as a percent of the width, from -10 to 10                                  | `0`       | `adj2` |

<!-- cspell:enable -->
