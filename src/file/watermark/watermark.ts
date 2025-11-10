// watermark.ts
import { XmlComponent } from "@file/xml-components";
import { Paragraph } from "@file/paragraph";

export interface WatermarkOptions {
    text: string;
    color?: string;
    opacity?: number;
    fontSize?: number;
    fontFamily?: string;
    rotation?: number; // degrees
    width?: number;
    height?: number;
}

export class Watermark extends XmlComponent {
    constructor(options: WatermarkOptions) {
        super("w:r");

        const {
            text,
            color = "#C0C0C0",
            opacity = 0.5,
            fontSize = 36,
            fontFamily = "Arial",
            rotation = 315, // -45 degrees in Word format
            width = 497.65,
            height = 89.55
        } = options;

        // Convert rotation to Word's format (multiply by 65536)
        const wordRotation = Math.round(rotation * 65536);
        // Convert opacity to Word's format (0-65536, where 32768 = 50%)
        const wordOpacity = Math.round(opacity * 65536);

        this.root.push(
            new Pict({
                shape: new VShape({
                    id: "PowerPlusWaterMarkObject" + Math.floor(Math.random() * 100000000),
                    spid: "_x0000_s2049",
                    spt: "136",
                    type: "#_x0000_t136",
                    style: [
                        "position:absolute",
                        "left:0pt",
                        `height:${height}pt`,
                        `width:${width}pt`,
                        "mso-position-horizontal:center",
                        "mso-position-horizontal-relative:margin",
                        "mso-position-vertical:center",
                        "mso-position-vertical-relative:margin",
                        `rotation:${wordRotation}f`,
                        "z-index:-251657216",
                        "mso-width-relative:page",
                        "mso-height-relative:page"
                    ].join(";"),
                    fillcolor: color,
                    filled: "t",
                    stroked: "f",
                    coordsize: "21600,21600",
                    adj: "10800",
                    children: [
                        new VPath(),
                        new VFill({
                            on: "t",
                            opacity: `${wordOpacity}f`,
                            focussize: "0,0"
                        }),
                        new VStroke({ on: "f" }),
                        new VImageData({ title: "" }),
                        new OLock({
                            ext: "edit",
                            grouping: "f",
                            rotation: "f",
                            text: "f",
                            aspectratio: "t"
                        }),
                        new VTextPath({
                            on: "t",
                            fitshape: "t",
                            fitpath: "t",
                            trim: "t",
                            xscale: "f",
                            string: text,
                            style: [
                                `font-family:${fontFamily}`,
                                `font-size:${fontSize}pt`,
                                "v-text-align:center"
                            ].join(";")
                        })
                    ]
                })
            })
        );
    }
}

// VML Shape components
class Pict extends XmlComponent {
    constructor(options: { shape: VShape }) {
        super("w:pict");
        this.root.push(options.shape);
    }
}

class VShape extends XmlComponent {
    constructor(options: {
        id: string;
        spid: string;
        spt: string;
        type: string;
        style: string;
        fillcolor: string;
        filled: string;
        stroked: string;
        coordsize: string;
        adj: string;
        children: XmlComponent[];
    }) {
        super("v:shape");

        this.root.push({
            _attr: {
                id: options.id,
                "o:spid": options.spid,
                "o:spt": options.spt,
                type: options.type,
                style: options.style,
                fillcolor: options.fillcolor,
                filled: options.filled,
                stroked: options.stroked,
                coordsize: options.coordsize,
                adj: options.adj
            }
        });

        options.children.forEach(child => this.root.push(child));
    }
}

class VPath extends XmlComponent {
    constructor() {
        super("v:path");
    }
}

class VFill extends XmlComponent {
    constructor(options: { on: string; opacity: string; focussize: string }) {
        super("v:fill");
        this.root.push({
            _attr: {
                on: options.on,
                opacity: options.opacity,
                focussize: options.focussize
            }
        });
    }
}

class VStroke extends XmlComponent {
    constructor(options: { on: string }) {
        super("v:stroke");
        this.root.push({ _attr: { on: options.on } });
    }
}

class VImageData extends XmlComponent {
    constructor(options: { title: string }) {
        super("v:imagedata");
        this.root.push({ _attr: { "o:title": options.title } });
    }
}

class OLock extends XmlComponent {
    constructor(options: {
        ext: string;
        grouping: string;
        rotation: string;
        text: string;
        aspectratio: string;
    }) {
        super("o:lock");
        this.root.push({
            _attr: {
                "v:ext": options.ext,
                grouping: options.grouping,
                rotation: options.rotation,
                text: options.text,
                aspectratio: options.aspectratio
            }
        });
    }
}

class VTextPath extends XmlComponent {
    constructor(options: {
        on: string;
        fitshape: string;
        fitpath: string;
        trim: string;
        xscale: string;
        string: string;
        style: string;
    }) {
        super("v:textpath");
        this.root.push({
            _attr: {
                on: options.on,
                fitshape: options.fitshape,
                fitpath: options.fitpath,
                trim: options.trim,
                xscale: options.xscale,
                string: options.string,
                style: options.style
            }
        });
    }
}

// Usage example for header/footer
export class WatermarkParagraph extends Paragraph {
    constructor(watermarkOptions: WatermarkOptions) {
        super({
            children: [new Watermark(watermarkOptions)],
            style: "5" // Header style
        });
    }
}