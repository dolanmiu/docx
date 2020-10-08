import * as JSZip from "jszip";
import * as xml from "xml";

import { File } from "file";
import { Formatter } from "../formatter";
import { ImageReplacer } from "./image-replacer";
import { NumberingReplacer } from "./numbering-replacer";

interface IXmlifyedFile {
    readonly data: string;
    readonly path: string;
}

interface IXmlifyedFileMapping {
    readonly Document: IXmlifyedFile;
    readonly Styles: IXmlifyedFile;
    readonly Properties: IXmlifyedFile;
    readonly Numbering: IXmlifyedFile;
    readonly Relationships: IXmlifyedFile;
    readonly FileRelationships: IXmlifyedFile;
    readonly Headers: IXmlifyedFile[];
    readonly Footers: IXmlifyedFile[];
    readonly HeaderRelationships: IXmlifyedFile[];
    readonly FooterRelationships: IXmlifyedFile[];
    readonly ContentTypes: IXmlifyedFile;
    readonly AppProperties: IXmlifyedFile;
    readonly FootNotes: IXmlifyedFile;
    readonly Settings: IXmlifyedFile;
}

export class Compiler {
    private readonly formatter: Formatter;
    private readonly imageReplacer: ImageReplacer;
    private readonly numberingReplacer: NumberingReplacer;

    constructor() {
        this.formatter = new Formatter();
        this.imageReplacer = new ImageReplacer();
        this.numberingReplacer = new NumberingReplacer();
    }

    public compile(file: File, prettifyXml?: boolean): JSZip {
        const zip = new JSZip();
        const xmlifiedFileMapping = this.xmlifyFile(file, prettifyXml);

        for (const key in xmlifiedFileMapping) {
            if (!xmlifiedFileMapping[key]) {
                continue;
            }

            const obj = xmlifiedFileMapping[key] as IXmlifyedFile | IXmlifyedFile[];

            if (Array.isArray(obj)) {
                for (const subFile of obj) {
                    zip.file(subFile.path, subFile.data);
                }
            } else {
                zip.file(obj.path, obj.data);
            }
        }

        for (const data of file.Media.Array) {
            const mediaData = data.stream;
            zip.file(`word/media/${data.fileName}`, mediaData);
        }

        return zip;
    }

    private xmlifyFile(file: File, prettify?: boolean): IXmlifyedFileMapping {
        file.verifyUpdateFields();
        const documentRelationshipCount = file.DocumentRelationships.RelationshipCount + 1;

        const documentXmlData = xml(this.formatter.format(file.Document, file), prettify);
        const documentMediaDatas = this.imageReplacer.getMediaData(documentXmlData, file.Media);

        return {
            Relationships: {
                data: (() => {
                    documentMediaDatas.forEach((mediaData, i) => {
                        file.DocumentRelationships.createRelationship(
                            documentRelationshipCount + i,
                            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                            `media/${mediaData.fileName}`,
                        );
                    });

                    return xml(this.formatter.format(file.DocumentRelationships, file), prettify);
                })(),
                path: "word/_rels/document.xml.rels",
            },
            Document: {
                data: (() => {
                    const xmlData = this.imageReplacer.replace(documentXmlData, documentMediaDatas, documentRelationshipCount);
                    const referenedXmlData = this.numberingReplacer.replace(xmlData, file.Numbering.ConcreteNumbering);

                    return referenedXmlData;
                })(),
                path: "word/document.xml",
            },
            Styles: {
                data: xml(this.formatter.format(file.Styles, file), prettify),
                path: "word/styles.xml",
            },
            Properties: {
                data: xml(this.formatter.format(file.CoreProperties, file), {
                    declaration: {
                        standalone: "yes",
                        encoding: "UTF-8",
                    },
                }),
                path: "docProps/core.xml",
            },
            Numbering: {
                data: xml(this.formatter.format(file.Numbering, file), prettify),
                path: "word/numbering.xml",
            },
            FileRelationships: {
                data: xml(this.formatter.format(file.FileRelationships, file), prettify),
                path: "_rels/.rels",
            },
            HeaderRelationships: file.Headers.map((headerWrapper, index) => {
                const xmlData = xml(this.formatter.format(headerWrapper.Header, file), prettify);
                const mediaDatas = this.imageReplacer.getMediaData(xmlData, file.Media);

                mediaDatas.forEach((mediaData, i) => {
                    headerWrapper.Relationships.createRelationship(
                        i,
                        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                        `media/${mediaData.fileName}`,
                    );
                });

                return {
                    data: xml(this.formatter.format(headerWrapper.Relationships, file), prettify),
                    path: `word/_rels/header${index + 1}.xml.rels`,
                };
            }),
            FooterRelationships: file.Footers.map((footerWrapper, index) => {
                const xmlData = xml(this.formatter.format(footerWrapper.Footer, file), prettify);
                const mediaDatas = this.imageReplacer.getMediaData(xmlData, file.Media);

                mediaDatas.forEach((mediaData, i) => {
                    footerWrapper.Relationships.createRelationship(
                        i,
                        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                        `media/${mediaData.fileName}`,
                    );
                });

                return {
                    data: xml(this.formatter.format(footerWrapper.Relationships, file), prettify),
                    path: `word/_rels/footer${index + 1}.xml.rels`,
                };
            }),
            Headers: file.Headers.map((headerWrapper, index) => {
                const tempXmlData = xml(this.formatter.format(headerWrapper.Header, file), prettify);
                const mediaDatas = this.imageReplacer.getMediaData(tempXmlData, file.Media);
                // TODO: 0 needs to be changed when headers get relationships of their own
                const xmlData = this.imageReplacer.replace(tempXmlData, mediaDatas, 0);

                return {
                    data: xmlData,
                    path: `word/header${index + 1}.xml`,
                };
            }),
            Footers: file.Footers.map((footerWrapper, index) => {
                const tempXmlData = xml(this.formatter.format(footerWrapper.Footer, file), prettify);
                const mediaDatas = this.imageReplacer.getMediaData(tempXmlData, file.Media);
                // TODO: 0 needs to be changed when headers get relationships of their own
                const xmlData = this.imageReplacer.replace(tempXmlData, mediaDatas, 0);

                return {
                    data: xmlData,
                    path: `word/footer${index + 1}.xml`,
                };
            }),
            ContentTypes: {
                data: xml(this.formatter.format(file.ContentTypes, file), prettify),
                path: "[Content_Types].xml",
            },
            AppProperties: {
                data: xml(this.formatter.format(file.AppProperties, file), prettify),
                path: "docProps/app.xml",
            },
            FootNotes: {
                data: xml(this.formatter.format(file.FootNotes, file), prettify),
                path: "word/footnotes.xml",
            },
            Settings: {
                data: xml(this.formatter.format(file.Settings, file), prettify),
                path: "word/settings.xml",
            },
        };
    }
}
