import { SpaceType } from "@file/shared";
import { XmlComponent } from "@file/xml-components";

import { TextAttributes } from "../text-attributes";

// <xsd:complexType name="CT_Text">
//     <xsd:simpleContent>
//         <xsd:extension base="s:ST_String">
//             <xsd:attribute ref="xml:space" use="optional" />
//         </xsd:extension>
//     </xsd:simpleContent>
// </xsd:complexType>

interface ITextOptions {
    readonly space?: SpaceType;
    readonly text?: string;
}

export class Text extends XmlComponent {
    public constructor(options: string | ITextOptions) {
        super("w:t");

        if (typeof options === "string") {
            this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
            this.root.push(options);
            return this;
        } else {
            this.root.push(new TextAttributes({ space: options.space ?? SpaceType.DEFAULT }));
            this.root.push(options.text);
            return this;
        }
    }
}
