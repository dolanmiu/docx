/**
 * Helpers shared by ShapeRun and ShapeGroupRun. Not part of the public API.
 *
 * @module
 */
import type { DocPropertiesOptions } from "@file/drawing/doc-properties/doc-properties";
import type { EffectExtentAttributes } from "@file/drawing/effect-extent/effect-extent";
import type { IBodyPropertiesOptions } from "@file/drawing/inline/graphic/graphic-data/wps/body-properties";
import type {
    PresetShapeCoreOptions,
    PresetShapeType,
    ShapeAdjustments,
    ShapeFill,
    ShapeLine,
} from "@file/drawing/inline/graphic/graphic-data/wps/preset-shape";
import type { IMediaTransformation } from "@file/media";
import type { Paragraph } from "@file/paragraph";

/**
 * Options every shape has, whatever its type.
 */
export type ShapeBaseOptions = {
    /** Size in pixels, with optional rotation (degrees) and flip. Inside a group, `offset` positions the shape. */
    readonly transformation: IMediaTransformation;
    /** How the shape is filled. Default is no fill */
    readonly fill?: ShapeFill;
    /** The shape's line. Default is a solid black line 1pt wide */
    readonly line?: ShapeLine;
    /** Paragraphs of text inside the shape */
    readonly children?: readonly Paragraph[];
    /** Text layout inside the shape. Text is centred vertically unless `verticalAnchor` is set */
    readonly bodyProperties?: IBodyPropertiesOptions;
    /** Name, description and title used by screen readers */
    readonly altText?: DocPropertiesOptions;
};

/**
 * Adds `type`, and the `adjustments` that go with it, to a set of shape options.
 *
 * There is one member per preset shape, so `adjustments` only accepts the names of that shape's handles.
 * The last member takes any shape type without adjustments, for when the type is only known at runtime.
 */
export type WithPresetShape<Options> =
    | {
          readonly [T in PresetShapeType]: Options & {
              /** The preset shape, such as `"rect"`, `"ellipse"`, `"line"` or `"rightArrow"` */
              readonly type: T;
              /** The shape's handles, such as `{ cornerRadius: 25 }` for a `"roundRect"`. Lengths are percentages and angles are degrees */
              readonly adjustments?: ShapeAdjustments<T>;
          };
      }[PresetShapeType]
    | (Options & { readonly type: PresetShapeType; readonly adjustments?: undefined });

/**
 * Maps shape options to the data used to write a `wps:wsp` element.
 */
export const createPresetShapeData = (options: WithPresetShape<ShapeBaseOptions>): PresetShapeCoreOptions => ({
    geometry: { type: options.type, adjustments: options.adjustments },
    fill: options.fill,
    line: options.line,
    children: options.children,
    bodyProperties: options.bodyProperties,
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
