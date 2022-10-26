import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { uniqueNumericId } from "@util/convenience-functions";

class DocPropertiesAttributes extends XmlAttributeComponent<{
    readonly id?: number;
    readonly name?: string;
    readonly description?: string;
    readonly title?: string;
}> {
    protected readonly xmlKeys = {
        id: "id",
        name: "name",
        description: "descr",
        title: "title",
    };
}

export interface DocPropertiesOptions {
    readonly name: string;
    readonly description: string;
    readonly title: string;
}

export class DocProperties extends XmlComponent {
    public constructor({ name, description, title }: DocPropertiesOptions = { name: "", description: "", title: "" }) {
        super("wp:docPr");

        this.root.push(
            new DocPropertiesAttributes({
                id: uniqueNumericId(),
                name,
                description,
                title,
            }),
        );
    }
}
