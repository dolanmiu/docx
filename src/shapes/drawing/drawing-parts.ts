/**
 * Small DrawingML elements that shapes and pictures in groups are made of. docx writes the same elements for images and
 * text boxes, but doesn't export them, so shapes write their own.
 *
 * @module
 */
import { BuilderElement, type ICropOptions, type IMediaData, type IMediaDataTransformation, type Paragraph, type XmlComponent } from "docx";

type Point = {
    readonly x: number;
    readonly y: number;
};

/**
 * Creates `a:noFill`, for a shape with no fill or a line that isn't drawn.
 */
export const createNoFill = (): XmlComponent => new BuilderElement({ name: "a:noFill" });

/**
 * Creates `a:stretch`, which stretches a picture to fill its shape.
 *
 * ```xml
 * <a:stretch><a:fillRect/></a:stretch>
 * ```
 */
export const createStretch = (): XmlComponent =>
    new BuilderElement({ name: "a:stretch", children: [new BuilderElement({ name: "a:fillRect" })] });

// <xsd:complexType name="CT_RelativeRect">
//     <xsd:attribute name="l" type="ST_Percentage" use="optional" default="0%"/>
//     <xsd:attribute name="t" type="ST_Percentage" use="optional" default="0%"/>
//     <xsd:attribute name="r" type="ST_Percentage" use="optional" default="0%"/>
//     <xsd:attribute name="b" type="ST_Percentage" use="optional" default="0%"/>
// </xsd:complexType>
/**
 * Creates `a:srcRect`, the part of a picture that is shown. The crop is in percentages of the picture's size, and is
 * written in thousandths of a percent.
 */
export const createSourceRectangle = (crop?: ICropOptions): XmlComponent => {
    const thousandths = (percentage?: number): number | undefined => (percentage === undefined ? undefined : Math.round(percentage * 1000));
    return new BuilderElement<{ readonly left?: number; readonly top?: number; readonly right?: number; readonly bottom?: number }>({
        name: "a:srcRect",
        attributes: crop
            ? {
                  left: { key: "l", value: thousandths(crop.left) },
                  top: { key: "t", value: thousandths(crop.top) },
                  right: { key: "r", value: thousandths(crop.right) },
                  bottom: { key: "b", value: thousandths(crop.bottom) },
              }
            : undefined,
    });
};

/**
 * Creates the extension list of an `a:blip` that holds an SVG picture. The blip itself shows the raster fallback, for
 * applications that can't draw SVG.
 *
 * ```xml
 * <a:extLst>
 *   <a:ext uri="{96DAC541-7B7A-43D3-8B79-37D633B846F1}">
 *     <asvg:svgBlip xmlns:asvg="http://schemas.microsoft.com/office/drawing/2016/SVG/main" r:embed="..."/>
 *   </a:ext>
 * </a:extLst>
 * ```
 */
export const createSvgBlipExtension = (mediaData: IMediaData): XmlComponent =>
    new BuilderElement({
        name: "a:extLst",
        children: [
            new BuilderElement<{ readonly uri: string }>({
                name: "a:ext",
                attributes: { uri: { key: "uri", value: "{96DAC541-7B7A-43D3-8B79-37D633B846F1}" } },
                children: [
                    new BuilderElement<{ readonly namespace: string; readonly embed: string }>({
                        name: "asvg:svgBlip",
                        attributes: {
                            namespace: { key: "xmlns:asvg", value: "http://schemas.microsoft.com/office/drawing/2016/SVG/main" },
                            // Replaced by the relationship id of the picture when the document is packed
                            embed: { key: "r:embed", value: `rId{${mediaData.fileName}}` },
                        },
                    }),
                ],
            }),
        ],
    });

/**
 * Creates `pic:cNvPicPr`, which stops the picture's aspect ratio and arrowheads being changed.
 *
 * ```xml
 * <pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr>
 * ```
 */
export const createPictureLocks = (): XmlComponent =>
    new BuilderElement({
        name: "pic:cNvPicPr",
        children: [
            new BuilderElement<{ readonly noChangeAspect: number; readonly noChangeArrowheads: number }>({
                name: "a:picLocks",
                attributes: {
                    noChangeAspect: { key: "noChangeAspect", value: 1 },
                    noChangeArrowheads: { key: "noChangeArrowheads", value: 1 },
                },
            }),
        ],
    });

/**
 * Creates `a:xfrm`: the position, size, rotation and flip of a shape or picture.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Transform2D">
 *   <xsd:sequence>
 *     <xsd:element name="off" type="CT_Point2D" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="ext" type="CT_PositiveSize2D" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="rot" type="ST_Angle" use="optional" default="0"/>
 *   <xsd:attribute name="flipH" type="xsd:boolean" use="optional" default="false"/>
 *   <xsd:attribute name="flipV" type="xsd:boolean" use="optional" default="false"/>
 * </xsd:complexType>
 * ```
 *
 * @param children - Elements after the offset and size, such as a group's `a:chOff` and `a:chExt`
 */
export const createTransform = (transformation: IMediaDataTransformation, children: readonly XmlComponent[] = []): XmlComponent =>
    new BuilderElement<{ readonly flipVertical?: boolean; readonly flipHorizontal?: boolean; readonly rotation?: number }>({
        name: "a:xfrm",
        attributes: {
            flipVertical: { key: "flipV", value: transformation.flip?.vertical },
            flipHorizontal: { key: "flipH", value: transformation.flip?.horizontal },
            rotation: { key: "rot", value: transformation.rotation },
        },
        children: [
            new BuilderElement<Point>({
                name: "a:off",
                attributes: {
                    x: { key: "x", value: transformation.offset?.emus?.x ?? 0 },
                    y: { key: "y", value: transformation.offset?.emus?.y ?? 0 },
                },
            }),
            new BuilderElement<Point>({
                name: "a:ext",
                attributes: { x: { key: "cx", value: transformation.emus.x }, y: { key: "cy", value: transformation.emus.y } },
            }),
            ...children,
        ],
    });

/**
 * Creates `a:prstGeom`: one of the preset shapes, with its adjustments written as shape guides.
 *
 * @param type - The preset's OOXML name (`ST_ShapeType`), such as `"roundRect"`
 * @param adjustments - Raw shape guide values, keyed by guide name, such as `{ adj: 25000 }`. They are rounded
 *
 * ```xml
 * <a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 25000"/></a:avLst></a:prstGeom>
 * ```
 */
export const createPresetGeometry = (type = "rect", adjustments: Readonly<Record<string, number>> = {}): XmlComponent =>
    new BuilderElement<{ readonly type: string }>({
        name: "a:prstGeom",
        attributes: { type: { key: "prst", value: type } },
        children: [
            new BuilderElement({
                name: "a:avLst",
                children: Object.entries(adjustments).map(
                    ([name, value]) =>
                        new BuilderElement<{ readonly name: string; readonly formula: string }>({
                            name: "a:gd",
                            attributes: {
                                name: { key: "name", value: name },
                                formula: { key: "fmla", value: `val ${Math.round(value)}` },
                            },
                        }),
                ),
            }),
        ],
    });

/**
 * Creates `wps:txbx`: the text inside a shape, as paragraphs in `w:txbxContent`.
 */
export const createTextBox = (children: readonly Paragraph[]): XmlComponent =>
    new BuilderElement({
        name: "wps:txbx",
        children: [new BuilderElement({ name: "w:txbxContent", children: [...children] })],
    });
