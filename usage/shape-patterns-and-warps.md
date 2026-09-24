# Shape Patterns and Text Warps

This page lists the preset patterns a [shape's fill](usage/shapes.md#pattern-fills) can use, and the WordArt-style warps and text directions for [text in shapes](usage/shapes.md#text-layout). Shapes come from `docx/shapes`: `import { ShapeRun } from "docx/shapes";`.

Office Open XML abbreviates or numbers many of these names, such as `dkUpDiag` and `textWave2`. This library names each one after what it is, and writes the OOXML name to the file. The OOXML column lets you look a name up in the specification or find it in a document's XML.

<!-- cspell:disable -->

## Patterns

A pattern is lines or dots in one colour (`color`) over another (`backgroundColor`).

| Pattern                  | OOXML name   | Looks like                                 |
| ------------------------ | ------------ | ------------------------------------------ |
| `percent5`               | `pct5`       | 5% of dots                                 |
| `percent10`              | `pct10`      | 10% of dots                                |
| `percent20`              | `pct20`      | 20% of dots                                |
| `percent25`              | `pct25`      | 25% of dots                                |
| `percent30`              | `pct30`      | 30% of dots                                |
| `percent40`              | `pct40`      | 40% of dots                                |
| `percent50`              | `pct50`      | 50% of dots                                |
| `percent60`              | `pct60`      | 60% of dots                                |
| `percent70`              | `pct70`      | 70% of dots                                |
| `percent75`              | `pct75`      | 75% of dots                                |
| `percent80`              | `pct80`      | 80% of dots                                |
| `percent90`              | `pct90`      | 90% of dots                                |
| `horizontal`             | `horz`       | Horizontal lines                           |
| `vertical`               | `vert`       | Vertical lines                             |
| `lightHorizontal`        | `ltHorz`     | Thin horizontal lines                      |
| `lightVertical`          | `ltVert`     | Thin vertical lines                        |
| `darkHorizontal`         | `dkHorz`     | Thick horizontal lines                     |
| `darkVertical`           | `dkVert`     | Thick vertical lines                       |
| `narrowHorizontal`       | `narHorz`    | Horizontal lines close together            |
| `narrowVertical`         | `narVert`    | Vertical lines close together              |
| `dashedHorizontal`       | `dashHorz`   | Dashed horizontal lines                    |
| `dashedVertical`         | `dashVert`   | Dashed vertical lines                      |
| `cross`                  | `cross`      | Horizontal and vertical lines              |
| `downwardDiagonal`       | `dnDiag`     | Lines from top-left to bottom-right        |
| `upwardDiagonal`         | `upDiag`     | Lines from bottom-left to top-right        |
| `lightDownwardDiagonal`  | `ltDnDiag`   | Thin lines from top-left to bottom-right   |
| `lightUpwardDiagonal`    | `ltUpDiag`   | Thin lines from bottom-left to top-right   |
| `darkDownwardDiagonal`   | `dkDnDiag`   | Thick lines from top-left to bottom-right  |
| `darkUpwardDiagonal`     | `dkUpDiag`   | Thick lines from bottom-left to top-right  |
| `wideDownwardDiagonal`   | `wdDnDiag`   | Wide lines from top-left to bottom-right   |
| `wideUpwardDiagonal`     | `wdUpDiag`   | Wide lines from bottom-left to top-right   |
| `dashedDownwardDiagonal` | `dashDnDiag` | Dashed lines from top-left to bottom-right |
| `dashedUpwardDiagonal`   | `dashUpDiag` | Dashed lines from bottom-left to top-right |
| `diagonalCross`          | `diagCross`  | Lines in both diagonal directions          |
| `smallCheckerBoard`      | `smCheck`    | Small squares, like a chess board          |
| `largeCheckerBoard`      | `lgCheck`    | Large squares, like a chess board          |
| `smallGrid`              | `smGrid`     | A fine grid                                |
| `largeGrid`              | `lgGrid`     | A coarse grid                              |
| `dottedGrid`             | `dotGrid`    | A grid of dots                             |
| `smallConfetti`          | `smConfetti` | Small scattered squares                    |
| `largeConfetti`          | `lgConfetti` | Large scattered squares                    |
| `horizontalBrick`        | `horzBrick`  | Brickwork                                  |
| `diagonalBrick`          | `diagBrick`  | Brickwork on a slant                       |
| `solidDiamond`           | `solidDmnd`  | Filled diamonds                            |
| `openDiamond`            | `openDmnd`   | Outlined diamonds                          |
| `dottedDiamond`          | `dotDmnd`    | Diamonds of dots                           |
| `plaid`                  | `plaid`      | Tartan                                     |
| `sphere`                 | `sphere`     | Shaded balls                               |
| `weave`                  | `weave`      | Woven strips                               |
| `divot`                  | `divot`      | Short slanted strokes                      |
| `shingle`                | `shingle`    | Overlapping tiles                          |
| `wave`                   | `wave`       | Wavy lines                                 |
| `trellis`                | `trellis`    | A lattice                                  |
| `zigZag`                 | `zigZag`     | Zigzag lines                               |

## Text warps

A warp bends or stretches the text in a shape, as WordArt does. The warps that follow a path, such as `archUp` and `circle`, lay the text along one line. The `...Filled` versions spread it over the whole shape.

| Warp                    | OOXML name                  |
| ----------------------- | --------------------------- |
| `square`                | `textPlain`                 |
| `stop`                  | `textStop`                  |
| `triangleUp`            | `textTriangle`              |
| `triangleDown`          | `textTriangleInverted`      |
| `chevronUp`             | `textChevron`               |
| `chevronDown`           | `textChevronInverted`       |
| `ringInside`            | `textRingInside`            |
| `ringOutside`           | `textRingOutside`           |
| `archUp`                | `textArchUp`                |
| `archDown`              | `textArchDown`              |
| `circle`                | `textCircle`                |
| `button`                | `textButton`                |
| `archUpFilled`          | `textArchUpPour`            |
| `archDownFilled`        | `textArchDownPour`          |
| `circleFilled`          | `textCirclePour`            |
| `buttonFilled`          | `textButtonPour`            |
| `curveUp`               | `textCurveUp`               |
| `curveDown`             | `textCurveDown`             |
| `canUp`                 | `textCanUp`                 |
| `canDown`               | `textCanDown`               |
| `wave`                  | `textWave1`                 |
| `waveInverted`          | `textWave2`                 |
| `doubleWave`            | `textDoubleWave1`           |
| `doubleWaveInverted`    | `textWave4`                 |
| `inflate`               | `textInflate`               |
| `deflate`               | `textDeflate`               |
| `inflateBottom`         | `textInflateBottom`         |
| `deflateBottom`         | `textDeflateBottom`         |
| `inflateTop`            | `textInflateTop`            |
| `deflateTop`            | `textDeflateTop`            |
| `deflateInflate`        | `textDeflateInflate`        |
| `deflateInflateDeflate` | `textDeflateInflateDeflate` |
| `fadeRight`             | `textFadeRight`             |
| `fadeLeft`              | `textFadeLeft`              |
| `fadeUp`                | `textFadeUp`                |
| `fadeDown`              | `textFadeDown`              |
| `slantUp`               | `textSlantUp`               |
| `slantDown`             | `textSlantDown`             |
| `cascadeUp`             | `textCascadeUp`             |
| `cascadeDown`           | `textCascadeDown`           |

## Text directions

| Direction            | OOXML name       | Text                                                                                  |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| `horizontal`         | `horz`           | Left to right (the default)                                                           |
| `topToBottom`        | `vert`           | Turned a quarter turn clockwise, so each line reads downwards                         |
| `bottomToTop`        | `vert270`        | Turned a quarter turn anticlockwise, so each line reads upwards                       |
| `stacked`            | `wordArtVert`    | Upright letters stacked one below the other, with lines running left to right         |
| `stackedRightToLeft` | `wordArtVertRtl` | Upright letters stacked one below the other, with lines running right to left         |
| `eastAsianVertical`  | `eaVert`         | East Asian characters upright and other text turned, with lines running right to left |
| `mongolianVertical`  | `mongolianVert`  | As `eastAsianVertical`, with lines running left to right                              |

<!-- cspell:enable -->
