/**
 * Helpers shared by ShapeRun and ShapeGroupRun. Not part of the public API.
 *
 * @module
 */
import {
    type DocPropertiesOptions,
    type DrawingLinkOptions,
    type EffectExtentAttributes,
    type IFloating,
    type IMediaTransformation,
    type Paragraph,
    docPropertiesUniqueNumericId,
} from "docx";

import type { CustomShapeGeometry } from "./custom-geometry";
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
} from "./preset-shape";
import { type ShapeTransformation, createTextParagraphs } from "./shape-text-size";
import type { TextStyles } from "./shape-text-styles";

/**
 * Options every shape has, whatever its type.
 */
export type ShapeBaseOptions = DrawingLinkOptions & {
    /**
     * Size in pixels, with optional rotation (degrees) and flip. `"fitText"` sizes the shape to fit its text.
     * Inside a group, `offset` positions the shape
     */
    readonly transformation: ShapeTransformation;
    /** How the shape is filled. Default is no fill */
    readonly fill?: ShapeFill;
    /** The shape's line. Default is a solid black line 1pt wide */
    readonly line?: ShapeLine;
    /** Shadows, glow, soft edges and reflection */
    readonly effects?: ShapeEffects;
    /** Text inside the shape, centred. Each line is a paragraph. For text with formatting, use `children` */
    readonly text?: string;
    /** Paragraphs of text inside the shape, after `text` */
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
 * and the last one is a custom shape drawn from a `path` or `paths`.
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
    | (Options &
          CustomShapeGeometry & {
              /** A shape of your own, drawn from `path` or `paths` */
              readonly type: "custom";
              readonly adjustments?: undefined;
          });

/**
 * Maps shape options to the data used to write a `wps:wsp` element.
 *
 * @param styles - The document's styles, which `text` is written to suit
 */
export const createPresetShapeData = (options: WithPresetShape<ShapeBaseOptions>, styles?: TextStyles): PresetShapeCoreOptions => ({
    geometry:
        options.type === "custom"
            ? {
                  type: "custom",
                  path: options.path,
                  paths: options.paths,
                  textArea: options.textArea,
                  connectionPoints: options.connectionPoints,
              }
            : { type: options.type, adjustments: options.adjustments },
    fill: options.fill,
    line: options.line,
    effects: options.effects,
    children: options.text === undefined ? options.children : [...createTextParagraphs(options.text, styles), ...(options.children ?? [])],
    textOptions: options.textOptions,
});

/**
 * The options of a drawing that don't depend on its layout, with the drawing's id. The id is given now, so a drawing
 * that is laid out again when it is written keeps it.
 */
export const createDrawingProperties = ({
    floating,
    altText,
    link,
    decorative,
}: DrawingLinkOptions & { readonly floating?: IFloating; readonly altText?: DocPropertiesOptions }): DrawingLinkOptions & {
    readonly floating?: IFloating;
    readonly docProperties: DocPropertiesOptions;
} => ({
    floating,
    // A drawing without alt text has an empty name, description and title, as it does without an id
    docProperties: { ...(altText ?? { name: "", description: "", title: "" }), id: altText?.id ?? `${docPropertiesUniqueNumericId()}` },
    link,
    decorative,
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
 * A shape's line, effects and size in pixels, which are what decide how far it reaches past its box.
 */
type SizedShape = Pick<ShapeBaseOptions, "line" | "effects"> & { readonly transformation: IMediaTransformation };

/**
 * How far, in EMUs, a shape's line, arrowheads and effects reach past each side of its box, before it is rotated.
 */
export const getShapeOverhang = ({ line, effects, transformation }: SizedShape): EffectExtentAttributes => {
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
export const getShapeEffectExtent = (options: SizedShape): EffectExtentAttributes => {
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
