const createLsdException = (name: string, uiPriority?: number, qFormat?: number, semiHidden?: number, unhideWhenUsed?: number) => {
    "use strict";

    return [
        {
            _attr: {
                "w:name": name,
                "w:uiPriority": uiPriority,
                "w:qFormat": qFormat,
                "w:semiHidden": semiHidden,
                "w:unhideWhenUsed": unhideWhenUsed,
            },
        },
    ];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DefaultStyle = (): Record<string, any> => {
    const style = {
        "w:styles": [
            {
                _attr: {
                    "xmlns:mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
                    "xmlns:r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                    "xmlns:w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                    "xmlns:w14": "http://schemas.microsoft.com/office/word/2010/wordml",
                    "xmlns:w15": "http://schemas.microsoft.com/office/word/2012/wordml",
                    "mc:Ignorable": "w14 w15",
                },
            },
            {
                "w:docDefaults": [
                    {
                        "w:rPrDefault": [
                            {
                                "w:rPr": [
                                    {
                                        "w:rFonts": [
                                            {
                                                _attr: {
                                                    "w:asciiTheme": "minorHAnsi",
                                                    "w:eastAsiaTheme": "minorHAnsi",
                                                    "w:hAnsiTheme": "minorHAnsi",
                                                    "w:cstheme": "minorBidi",
                                                },
                                            },
                                        ],
                                    },
                                    {
                                        "w:sz": [
                                            {
                                                _attr: {
                                                    "w:val": "22",
                                                },
                                            },
                                        ],
                                    },
                                    {
                                        "w:szCs": [
                                            {
                                                _attr: {
                                                    "w:val": "22",
                                                },
                                            },
                                        ],
                                    },
                                    {
                                        "w:lang": [
                                            {
                                                _attr: {
                                                    "w:val": "en-GB",
                                                    "w:eastAsia": "en-US",
                                                    "w:bidi": "ar-SA",
                                                },
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "w:pPrDefault": [
                            {
                                "w:pPr": [
                                    {
                                        "w:spacing": [
                                            {
                                                _attr: {
                                                    "w:after": "160",
                                                    "w:line": "259",
                                                    "w:lineRule": "auto",
                                                },
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                "w:latentStyles": [
                    {
                        _attr: {
                            "w:defLockedState": "0",
                            "w:defUIPriority": "99",
                            "w:defSemiHidden": "0",
                            "w:defUnhideWhenUsed": "0",
                            "w:defQFormat": "0",
                            "w:count": "371",
                        },
                    },
                    {
                        "w:lsdException": createLsdException("Normal", 0, 1),
                    },
                    {
                        "w:lsdException": createLsdException("heading 1", 9, 1, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("heading 2", 9, 1, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("heading 3", 9, 1, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("heading 4", 9, 1, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("heading 5", 9, 1, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("heading 6", 9, 1, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("heading 7", 9, 1, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("heading 8", 9, 1, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("heading 9", 9, 1, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("index 1", undefined, undefined, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("index 2", undefined, undefined, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("index 3", undefined, undefined, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("index 4", undefined, undefined, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("index 5", undefined, undefined, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("index 6", undefined, undefined, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("index 7", undefined, undefined, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("index 8", undefined, undefined, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("index 9", undefined, undefined, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("toc 1", 39, undefined, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("toc 2", 39, undefined, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("toc 3", 39, undefined, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("toc 4", 39, undefined, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("toc 5", 39, undefined, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("toc 6", 39, undefined, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("toc 7", 39, undefined, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("toc 8", 39, undefined, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("toc 9", 39, undefined, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("Normal Indent", undefined, undefined, 1, 1),
                    },
                    {
                        "w:lsdException": createLsdException("footnote text", undefined, undefined, 1, 1),
                    },
                ],
            },
        ],
    };

    return style;
};
