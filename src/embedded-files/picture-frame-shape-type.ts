/**
 * The picture frame shape type, which Word draws an embedded object's picture in.
 *
 * @module
 */
import { BuilderElement, type IContext, type IXmlableObject, XmlComponent } from "docx";

// The formulas of the picture frame, which inset it by half of its line's width
const FORMULAS = [
    "if lineDrawn pixelLineWidth 0",
    "sum @0 1 0",
    "sum 0 0 @1",
    "prod @2 1 2",
    "prod @3 21600 pixelWidth",
    "prod @3 21600 pixelHeight",
    "sum @0 0 1",
    "prod @6 1 2",
    "prod @7 21600 pixelWidth",
    "sum @8 21600 0",
    "prod @7 21600 pixelHeight",
    "sum @10 21600 0",
];

/**
 * The parts being written that have the shape type already. Each part is written with a context of its own, so a part
 * written again, such as when a document is packed twice, has it again.
 */
const writtenIn = new WeakSet<IContext>();

/**
 * The picture frame shape type (`_x0000_t75`), Office's preset shape 75, as Word writes it in an embedded object. Its
 * shape (`v:shape`) refers to it as `#_x0000_t75`.
 *
 * It is written in the first object of each part it is in, the document, a header or the footnotes, as Word writes it,
 * and left out of the rest: a part can't have two elements with the same id.
 *
 * ```xml
 * <v:shapetype id="_x0000_t75" coordsize="21600,21600" o:spt="75" o:preferrelative="t" path="m@4@5l@4@11@9@11@9@5xe"
 *   filled="f" stroked="f">
 *   <v:stroke joinstyle="miter"/>
 *   <v:formulas><v:f eqn="if lineDrawn pixelLineWidth 0"/>...</v:formulas>
 *   <v:path o:extrusionok="f" gradientshapeok="t" o:connecttype="rect"/>
 *   <o:lock v:ext="edit" aspectratio="t"/>
 * </v:shapetype>
 * ```
 */
export class PictureFrameShapeType extends XmlComponent {
    private readonly shapeType = new BuilderElement({
        name: "v:shapetype",
        attributes: {
            id: { key: "id", value: "_x0000_t75" },
            coordinateSize: { key: "coordsize", value: "21600,21600" },
            presetShapeType: { key: "o:spt", value: 75 },
            preferRelative: { key: "o:preferrelative", value: "t" },
            path: { key: "path", value: "m@4@5l@4@11@9@11@9@5xe" },
            filled: { key: "filled", value: "f" },
            stroked: { key: "stroked", value: "f" },
        },
        children: [
            new BuilderElement({ name: "v:stroke", attributes: { joinStyle: { key: "joinstyle", value: "miter" } } }),
            new BuilderElement({
                name: "v:formulas",
                children: FORMULAS.map(
                    (equation) => new BuilderElement({ name: "v:f", attributes: { equation: { key: "eqn", value: equation } } }),
                ),
            }),
            new BuilderElement({
                name: "v:path",
                attributes: {
                    extrusionOk: { key: "o:extrusionok", value: "f" },
                    gradientShapeOk: { key: "gradientshapeok", value: "t" },
                    connectType: { key: "o:connecttype", value: "rect" },
                },
            }),
            new BuilderElement({
                name: "o:lock",
                attributes: { extension: { key: "v:ext", value: "edit" }, aspectRatio: { key: "aspectratio", value: "t" } },
            }),
        ],
    });

    public constructor() {
        super("v:shapetype");
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        if (writtenIn.has(context)) {
            return undefined;
        }
        writtenIn.add(context);
        return this.shapeType.prepForXml(context);
    }
}
