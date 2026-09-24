/**
 * Helpers shared by ShapeRun and ShapeGroupRun. Not part of the public API.
 *
 * @module
 */
import type { DocPropertiesOptions } from "@file/drawing/doc-properties/doc-properties";
import type { DrawingLinkOptions } from "@file/drawing/doc-properties/non-visual-drawing-properties";
import type { EffectExtentAttributes } from "@file/drawing/effect-extent/effect-extent";
import {
    type PresetShapeCoreOptions,
    type PresetShapeType,
    type ShapeAdjustments,
    type ShapeEffects,
    type ShapeFill,
    type ShapeLine,
    type ShapeTextOptions,
    getShapeEffectsOverhang,
    getShapeLineOverhang,
} from "@file/drawing/inline/graphic/graphic-data/wps/preset-shape";
import type { IMediaTransformation } from "@file/media";
import type { Paragraph } from "@file/paragraph";

/**
 * Options every shape has, whatever its type.
 */
export type ShapeBaseOptions = DrawingLinkOptions & {
    /** Size in pixels, with optional rotation (degrees) and flip. Inside a group, `offset` positions the shape. */
    readonly transformation: IMediaTransformation;
    /** How the shape is filled. Default is no fill */
    readonly fill?: ShapeFill;
    /** The shape's line. Default is a solid black line 1pt wide */
    readonly line?: ShapeLine;
    /** Shadows, glow, soft edges and reflection */
    readonly effects?: ShapeEffects;
    /** Paragraphs of text inside the shape */
    readonly children?: readonly Paragraph[];
    /** How the text inside the shape is laid out: alignment, margins, autofit, direction, columns and warps */
    readonly textOptions?: ShapeTextOptions;
    /** Name, description and title used by screen readers */
    readonly altText?: DocPropertiesOptions;
};

/**
 * Adds `type`, and the `adjustments` that go with it, to a set of shape options.
 *
 * There is one member per preset shape, so `adjustments` only accepts the names of that shape's handles.
 * Another member takes any shape type without adjustments, for when the type is only known at runtime,
 * and the last one is a custom shape drawn from a `path`.
 */
export type WithPresetShape<Options> =
    | {
          readonly [T in PresetShapeType]: Options & {
              /** The preset shape, such as `"rectangle"`, `"ellipse"`, `"line"` or `"rightArrow"` */
              readonly type: T;
              /** The shape's handles, such as `{ cornerRadius: 25 }` for a `"roundedRectangle"`. Lengths are percentages and angles are degrees */
              readonly adjustments?: ShapeAdjustments<T>;
          };
      }[PresetShapeType]
    | (Options & { readonly type: PresetShapeType; readonly adjustments?: undefined })
    | (Options & {
          /** A shape of your own, drawn from `path` */
          readonly type: "custom";
          /**
           * The outline of the shape as SVG path data, such as `"M 0 0 L 100 0 L 50 80 Z"` for a triangle.
           * It can use the commands M, L, H, V, C, S, Q, T, A and Z, in any units: the path is scaled so the
           * box around it fills the shape
           */
          readonly path: string;
          readonly adjustments?: undefined;
      });

/**
 * Maps shape options to the data used to write a `wps:wsp` element.
 */
export const createPresetShapeData = (options: WithPresetShape<ShapeBaseOptions>): PresetShapeCoreOptions => ({
    geometry: options.type === "custom" ? { type: "custom", path: options.path } : { type: options.type, adjustments: options.adjustments },
    fill: options.fill,
    line: options.line,
    effects: options.effects,
    children: options.children,
    textOptions: options.textOptions,
});

/**
 * An effect extent reaching the same distance past every side of a drawing.
 */
export const createUniformEffectExtent = (overhang: number): EffectExtentAttributes => ({
    top: overhang,
    right: overhang,
    bottom: overhang,
    left: overhang,
});

const EMUS_PER_PIXEL = 9525;

/**
 * How far, in EMUs, a shape's line, arrowheads and effects reach past each side of its box, before it is rotated.
 */
export const getShapeOverhang = ({
    line,
    effects,
    transformation,
}: Pick<ShapeBaseOptions, "line" | "effects" | "transformation">): EffectExtentAttributes => {
    const lineOverhang = getShapeLineOverhang(line);
    const effectsOverhang = getShapeEffectsOverhang(effects, transformation.height * EMUS_PER_PIXEL, transformation.rotation);
    return {
        top: lineOverhang + effectsOverhang.top,
        right: lineOverhang + effectsOverhang.right,
        bottom: lineOverhang + effectsOverhang.bottom,
        left: lineOverhang + effectsOverhang.left,
    };
};

/**
 * How far, in EMUs, a shape reaches past each side of its box: the corners of a rotated shape,
 * and its line, arrowheads and effects. As in Word, this is the drawing's `wp:effectExtent`.
 */
export const getShapeEffectExtent = (options: Pick<ShapeBaseOptions, "line" | "effects" | "transformation">): EffectExtentAttributes => {
    const overhang = getShapeOverhang(options);
    const { width, height, rotation = 0 } = options.transformation;
    // Half the size of the box around the rotated shape, less half the shape's own size
    const radians = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));
    const growX = Math.max(0, Math.ceil(((width * cos + height * sin - width) * EMUS_PER_PIXEL) / 2));
    const growY = Math.max(0, Math.ceil(((width * sin + height * cos - height) * EMUS_PER_PIXEL) / 2));
    return {
        top: overhang.top + growY,
        right: overhang.right + growX,
        bottom: overhang.bottom + growY,
        left: overhang.left + growX,
    };
};
