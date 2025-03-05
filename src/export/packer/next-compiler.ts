import JSZip from "jszip";
import xml from "xml";

import { File } from "@file/file";
import { obfuscate } from "@file/fonts/obfuscate-ttf-to-odttf";

import { Formatter } from "../formatter";
import { ImageReplacer } from "./image-replacer";
import { NumberingReplacer } from "./numbering-replacer";
import { PrettifyType } from "./packer";

export type IXmlifyedFile = {
    readonly data: string;
    readonly path: string;
};

type IXmlifyedFileMapping = {
    readonly Document: IXmlifyedFile;
    readonly Styles: IXmlifyedFile;
    readonly Properties: IXmlifyedFile;
    readonly Numbering: IXmlifyedFile;
    readonly Relationships: IXmlifyedFile;
    readonly FileRelationships: IXmlifyedFile;
    readonly Headers: readonly IXmlifyedFile[];
    readonly Footers: readonly IXmlifyedFile[];
    readonly HeaderRelationships: readonly IXmlifyedFile[];
    readonly FooterRelationships: readonly IXmlifyedFile[];
    readonly ContentTypes: IXmlifyedFile;
    readonly CustomProperties: IXmlifyedFile;
    readonly AppProperties: IXmlifyedFile;
    readonly FootNotes: IXmlifyedFile;
    readonly FootNotesRelationships: IXmlifyedFile;
    readonly Settings: IXmlifyedFile;
    readonly Comments?: IXmlifyedFile;
    readonly FontTable?: IXmlifyedFile;
    readonly FontTableRelationships?: IXmlifyedFile;
};

export class Compiler {
    private readonly formatter: Formatter;
    private readonly imageReplacer: ImageReplacer;
    private readonly numberingReplacer: NumberingReplacer;

    public constructor() {
        this.formatter = new Formatter();
        this.imageReplacer = new ImageReplacer();
        this.numberingReplacer = new NumberingReplacer();
    }

    public compile(
        file: File,
        prettifyXml?: (typeof PrettifyType)[keyof typeof PrettifyType],
        overrides: readonly IXmlifyedFile[] = [],
    ): JSZip {
        const zip = new JSZip();
        const xmlifiedFileMapping = this.xmlifyFile(file, prettifyXml);
        const map = new Map<string, IXmlifyedFile | readonly IXmlifyedFile[]>(Object.entries(xmlifiedFileMapping));

        for (const [, obj] of map) {
            if (Array.isArray(obj)) {
                for (const subFile of obj as readonly IXmlifyedFile[]) {
                    zip.file(subFile.path, subFile.data);
                }
            } else {
                zip.file((obj as IXmlifyedFile).path, (obj as IXmlifyedFile).data);
            }
        }

        for (const subFile of overrides) {
            zip.file(subFile.path, subFile.data);
        }

        for (const data of file.Media.Array) {
            if (data.type !== "svg") {
                zip.file(`word/media/${data.fileName}`, data.data);
            } else {
                zip.file(`word/media/${data.fileName}`, data.data);
                zip.file(`word/media/${data.fallback.fileName}`, data.fallback.data);
            }
        }

        for (const { data: buffer, name, fontKey } of file.FontTable.fontOptionsWithKey) {
            const [nameWithoutExtension] = name.split(".");
            zip.file(`word/fonts/${nameWithoutExtension}.odttf`, obfuscate(buffer, fontKey));
        }

        return zip;
    }

    private xmlifyFile(file: File, prettify?: (typeof PrettifyType)[keyof typeof PrettifyType]): IXmlifyedFileMapping {
        const documentRelationshipCount = file.Document.Relationships.RelationshipCount + 1;

        const documentXmlData = xml(
            this.formatter.format(file.Document.View, {
                viewWrapper: file.Document,
                file,
                stack: [],
            }),
            {
                indent: prettify,
                declaration: {
                    standalone: "yes",
                    encoding: "UTF-8",
                },
            },
        );
        const documentMediaDatas = this.imageReplacer.getMediaData(documentXmlData, file.Media);

        return {
            Relationships: {
                data: (() => {
                    documentMediaDatas.forEach((mediaData, i) => {
                        file.Document.Relationships.createRelationship(
                            documentRelationshipCount + i,
                            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                            `media/${mediaData.fileName}`,
                        );
                    });

                    file.Document.Relationships.createRelationship(
                        file.Document.Relationships.RelationshipCount + 1,
                        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable",
                        "fontTable.xml",
                    );

                    return xml(
                        this.formatter.format(file.Document.Relationships, {
                            viewWrapper: file.Document,
                            file,
                            stack: [],
                        }),
                        {
                            indent: prettify,
                            declaration: {
                                encoding: "UTF-8",
                            },
                        },
                    );
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
                data: (() => {
                    const xmlStyles = xml(
                        this.formatter.format(file.Styles, {
                            viewWrapper: file.Document,
                            file,
                            stack: [],
                        }),
                        {
                            indent: prettify,
                            declaration: {
                                standalone: "yes",
                                encoding: "UTF-8",
                            },
                        },
                    );
                    const referencedXmlStyles = this.numberingReplacer.replace(xmlStyles, file.Numbering.ConcreteNumbering);
                    return referencedXmlStyles;
                })(),
                path: "word/styles.xml",
            },
            Properties: {
                data: xml(
                    this.formatter.format(file.CoreProperties, {
                        viewWrapper: file.Document,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            standalone: "yes",
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "docProps/core.xml",
            },
            Numbering: {
                data: xml(
                    this.formatter.format(file.Numbering, {
                        viewWrapper: file.Document,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            standalone: "yes",
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "word/numbering.xml",
            },
            FileRelationships: {
                data: xml(
                    this.formatter.format(file.FileRelationships, {
                        viewWrapper: file.Document,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "_rels/.rels",
            },
            HeaderRelationships: file.Headers.map((headerWrapper, index) => {
                const xmlData = xml(
                    this.formatter.format(headerWrapper.View, {
                        viewWrapper: headerWrapper,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            encoding: "UTF-8",
                        },
                    },
                );
                const mediaDatas = this.imageReplacer.getMediaData(xmlData, file.Media);

                mediaDatas.forEach((mediaData, i) => {
                    headerWrapper.Relationships.createRelationship(
                        i,
                        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                        `media/${mediaData.fileName}`,
                    );
                });

                return {
                    data: xml(
                        this.formatter.format(headerWrapper.Relationships, {
                            viewWrapper: headerWrapper,
                            file,
                            stack: [],
                        }),
                        {
                            indent: prettify,
                            declaration: {
                                encoding: "UTF-8",
                            },
                        },
                    ),
                    path: `word/_rels/header${index + 1}.xml.rels`,
                };
            }),
            FooterRelationships: file.Footers.map((footerWrapper, index) => {
                const xmlData = xml(
                    this.formatter.format(footerWrapper.View, {
                        viewWrapper: footerWrapper,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            encoding: "UTF-8",
                        },
                    },
                );
                const mediaDatas = this.imageReplacer.getMediaData(xmlData, file.Media);

                mediaDatas.forEach((mediaData, i) => {
                    footerWrapper.Relationships.createRelationship(
                        i,
                        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                        `media/${mediaData.fileName}`,
                    );
                });

                return {
                    data: xml(
                        this.formatter.format(footerWrapper.Relationships, {
                            viewWrapper: footerWrapper,
                            file,
                            stack: [],
                        }),
                        {
                            indent: prettify,
                            declaration: {
                                encoding: "UTF-8",
                            },
                        },
                    ),
                    path: `word/_rels/footer${index + 1}.xml.rels`,
                };
            }),
            Headers: file.Headers.map((headerWrapper, index) => {
                const tempXmlData = xml(
                    this.formatter.format(headerWrapper.View, {
                        viewWrapper: headerWrapper,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            encoding: "UTF-8",
                        },
                    },
                );
                const mediaDatas = this.imageReplacer.getMediaData(tempXmlData, file.Media);
                // TODO: 0 needs to be changed when headers get relationships of their own
                const xmlData = this.imageReplacer.replace(tempXmlData, mediaDatas, 0);

                const referenedXmlData = this.numberingReplacer.replace(xmlData, file.Numbering.ConcreteNumbering);

                return {
                    data: referenedXmlData,
                    path: `word/header${index + 1}.xml`,
                };
            }),
            Footers: file.Footers.map((footerWrapper, index) => {
                const tempXmlData = xml(
                    this.formatter.format(footerWrapper.View, {
                        viewWrapper: footerWrapper,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            encoding: "UTF-8",
                        },
                    },
                );
                const mediaDatas = this.imageReplacer.getMediaData(tempXmlData, file.Media);
                // TODO: 0 needs to be changed when headers get relationships of their own
                const xmlData = this.imageReplacer.replace(tempXmlData, mediaDatas, 0);

                const referenedXmlData = this.numberingReplacer.replace(xmlData, file.Numbering.ConcreteNumbering);

                return {
                    data: referenedXmlData,
                    path: `word/footer${index + 1}.xml`,
                };
            }),
            ContentTypes: {
                data: xml(
                    this.formatter.format(file.ContentTypes, {
                        viewWrapper: file.Document,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "[Content_Types].xml",
            },
            CustomProperties: {
                data: xml(
                    this.formatter.format(file.CustomProperties, {
                        viewWrapper: file.Document,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            standalone: "yes",
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "docProps/custom.xml",
            },
            AppProperties: {
                data: xml(
                    this.formatter.format(file.AppProperties, {
                        viewWrapper: file.Document,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            standalone: "yes",
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "docProps/app.xml",
            },
            FootNotes: {
                data: xml(
                    this.formatter.format(file.FootNotes.View, {
                        viewWrapper: file.FootNotes,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "word/footnotes.xml",
            },
            FootNotesRelationships: {
                data: xml(
                    this.formatter.format(file.FootNotes.Relationships, {
                        viewWrapper: file.FootNotes,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "word/_rels/footnotes.xml.rels",
            },
            Settings: {
                data: xml(
                    this.formatter.format(file.Settings, {
                        viewWrapper: file.Document,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            standalone: "yes",
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "word/settings.xml",
            },
            Comments: {
                data: xml(
                    this.formatter.format(file.Comments, {
                        viewWrapper: file.Document,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            standalone: "yes",
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "word/comments.xml",
            },
            FontTable: {
                data: xml(
                    this.formatter.format(file.FontTable.View, {
                        viewWrapper: file.Document,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            standalone: "yes",
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "word/fontTable.xml",
            },
            FontTableRelationships: {
                data: (() =>
                    xml(
                        this.formatter.format(file.FontTable.Relationships, {
                            viewWrapper: file.Document,
                            file,
                            stack: [],
                        }),
                        {
                            indent: prettify,
                            declaration: {
                                encoding: "UTF-8",
                            },
                        },
                    ))(),
                path: "word/_rels/fontTable.xml.rels",
            },
        };
    }
}
