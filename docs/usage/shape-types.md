# Shape Types

This page lists all 187 preset [shapes](usage/shapes.md) that `type` accepts, by category.

Office Open XML abbreviates or numbers many of these names, such as `roundRect` and `ribbon2`. This library names each shape after what it is instead, and writes the OOXML name to the file. The OOXML column lets you look a shape up in the specification or find it in a document's XML. Passing an OOXML name that differs from the library's name throws an error that suggests the right one.

Shapes with adjustments are listed in [Shape Adjustments](usage/shape-adjustments.md).

<!-- cspell:disable -->

## Lines and connectors

| Shape                       | OOXML name           | Notes                                               |
| --------------------------- | -------------------- | --------------------------------------------------- |
| `line`                      | `line`               |                                                     |
| `inverseLine`               | `lineInv`            | A line from the bottom-left corner to the top-right |
| `straightConnector`         | `straightConnector1` |                                                     |
| `elbowConnectorOneBend`     | `bentConnector2`     | Bends once                                          |
| `elbowConnector`            | `bentConnector3`     | Bends twice, like Word's elbow connector            |
| `elbowConnectorThreeBends`  | `bentConnector4`     | Bends three times                                   |
| `elbowConnectorFourBends`   | `bentConnector5`     | Bends four times                                    |
| `curvedConnectorOneBend`    | `curvedConnector2`   | Curves once                                         |
| `curvedConnector`           | `curvedConnector3`   | Curves twice, like Word's curved connector          |
| `curvedConnectorThreeBends` | `curvedConnector4`   | Curves three times                                  |
| `curvedConnectorFourBends`  | `curvedConnector5`   | Curves four times                                   |

## Basic shapes

| Shape                   | OOXML name              | Notes                        |
| ----------------------- | ----------------------- | ---------------------------- |
| `triangle`              | `triangle`              |                              |
| `rightTriangle`         | `rtTriangle`            |                              |
| `diamond`               | `diamond`               |                              |
| `parallelogram`         | `parallelogram`         |                              |
| `trapezoid`             | `trapezoid`             |                              |
| `nonIsoscelesTrapezoid` | `nonIsoscelesTrapezoid` |                              |
| `pentagon`              | `pentagon`              |                              |
| `hexagon`               | `hexagon`               |                              |
| `heptagon`              | `heptagon`              |                              |
| `octagon`               | `octagon`               |                              |
| `decagon`               | `decagon`               |                              |
| `dodecagon`             | `dodecagon`             |                              |
| `ellipse`               | `ellipse`               |                              |
| `teardrop`              | `teardrop`              |                              |
| `pieWedge`              | `pieWedge`              |                              |
| `pie`                   | `pie`                   |                              |
| `blockArc`              | `blockArc`              |                              |
| `donut`                 | `donut`                 |                              |
| `noSymbol`              | `noSmoking`             | A circle with a diagonal bar |
| `chord`                 | `chord`                 |                              |
| `arc`                   | `arc`                   |                              |
| `frame`                 | `frame`                 |                              |
| `halfFrame`             | `halfFrame`             |                              |
| `lShape`                | `corner`                | An L shape                   |
| `diagonalStripe`        | `diagStripe`            |                              |
| `cross`                 | `plus`                  | A plus-shaped cross          |
| `plaque`                | `plaque`                |                              |
| `cylinder`              | `can`                   |                              |
| `cube`                  | `cube`                  |                              |
| `beveledRectangle`      | `bevel`                 |                              |
| `foldedCorner`          | `foldedCorner`          |                              |
| `smileyFace`            | `smileyFace`            |                              |
| `heart`                 | `heart`                 |                              |
| `lightningBolt`         | `lightningBolt`         |                              |
| `sun`                   | `sun`                   |                              |
| `moon`                  | `moon`                  |                              |
| `cloud`                 | `cloud`                 |                              |
| `leftBracket`           | `leftBracket`           |                              |
| `rightBracket`          | `rightBracket`          |                              |
| `leftBrace`             | `leftBrace`             |                              |
| `rightBrace`            | `rightBrace`            |                              |
| `bracketPair`           | `bracketPair`           |                              |
| `bracePair`             | `bracePair`             |                              |

## Rectangles

| Shape                               | OOXML name       | Notes                                   |
| ----------------------------------- | ---------------- | --------------------------------------- |
| `rectangle`                         | `rect`           |                                         |
| `roundedRectangle`                  | `roundRect`      |                                         |
| `roundedCornerRectangle`            | `round1Rect`     | One rounded corner                      |
| `topRoundedCornersRectangle`        | `round2SameRect` | Two rounded corners on the same side    |
| `diagonalRoundedCornersRectangle`   | `round2DiagRect` | Two rounded corners diagonally opposite |
| `snippedCornerRectangle`            | `snip1Rect`      | One cut-off corner                      |
| `topSnippedCornersRectangle`        | `snip2SameRect`  | Two cut-off corners on the same side    |
| `diagonalSnippedCornersRectangle`   | `snip2DiagRect`  | Two cut-off corners diagonally opposite |
| `roundedAndSnippedCornersRectangle` | `snipRoundRect`  | One rounded and one cut-off corner      |

## Block arrows

| Shape                    | OOXML name               | Notes                     |
| ------------------------ | ------------------------ | ------------------------- |
| `rightArrow`             | `rightArrow`             |                           |
| `leftArrow`              | `leftArrow`              |                           |
| `upArrow`                | `upArrow`                |                           |
| `downArrow`              | `downArrow`              |                           |
| `leftRightArrow`         | `leftRightArrow`         |                           |
| `upDownArrow`            | `upDownArrow`            |                           |
| `quadArrow`              | `quadArrow`              |                           |
| `leftRightUpArrow`       | `leftRightUpArrow`       |                           |
| `bentArrow`              | `bentArrow`              |                           |
| `uTurnArrow`             | `uturnArrow`             |                           |
| `leftUpArrow`            | `leftUpArrow`            |                           |
| `bentUpArrow`            | `bentUpArrow`            |                           |
| `curvedRightArrow`       | `curvedRightArrow`       |                           |
| `curvedLeftArrow`        | `curvedLeftArrow`        |                           |
| `curvedUpArrow`          | `curvedUpArrow`          |                           |
| `curvedDownArrow`        | `curvedDownArrow`        |                           |
| `stripedRightArrow`      | `stripedRightArrow`      |                           |
| `notchedRightArrow`      | `notchedRightArrow`      |                           |
| `pentagonArrow`          | `homePlate`              | A pentagon pointing right |
| `chevron`                | `chevron`                |                           |
| `rightArrowCallout`      | `rightArrowCallout`      |                           |
| `downArrowCallout`       | `downArrowCallout`       |                           |
| `leftArrowCallout`       | `leftArrowCallout`       |                           |
| `upArrowCallout`         | `upArrowCallout`         |                           |
| `leftRightArrowCallout`  | `leftRightArrowCallout`  |                           |
| `upDownArrowCallout`     | `upDownArrowCallout`     |                           |
| `quadArrowCallout`       | `quadArrowCallout`       |                           |
| `circularArrow`          | `circularArrow`          |                           |
| `leftCircularArrow`      | `leftCircularArrow`      |                           |
| `leftRightCircularArrow` | `leftRightCircularArrow` |                           |
| `swooshArrow`            | `swooshArrow`            |                           |

## Equation shapes

| Shape          | OOXML name     | Notes |
| -------------- | -------------- | ----- |
| `mathPlus`     | `mathPlus`     |       |
| `mathMinus`    | `mathMinus`    |       |
| `mathMultiply` | `mathMultiply` |       |
| `mathDivide`   | `mathDivide`   |       |
| `mathEqual`    | `mathEqual`    |       |
| `mathNotEqual` | `mathNotEqual` |       |

## Flowchart

| Shape                        | OOXML name                   | Notes |
| ---------------------------- | ---------------------------- | ----- |
| `flowChartProcess`           | `flowChartProcess`           |       |
| `flowChartAlternateProcess`  | `flowChartAlternateProcess`  |       |
| `flowChartDecision`          | `flowChartDecision`          |       |
| `flowChartInputOutput`       | `flowChartInputOutput`       |       |
| `flowChartPredefinedProcess` | `flowChartPredefinedProcess` |       |
| `flowChartInternalStorage`   | `flowChartInternalStorage`   |       |
| `flowChartDocument`          | `flowChartDocument`          |       |
| `flowChartMultidocument`     | `flowChartMultidocument`     |       |
| `flowChartTerminator`        | `flowChartTerminator`        |       |
| `flowChartPreparation`       | `flowChartPreparation`       |       |
| `flowChartManualInput`       | `flowChartManualInput`       |       |
| `flowChartManualOperation`   | `flowChartManualOperation`   |       |
| `flowChartConnector`         | `flowChartConnector`         |       |
| `flowChartOffpageConnector`  | `flowChartOffpageConnector`  |       |
| `flowChartPunchedCard`       | `flowChartPunchedCard`       |       |
| `flowChartPunchedTape`       | `flowChartPunchedTape`       |       |
| `flowChartSummingJunction`   | `flowChartSummingJunction`   |       |
| `flowChartOr`                | `flowChartOr`                |       |
| `flowChartCollate`           | `flowChartCollate`           |       |
| `flowChartSort`              | `flowChartSort`              |       |
| `flowChartExtract`           | `flowChartExtract`           |       |
| `flowChartMerge`             | `flowChartMerge`             |       |
| `flowChartOfflineStorage`    | `flowChartOfflineStorage`    |       |
| `flowChartOnlineStorage`     | `flowChartOnlineStorage`     |       |
| `flowChartDelay`             | `flowChartDelay`             |       |
| `flowChartMagneticTape`      | `flowChartMagneticTape`      |       |
| `flowChartMagneticDisk`      | `flowChartMagneticDisk`      |       |
| `flowChartMagneticDrum`      | `flowChartMagneticDrum`      |       |
| `flowChartDisplay`           | `flowChartDisplay`           |       |

## Stars and banners

| Shape              | OOXML name         | Notes                                             |
| ------------------ | ------------------ | ------------------------------------------------- |
| `explosion12`      | `irregularSeal1`   | An explosion with 12 points                       |
| `explosion14`      | `irregularSeal2`   | An explosion with 14 points                       |
| `star4`            | `star4`            |                                                   |
| `star5`            | `star5`            |                                                   |
| `star6`            | `star6`            |                                                   |
| `star7`            | `star7`            |                                                   |
| `star8`            | `star8`            |                                                   |
| `star10`           | `star10`           |                                                   |
| `star12`           | `star12`           |                                                   |
| `star16`           | `star16`           |                                                   |
| `star24`           | `star24`           |                                                   |
| `star32`           | `star32`           |                                                   |
| `ribbonUp`         | `ribbon2`          | A banner whose centre sits above its ends         |
| `ribbonDown`       | `ribbon`           | A banner whose centre hangs below its ends        |
| `curvedRibbonUp`   | `ellipseRibbon2`   | A curved banner whose centre sits above its ends  |
| `curvedRibbonDown` | `ellipseRibbon`    | A curved banner whose centre hangs below its ends |
| `leftRightRibbon`  | `leftRightRibbon`  |                                                   |
| `verticalScroll`   | `verticalScroll`   |                                                   |
| `horizontalScroll` | `horizontalScroll` |                                                   |
| `wave`             | `wave`             |                                                   |
| `doubleWave`       | `doubleWave`       |                                                   |

## Callouts

| Shape                                         | OOXML name              | Notes                                                        |
| --------------------------------------------- | ----------------------- | ------------------------------------------------------------ |
| `rectangularCallout`                          | `wedgeRectCallout`      | A speech bubble                                              |
| `roundedRectangularCallout`                   | `wedgeRoundRectCallout` | A speech bubble with rounded corners                         |
| `ellipticalCallout`                           | `wedgeEllipseCallout`   | An oval speech bubble                                        |
| `cloudCallout`                                | `cloudCallout`          |                                                              |
| `lineCallout`                                 | `borderCallout1`        | A box with a border and a straight pointer line              |
| `bentLineCallout`                             | `borderCallout2`        | A box with a border and a pointer line that bends once       |
| `doubleBentLineCallout`                       | `borderCallout3`        | A box with a border and a pointer line that bends twice      |
| `lineCalloutWithAccentBar`                    | `accentCallout1`        | As `lineCallout`, with an accent bar and no border           |
| `bentLineCalloutWithAccentBar`                | `accentCallout2`        | As `bentLineCallout`, with an accent bar and no border       |
| `doubleBentLineCalloutWithAccentBar`          | `accentCallout3`        | As `doubleBentLineCallout`, with an accent bar and no border |
| `lineCalloutWithNoBorder`                     | `callout1`              | As `lineCallout`, without the border                         |
| `bentLineCalloutWithNoBorder`                 | `callout2`              | As `bentLineCallout`, without the border                     |
| `doubleBentLineCalloutWithNoBorder`           | `callout3`              | As `doubleBentLineCallout`, without the border               |
| `lineCalloutWithBorderAndAccentBar`           | `accentBorderCallout1`  | As `lineCallout`, with an accent bar                         |
| `bentLineCalloutWithBorderAndAccentBar`       | `accentBorderCallout2`  | As `bentLineCallout`, with an accent bar                     |
| `doubleBentLineCalloutWithBorderAndAccentBar` | `accentBorderCallout3`  | As `doubleBentLineCallout`, with an accent bar               |

## Action buttons

| Shape                      | OOXML name                 | Notes |
| -------------------------- | -------------------------- | ----- |
| `actionButtonBlank`        | `actionButtonBlank`        |       |
| `actionButtonHome`         | `actionButtonHome`         |       |
| `actionButtonHelp`         | `actionButtonHelp`         |       |
| `actionButtonInformation`  | `actionButtonInformation`  |       |
| `actionButtonForwardNext`  | `actionButtonForwardNext`  |       |
| `actionButtonBackPrevious` | `actionButtonBackPrevious` |       |
| `actionButtonEnd`          | `actionButtonEnd`          |       |
| `actionButtonBeginning`    | `actionButtonBeginning`    |       |
| `actionButtonReturn`       | `actionButtonReturn`       |       |
| `actionButtonDocument`     | `actionButtonDocument`     |       |
| `actionButtonSound`        | `actionButtonSound`        |       |
| `actionButtonMovie`        | `actionButtonMovie`        |       |

## Other shapes

| Shape        | OOXML name   | Notes |
| ------------ | ------------ | ----- |
| `gear6`      | `gear6`      |       |
| `gear9`      | `gear9`      |       |
| `funnel`     | `funnel`     |       |
| `cornerTabs` | `cornerTabs` |       |
| `squareTabs` | `squareTabs` |       |
| `plaqueTabs` | `plaqueTabs` |       |
| `chartX`     | `chartX`     |       |
| `chartStar`  | `chartStar`  |       |
| `chartPlus`  | `chartPlus`  |       |

<!-- cspell:enable -->
