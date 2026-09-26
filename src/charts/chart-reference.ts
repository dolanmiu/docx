/**
 * Elements that refer to a part of the package, and add it to the package when they are written.
 *
 * @module
 */
import { type IContext, type IXmlableObject, NextAttributeComponent, type PackagePart, XmlComponent } from "docx";

/**
 * An element that refers to a part of the package by its relationship id (`r:id`), and adds the part, and the
 * relationship to it, when it is written: a chart in the document (`c:chart`), or the workbook of a chart
 * (`c:externalData`).
 */
export class PartReference extends XmlComponent {
    public constructor(
        name: string,
        private readonly part: PackagePart,
        {
            namespaces = {},
            children = [],
        }: { readonly namespaces?: Readonly<Record<string, string>>; readonly children?: readonly XmlComponent[] } = {},
    ) {
        super(name);
        this.root.push(
            new NextAttributeComponent<Record<string, string>>({
                ...Object.fromEntries(Object.entries(namespaces).map(([prefix, uri]) => [prefix, { key: `xmlns:${prefix}`, value: uri }])),
                id: { key: "r:id", value: part.relationshipId },
            }),
            ...children,
        );
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        this.part.addTo(context);
        return super.prepForXml(context);
    }
}
