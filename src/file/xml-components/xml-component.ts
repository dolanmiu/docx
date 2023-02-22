import { BaseXmlComponent, IContext } from "./base";
import { IXmlableObject } from "./xmlable-object";

export const EMPTY_OBJECT = Object.seal({});

export abstract class XmlComponent extends BaseXmlComponent {
    // eslint-disable-next-line functional/prefer-readonly-type, @typescript-eslint/no-explicit-any
    protected root: (BaseXmlComponent | string | any)[];

    public constructor(rootKey: string) {
        super(rootKey);
        this.root = new Array<BaseXmlComponent | string>();
    }

    // This method is called by the formatter to get the XML representation of this component.
    // It is called recursively for all child components.
    // It is a serializer to be used in the xml library.
    // https://www.npmjs.com/package/xml
    // Child components can override this method to customize the XML representation, or execute side effects.
    public prepForXml(context: IContext): IXmlableObject | undefined {
        // Mutating the stack is required for performance reasons
        // eslint-disable-next-line functional/immutable-data
        context.stack.push(this);
        const children = this.root
            .map((comp) => {
                if (comp instanceof BaseXmlComponent) {
                    return comp.prepForXml(context);
                }
                return comp;
            })
            .filter((comp) => comp !== undefined); // Exclude undefined

        // eslint-disable-next-line functional/immutable-data
        context.stack.pop();
        // If we only have a single IXmlableObject in our children array and it
        // represents our attributes, use the object itself as our children to
        // avoid an unneeded XML close element.
        // Additionally, if the array is empty, use an empty object as our
        // children in order to get an empty XML element generated.
        return {
            [this.rootKey]: children.length ? (children.length === 1 && children[0]?._attr ? children[0] : children) : EMPTY_OBJECT,
        };
    }

    public addChildElement(child: XmlComponent | string): XmlComponent {
        this.root.push(child);

        return this;
    }
}

export abstract class IgnoreIfEmptyXmlComponent extends XmlComponent {
    public prepForXml(context: IContext): IXmlableObject | undefined {
        const result = super.prepForXml(context);
        // Ignore the object if its falsey or is an empty object (would produce
        // an empty XML element if allowed to be included in the output).
        if (result && (typeof result[this.rootKey] !== "object" || Object.keys(result[this.rootKey]).length)) {
            return result;
        }

        return undefined;
    }
}
