import { XmlAttributeComponent, XmlComponent } from "file/xml-components";
import { Compatibility } from "./compatibility";
import { UpdateFields } from "./update-fields";
import { TrackRevisions } from "./track-revisions";

export interface ISettingsAttributesProperties {
    readonly wpc?: string;
    readonly mc?: string;
    readonly o?: string;
    readonly r?: string;
    readonly m?: string;
    readonly v?: string;
    readonly wp14?: string;
    readonly wp?: string;
    readonly w10?: string;
    readonly w?: string;
    readonly w14?: string;
    readonly w15?: string;
    readonly wpg?: string;
    readonly wpi?: string;
    readonly wne?: string;
    readonly wps?: string;
    readonly Ignorable?: string;
}

export class SettingsAttributes extends XmlAttributeComponent<ISettingsAttributesProperties> {
    protected readonly xmlKeys = {
        wpc: "xmlns:wpc",
        mc: "xmlns:mc",
        o: "xmlns:o",
        r: "xmlns:r",
        m: "xmlns:m",
        v: "xmlns:v",
        wp14: "xmlns:wp14",
        wp: "xmlns:wp",
        w10: "xmlns:w10",
        w: "xmlns:w",
        w14: "xmlns:w14",
        w15: "xmlns:w15",
        wpg: "xmlns:wpg",
        wpi: "xmlns:wpi",
        wne: "xmlns:wne",
        wps: "xmlns:wps",
        Ignorable: "mc:Ignorable",
    };
}

export class Settings extends XmlComponent {
    private readonly compatibility;
    private readonly trackRevisions;

    constructor() {
        super("w:settings");
        this.root.push(
            new SettingsAttributes({
                wpc: "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
                mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
                o: "urn:schemas-microsoft-com:office:office",
                r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                m: "http://schemas.openxmlformats.org/officeDocument/2006/math",
                v: "urn:schemas-microsoft-com:vml",
                wp14: "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
                wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
                w10: "urn:schemas-microsoft-com:office:word",
                w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                w14: "http://schemas.microsoft.com/office/word/2010/wordml",
                w15: "http://schemas.microsoft.com/office/word/2012/wordml",
                wpg: "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
                wpi: "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
                wne: "http://schemas.microsoft.com/office/word/2006/wordml",
                wps: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
                Ignorable: "w14 w15 wp14",
            }),
        );
        this.compatibility = new Compatibility();
        this.trackRevisions = new TrackRevisions();
    }

    public addUpdateFields(): void {
        if (!this.root.find((child) => child instanceof UpdateFields)) {
            this.addChildElement(new UpdateFields());
        }
    }

    public addCompatibility(): Compatibility {
        if (!this.root.find((child) => child instanceof Compatibility)) {
            this.addChildElement(this.compatibility);
        }

        return this.compatibility;
    }

    public addTrackRevisions(): TrackRevisions {
        if (!this.root.find((child) => child instanceof TrackRevisions)) {
            this.addChildElement(this.trackRevisions);
        }

        return this.trackRevisions;
    }
}
