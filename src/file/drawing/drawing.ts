import { IMediaData } from "file/media";
import { XmlComponent } from "file/xml-components";
import { Anchor } from "./anchor";
import { IFloating } from "./floating";
import { Inline } from "./inline";

export interface IDistance {
    readonly distT?: number;
    readonly distB?: number;
    readonly distL?: number;
    readonly distR?: number;
}

export interface IDrawingOptions {
    readonly floating?: IFloating;
}

// <xsd:complexType name="CT_Drawing">
// <xsd:choice minOccurs="1" maxOccurs="unbounded">
//   <xsd:element ref="wp:anchor" minOccurs="0"/>
//   <xsd:element ref="wp:inline" minOccurs="0"/>
// </xsd:choice>
// </xsd:complexType>

export class Drawing extends XmlComponent {
    private readonly inline: Inline;

    constructor(imageData: IMediaData, drawingOptions: IDrawingOptions = {}) {
        super("w:drawing");

        if (!drawingOptions.floating) {
            this.inline = new Inline(imageData, imageData.transformation);
            this.root.push(this.inline);
        } else {
            this.root.push(new Anchor(imageData, imageData.transformation, drawingOptions));
        }
    }
}
