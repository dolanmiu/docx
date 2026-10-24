import { describe, expect, it, vi } from "vitest";

import {
    AlignmentType,
    Document,
    ExternalHyperlink,
    HorizontalPositionAlign,
    HorizontalPositionRelativeFrom,
    ImageRun,
    Packer,
    Paragraph,
    TextRun,
    TextWrappingSide,
    TextWrappingType,
    VerticalPositionRelativeFrom,
} from "docx";
import { formatted, png, pngDataUrl } from "tests/html";
import { textOf, unzip } from "tests/zip";

import { htmlToContent } from "./html-to-content";
import { DEFAULT_MAX_IMAGE_WIDTH, resolveUrl } from "./images";
import type { HtmlOptions, HtmlWarning } from "./options";

const html = (source: string, options?: HtmlOptions): string => formatted(htmlToContent(source, options));
const image = (
    data: Uint8Array,
    width: number,
    height: number,
    options: Partial<ConstructorParameters<typeof ImageRun>[0]> = {},
): ImageRun =>
    new ImageRun({ type: "png", data, transformation: { width, height }, ...options } as ConstructorParameters<typeof ImageRun>[0]);
const inParagraph = (...children: readonly ImageRun[]): string => formatted([new Paragraph({ children })]);

/** The size of the images written, in EMUs, as Word reads them */
const extentsOf = (written: string): readonly string[] =>
    [...written.matchAll(/<wp:extent cx="(\d+)" cy="(\d+)"\/>/g)].map(([, cx, cy]) => `${Number(cx) / 9525}x${Number(cy) / 9525}`);

const warningsOf = (source: string, options: HtmlOptions = {}): readonly HtmlWarning[] => {
    const onWarning = vi.fn<(warning: HtmlWarning) => void>();
    htmlToContent(source, { ...options, onWarning });
    return onWarning.mock.calls.map(([warning]) => warning);
};

/** The SVG file that the image of an <svg> in HTML is, in a document it is packed in */
const svgFileOf = async (source: string): Promise<string> => {
    const files = unzip(await Packer.toBuffer(new Document({ sections: [{ children: [...htmlToContent(source)] }] })));
    return textOf(
        files,
        [...files.keys()].find((path) => /^word\/media\/.*\.svg$/.test(path))!,
    )!;
};

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect width="40" height="20" fill="red"/></svg>';

describe("htmlToContent: images", () => {
    describe("data", () => {
        it("writes an image of a data URL, at its own size", () => {
            const data = png(30, 20);
            expect(html(`<p><img src="${pngDataUrl(30, 20)}"></p>`)).toBe(inParagraph(image(data, 30, 20)));
        });

        it("writes an image from the images option, by its address as it is written", () => {
            const data = png(10, 10);
            // eslint-disable-next-line @typescript-eslint/naming-convention -- selectors and addresses, as the options are given
            expect(html('<p><img src="photo.png"></p>', { images: { "photo.png": data } })).toBe(inParagraph(image(data, 10, 10)));
        });

        it("writes an image from the images option by its address resolved against baseUrl", () => {
            const data = png(10, 10);
            expect(
                html('<p><img src="photo.png"></p>', {
                    images: { "https://example.com/a/photo.png": data },
                    baseUrl: "https://example.com/a/",
                }),
            ).toBe(inParagraph(image(data, 10, 10)));
        });

        it("gives the images option's function each address, as written and then resolved", () => {
            const data = png(10, 10);
            const images = vi.fn((source: string) => (source.startsWith("https://") ? data : undefined));
            expect(html('<p><img src="photo.png"></p>', { images, baseUrl: "https://example.com/" })).toBe(
                inParagraph(image(data, 10, 10)),
            );
            expect(images.mock.calls).toEqual([["photo.png"], ["https://example.com/photo.png"]]);
        });

        it("reads an image given as an ArrayBuffer, as base64, or as a data URL", () => {
            const data = png(10, 10);
            const expected = inParagraph(image(data, 10, 10));
            expect(html('<p><img src="a"></p>', { images: { a: data.buffer as ArrayBuffer } })).toBe(expected);
            expect(html('<p><img src="a"></p>', { images: { a: Buffer.from(data).toString("base64") } })).toBe(expected);
            expect(html('<p><img src="a"></p>', { images: { a: pngDataUrl(10, 10) } })).toBe(expected);
            expect(html('<p><img src="a"></p>', { images: { a: { data } } })).toBe(expected);
        });

        it("reads a data URL with spaces and new lines in its base64, and an uppercase scheme", () => {
            const url = pngDataUrl(12, 6)
                .replace("data:", " DATA:")
                .replace(/(base64,.{20})/, "$1\n ");
            expect(extentsOf(html(`<p><img src="${url}"></p>`))).toEqual(["12x6"]);
        });

        it("writes images of each format Word shows, by their bytes rather than their URL's media type", () => {
            const gif = "data:image/png;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
            expect(html(`<p><img src="${gif}"></p>`)).toContain('<a:blip r:embed="rId"');
            expect(html(`<p><img src="${gif}"></p>`)).toMatch(/<wp:extent cx="9525" cy="9525"\/>/);
        });

        it("leaves out an image with no src, or whose data it can't find, with a warning", () => {
            expect(html('<p>a<img>b<img src="">c<img src="https://example.com/x.png">d</p>')).toBe(
                formatted([new Paragraph({ children: [new TextRun({ children: ["abcd"] })] })]),
            );
            expect(warningsOf('<img><img src="https://example.com/x.png">')).toEqual([
                { code: "missing-image", message: "An image has no src, so it is left out" },
                {
                    code: "missing-image",
                    message: 'The image "https://example.com/x.png" isn\'t a data URL or in the images option, so it is left out',
                },
            ]);
        });

        it("leaves out an image whose base64 isn't valid, with a warning", () => {
            expect(warningsOf('<img src="data:image/png;base64,***">').map(({ code }) => code)).toEqual(["missing-image"]);
            expect(warningsOf('<img src="a">', { images: { a: "***" } }).map(({ code }) => code)).toEqual(["missing-image"]);
        });

        it("names a long data URL by its start in a warning", () => {
            const url = `data:image/webp;base64,${Buffer.from(`RIFF\u0000\u0000\u0000\u0000WEBPVP8 ${"x".repeat(60)}`).toString("base64")}`;
            expect(warningsOf(`<img src="${url}">`)[0].message).toBe(
                `The image "${url.slice(0, 57)}..." is WEBP, which Word can't show, so it is left out`,
            );
        });

        it("leaves out an image Word can't show, such as WebP, and data that isn't an image, with a warning", () => {
            const webp = `data:image/webp;base64,${Buffer.from("RIFF\u0000\u0000\u0000\u0000WEBPVP8 ").toString("base64")}`;
            expect(html(`<p><img src="${webp}"></p>`)).toBe(formatted([new Paragraph({})]));
            expect(warningsOf(`<img src="${webp}"><img src="data:text/plain,hello">`)).toEqual([
                { code: "unsupported-image", message: `The image "${webp}" is WEBP, which Word can't show, so it is left out` },
                {
                    code: "unsupported-image",
                    message: 'The image "data:text/plain,hello" isn\'t an image Word can show, so it is left out',
                },
            ]);
        });

        it("warns once of an image it leaves out many times", () => {
            expect(warningsOf('<img src="x.png"><img src="x.png">')).toHaveLength(1);
        });
    });

    describe("size", () => {
        it.each([
            ['width="60" height="40"', "60x40"],
            ['width="60"', "60x30"],
            ['height="10"', "20x10"],
            ['style="width: 1in"', "96x48"],
            ['style="width: 45pt; height: 30pt"', "60x40"],
            ['style="height: 2em"', "64x32"],
            ['style="width: 50%"', "301x150"],
            ['style="width: auto; height: auto"', "200x100"],
            ['style="max-width: 100px"', "100x50"],
            ['style="max-height: 50px"', "100x50"],
            ['style="min-width: 400px"', "400x200"],
            ['style="min-height: 150px"', "300x150"],
            ['width="1000"', "601x301"],
            ['style="max-width: 100%" width="2000" height="100"', "601x30"],
            ['style="width: 0.1px; height: 0.1px"', "1x1"],
            ['style="height: 50%"', "200x100"],
        ])("sizes an image of 200 by 100 with %s as %s", (attributes, size) => {
            expect(extentsOf(html(`<p><img src="${pngDataUrl(200, 100)}" ${attributes}></p>`))).toEqual([size]);
        });

        it("scales images down to maxImageWidth", () => {
            expect(extentsOf(html(`<p><img src="${pngDataUrl(800, 400)}"></p>`, { maxImageWidth: 200 }))).toEqual(["200x100"]);
            expect(DEFAULT_MAX_IMAGE_WIDTH).toBe(601);
        });

        it("sizes an image whose file doesn't say its size as 300 by 150, as a browser does", () => {
            const truncated = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
            expect(extentsOf(html('<p><img src="a"></p>', { images: { a: truncated } }))).toEqual(["300x150"]);
        });
    });

    describe("alt text, links and placing", () => {
        it("writes alt as the image's description, and title as its title", () => {
            const data = png(10, 10);
            expect(html(`<p><img src="${pngDataUrl(10, 10)}" alt="A chart" title="Sales"></p>`)).toBe(
                inParagraph(image(data, 10, 10, { altText: { name: "A chart", description: "A chart", title: "Sales" } })),
            );
            expect(html(`<p><img src="${pngDataUrl(10, 10)}" title="Sales"></p>`)).toBe(
                inParagraph(image(data, 10, 10, { altText: { name: "", description: "", title: "Sales" } })),
            );
        });

        it("marks an image with an empty alt as decorative, as HTML means by it", () => {
            const data = png(10, 10);
            expect(html(`<p><img src="${pngDataUrl(10, 10)}" alt=""></p>`)).toBe(inParagraph(image(data, 10, 10, { decorative: true })));
        });

        it("writes an image in a link in the link", () => {
            const data = png(10, 10);
            expect(html(`<p><a href="https://example.com"><img src="${pngDataUrl(10, 10)}"></a></p>`)).toBe(
                formatted([
                    new Paragraph({ children: [new ExternalHyperlink({ link: "https://example.com", children: [image(data, 10, 10)] })] }),
                ]),
            );
        });

        it("writes an image that is a block in a paragraph of its own, centred by its auto margins", () => {
            const data = png(10, 10);
            expect(html(`<p>a<img src="${pngDataUrl(10, 10)}" style="display: block; margin: 0 auto">b</p>`)).toBe(
                formatted([
                    new Paragraph({ children: [new TextRun({ children: ["a"] })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [image(data, 10, 10)] }),
                    new Paragraph({ children: [new TextRun({ children: ["b"] })] }),
                ]),
            );
        });

        it("writes an image that is a block on the right by its auto left margin, and on its own without", () => {
            const data = png(10, 10);
            expect(html(`<div><img src="${pngDataUrl(10, 10)}" style="display: block; margin-left: auto"></div>`)).toBe(
                formatted([new Paragraph({ alignment: AlignmentType.RIGHT, children: [image(data, 10, 10)] })]),
            );
            expect(html(`<div><img src="${pngDataUrl(10, 10)}" style="display: block"></div>`)).toBe(
                formatted([new Paragraph({ children: [image(data, 10, 10)] })]),
            );
        });

        it("floats an image with float: left or right, with the text around it", () => {
            const data = png(10, 10);
            expect(html(`<p><img src="${pngDataUrl(10, 10)}" style="float: right; margin-left: 10px"></p>`)).toBe(
                inParagraph(
                    image(data, 10, 10, {
                        floating: {
                            horizontalPosition: { relative: HorizontalPositionRelativeFrom.COLUMN, align: HorizontalPositionAlign.RIGHT },
                            verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
                            wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.BOTH_SIDES },
                            margins: { top: 0, bottom: 0, left: 95250, right: 0 },
                        },
                    }),
                ),
            );
            expect(html(`<p><img src="${pngDataUrl(10, 10)}" align="left"></p>`)).toContain("<wp:align>left</wp:align>");
            expect(html(`<p><img src="${pngDataUrl(10, 10)}" align="left"></p>`)).toContain('distR="114300"');
        });

        it("floats CKEditor's side images", () => {
            expect(html(`<figure class="image image-style-side"><img src="${pngDataUrl(10, 10)}"></figure>`)).toContain("<wp:anchor");
        });
    });

    describe("SVG", () => {
        it("writes an SVG image with a transparent picture where Word can't show SVGs", () => {
            const written = html(`<p><img src="data:image/svg+xml;utf8,${encodeURIComponent(SVG)}"></p>`);
            expect(extentsOf(written)).toEqual(["40x20"]);
            expect(written).toContain("asvg:svgBlip");
        });

        it("writes an SVG with the picture the images option gives", () => {
            const fallback = png(40, 20);
            // eslint-disable-next-line @typescript-eslint/naming-convention -- selectors and addresses, as the options are given
            const content = htmlToContent('<p><img src="logo.svg"></p>', { images: { "logo.svg": { data: Buffer.from(SVG), fallback } } });
            expect(formatted(content)).toContain("asvg:svgBlip");
        });

        it("writes the transparent picture when the images option's picture isn't one Word shows", () => {
            const content = htmlToContent('<p><img src="logo.svg"></p>', {
                // eslint-disable-next-line @typescript-eslint/naming-convention -- selectors and addresses, as the options are given
                images: { "logo.svg": { data: Buffer.from(SVG), fallback: Buffer.from(SVG) } },
            });
            expect(formatted(content)).toContain("asvg:svgBlip");
        });

        it("writes an <svg> in the HTML as an SVG image, with its namespaces", () => {
            const written = html('<p><svg width="30" height="15" viewBox="0 0 30 15"><use xlink:href="#a"/><circle r="5"/></svg></p>');
            expect(extentsOf(written)).toEqual(["30x15"]);
            const inline = htmlToContent('<p><svg width="30" height="15"><circle r="5"/></svg></p>');
            expect(inline).toHaveLength(1);
        });

        it("writes an <svg>'s attributes with their prefixes, its text, and no comments, as an SVG file has them", async () => {
            const svg = await svgFileOf(
                '<svg width="10" height="10"><a xlink:href="#a"><text x="1">A &amp; B &lt; "C"<!-- c --></text></a><g></g></svg>',
            );
            expect(svg).toBe(
                '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="10" height="10"><a xlink:href="#a"><text x="1">A &amp; B &lt; &quot;C&quot;</text></a><g/></svg>',
            );
        });

        it("writes an <svg> with no links without the xlink namespace", async () => {
            expect(await svgFileOf('<svg width="10" height="10"></svg>')).toBe(
                '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>',
            );
        });

        it("keeps the namespaces an <svg> in the HTML already has", async () => {
            expect(
                await svgFileOf(
                    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="10" height="10"><use xlink:href="#a"/></svg>',
                ),
            ).toBe(
                '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="10" height="10"><use xlink:href="#a"/></svg>',
            );
        });

        it("writes an <svg> that is a block in a paragraph of its own", () => {
            expect(html('<p>a<svg style="display: block" width="10" height="10"></svg>b</p>').match(/<w:p>/g)).toHaveLength(3);
        });
    });

    describe("resolveUrl", () => {
        it("resolves an address against a base, and leaves out one it can't", () => {
            expect(resolveUrl("b.png", "https://example.com/a/")).toBe("https://example.com/a/b.png");
            expect(resolveUrl("b.png", undefined)).toBeUndefined();
            expect(resolveUrl("b.png", "not a url")).toBeUndefined();
        });
    });
});
