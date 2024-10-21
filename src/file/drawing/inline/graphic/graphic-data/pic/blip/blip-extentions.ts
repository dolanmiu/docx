import { IMediaData } from "@file/media";
import { BuilderElement, XmlComponent } from "@file/xml-components";

const createSvgBlip = (mediaData: IMediaData): XmlComponent =>
    new BuilderElement({
        name: "asvg:svgBlip",
        attributes: {
            asvg: {
                key: "xmlns:asvg",
                value: "http://schemas.microsoft.com/office/drawing/2016/SVG/main",
            },
            embed: {
                key: "r:embed",
                value: `rId{${mediaData.fileName}}`,
            },
        },
    });

const createExtention = (mediaData: IMediaData): XmlComponent =>
    new BuilderElement({
        name: "a:ext",
        attributes: {
            uri: {
                key: "uri",
                value: "{96DAC541-7B7A-43D3-8B79-37D633B846F1}",
            },
        },
        children: [createSvgBlip(mediaData)],
    });

export const createExtentionList = (mediaData: IMediaData): XmlComponent =>
    new BuilderElement({
        name: "a:extLst",
        children: [createExtention(mediaData)],
    });
