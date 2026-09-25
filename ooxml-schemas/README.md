# OOXML schemas

The XML schemas for everything a .docx can hold.

| Folder                | What                                                                                                    | From                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ISO-IEC29500-4_2016` | Office Open XML, transitional: WordprocessingML, DrawingML, VML, math, document properties and the rest | [ISO/IEC 29500-4:2016](https://standards.iso.org/ittf/PubliclyAvailableStandards/c071691_ISO_IEC_29500-4_2016_Electronic_inserts.zip), the same as ECMA-376 Part 4, 5th edition |
| `ECMA-376-2_2021`     | Open Packaging Conventions: `[Content_Types].xml`, relationships, core properties and signatures        | [ECMA-376 Part 2, 5th edition](https://ecma-international.org/publications-and-standards/standards/ecma-376/) (December 2021), the same as ISO/IEC 29500-2:2021                 |
| `mce`                 | Markup Compatibility (`mc:`), from ECMA-376 Part 3                                                      | [docx4j](https://github.com/plutext/docx4j/blob/master/xsd/mce/markup-compatibility-2006-MINIMAL.xsd), as the standard has no schema for it                                     |
| `dublin-core`         | Dublin Core, which the core properties use                                                              | [dublincore.org](http://dublincore.org/schemas/xmls/qdc/2003/04/02/), the 2003-04-02 schemas the core properties schema names                                                   |
| `microsoft`           | Microsoft's extensions, such as Word 2010 shapes (`wps:`) and later Word features (`w14:`, `w15:`, ...) | The "Full XML Schemas" appendices of [MS-DOCX], [MS-ODRAWXML] and [MS-OFFMACRO2], below                                                                                         |

The Strict schemas (ECMA-376 Part 1) aren't here: docx writes transitional documents, which are in other namespaces.

## Changes from the originals

The schemas are as published, except:

- Each of Microsoft's starts with a comment saying where it's from.

- **Imports** point at the files here. Microsoft's schemas name files that aren't published (such as `oartbasetypes.xsd` for DrawingML), and the Open Packaging Conventions name Dublin Core's website.
- **Microsoft's schemas** were written against ECMA-376 1st edition, where some simple types were in the WordprocessingML, DrawingML and chart namespaces. ISO/IEC 29500 moved these to the shared types namespace (`s:`), so, for example, `w:ST_OnOff`, `a:ST_Guid` and `c:ST_Xstring` are `s:ST_OnOff`, `s:ST_Guid` and `s:ST_Xstring`.
- `microsoft/wml-2010.xsd` includes `microsoft/wml-2010-contentPart.xsd`, the rest of its namespace, from [MS-ODRAWXML].
- `microsoft/drawing-2010-main.xsd`: `ST_SaturationAmount` restricts `a:ST_PercentageDecimal`, as `a:ST_Percentage` became a union, which can't be restricted to a range.
- `microsoft/drawing-2014-chartex.xsd`: the space after `CT_GeoHierarchyEntity` in the type of `geoHierarchyEntity` is gone.
- `microsoft/wml-2006.xsd` declares `txbxContent`, which `wps:txbx` refers to, from a schema Microsoft hasn't published.
- `ISO-IEC29500-4_2016/wml.xsd` allows `mc:Ignorable` on `w:document`, and `ISO-IEC29500-4_2016/shared-math.xsd` imports `xml.xsd`, which is W3C's schema for the `xml:` attributes.

[MS-ODRAWXML] 5.19, PowerPoint's ink actions, isn't here, as it's written against Microsoft's own InkML schema rather than W3C's.

## Microsoft's schemas

| File                                   | Namespace                                                              | From                                                                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `wml-2010.xsd`                         | `http://schemas.microsoft.com/office/word/2010/wordml`                 | [[MS-DOCX] 5.1](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-docx/9704b59f-bc49-4618-ac66-41beb82a0d7f)           |
| `wml-2012.xsd`                         | `http://schemas.microsoft.com/office/word/2012/wordml`                 | [[MS-DOCX] 5.2](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-docx/d416013d-c112-44fa-8bef-7819b8898117)           |
| `wml-symex-2015.xsd`                   | `http://schemas.microsoft.com/office/word/2015/wordml/symex`           | [[MS-DOCX] 5.3](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-docx/372b619f-f0f4-463f-9d59-02ebb1c8956d)           |
| `wml-cid-2016.xsd`                     | `http://schemas.microsoft.com/office/word/2016/wordml/cid`             | [[MS-DOCX] 5.4](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-docx/8e395dbe-ff70-43c3-b9fe-e758c8f69683)           |
| `wml-2018.xsd`                         | `http://schemas.microsoft.com/office/word/2018/wordml`                 | [[MS-DOCX] 5.5](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-docx/6970e332-57ff-4ab5-a9a4-3b8834bbc477)           |
| `wml-cex-2018.xsd`                     | `http://schemas.microsoft.com/office/word/2018/wordml/cex`             | [[MS-DOCX] 5.6](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-docx/0df7c115-b22a-4e09-bab7-4f24fbb8e6f5)           |
| `wml-sdtdatahash-2020.xsd`             | `http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash`     | [[MS-DOCX] 5.7](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-docx/c865ba38-51df-45bc-91ae-f6beaffeb264)           |
| `wml-du-2023.xsd`                      | `http://schemas.microsoft.com/office/word/2023/wordml/word16du`        | [[MS-DOCX] 5.8](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-docx/e5d0aa0c-4ecc-40d9-a0e0-aac8655a8316)           |
| `wml-sdtformatlock-2024.xsd`           | `http://schemas.microsoft.com/office/word/2024/wordml/sdtformatlock`   | [[MS-DOCX] 5.9](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-docx/14bc8126-7c6e-41a8-b042-c199036e2339)           |
| `wml-cei-2026.xsd`                     | `http://schemas.microsoft.com/office/word/2026/wordml/cei`             | [[MS-DOCX] 5.10](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-docx/4c5c0c9a-50e6-4d50-a387-9e5aceecd2f9)          |
| `drawing-2010-main.xsd`                | `http://schemas.microsoft.com/office/drawing/2010/main`                | [[MS-ODRAWXML] 5.1](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/869af0ef-665b-4f28-a596-0917474ede26)   |
| `word-2010-wordprocessingShape.xsd`    | `http://schemas.microsoft.com/office/word/2010/wordprocessingShape`    | [[MS-ODRAWXML] 5.2](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/f73ea06d-4749-4611-b20b-755df087eb21)   |
| `wml-2010-contentPart.xsd`             | `http://schemas.microsoft.com/office/word/2010/wordml`                 | [[MS-ODRAWXML] 5.3](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/20b04a8a-b93e-4ecd-9522-96d4bb1847c8)   |
| `word-2010-wordprocessingGroup.xsd`    | `http://schemas.microsoft.com/office/word/2010/wordprocessingGroup`    | [[MS-ODRAWXML] 5.4](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/fbe733bf-85e2-46f9-b548-9292b44670ce)   |
| `word-2010-wordprocessingCanvas.xsd`   | `http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas`   | [[MS-ODRAWXML] 5.5](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/0af4dfe1-b07b-41eb-a48b-87aadd16b51b)   |
| `drawing-2008-diagram.xsd`             | `http://schemas.microsoft.com/office/drawing/2008/diagram`             | [[MS-ODRAWXML] 5.6](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/e1b56dd5-305b-4b3b-a983-28df1d4ffc3f)   |
| `ink-2010-main.xsd`                    | `http://schemas.microsoft.com/ink/2010/main`                           | [[MS-ODRAWXML] 5.7](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/b0e5b36b-68a8-4fd4-874c-e5e187ba574f)   |
| `drawing-2010-chartDrawing.xsd`        | `http://schemas.microsoft.com/office/drawing/2010/chartDrawing`        | [[MS-ODRAWXML] 5.8](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/53d31d11-3b07-4ca3-ac54-e8562713e647)   |
| `excel-2010-spreadsheetDrawing.xsd`    | `http://schemas.microsoft.com/office/excel/2010/spreadsheetDrawing`    | [[MS-ODRAWXML] 5.9](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/ec810aeb-26c0-4f32-a6a4-59abb9a0398f)   |
| `drawing-2007-8-2-chart.xsd`           | `http://schemas.microsoft.com/office/drawing/2007/8/2/chart`           | [[MS-ODRAWXML] 5.10](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/070bea84-2201-463c-aeaa-cf258492b5b5)  |
| `word-2010-wordprocessingDrawing.xsd`  | `http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing`  | [[MS-ODRAWXML] 5.11](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/1a38a99a-16ae-420d-8c79-23dc2e922717)  |
| `drawing-2010-picture.xsd`             | `http://schemas.microsoft.com/office/drawing/2010/picture`             | [[MS-ODRAWXML] 5.12](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/81dd13dc-144f-4099-bb1f-658ce7b65b6d)  |
| `drawing-2012-chart.xsd`               | `http://schemas.microsoft.com/office/drawing/2012/chart`               | [[MS-ODRAWXML] 5.13](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/1c52d959-25d3-4556-9381-cc86c1221029)  |
| `drawing-2012-main.xsd`                | `http://schemas.microsoft.com/office/drawing/2012/main`                | [[MS-ODRAWXML] 5.14](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/a87e4aa0-8ba3-41f1-a6a3-67c2afcca6b3)  |
| `drawing-2012-chartStyle.xsd`          | `http://schemas.microsoft.com/office/drawing/2012/chartStyle`          | [[MS-ODRAWXML] 5.15](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/a7bb9c01-d274-47ee-a16a-90e26877e8a4)  |
| `drawing-2010-diagram.xsd`             | `http://schemas.microsoft.com/office/drawing/2010/diagram`             | [[MS-ODRAWXML] 5.16](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/6a404d68-14de-4124-b7db-bb48398538ac)  |
| `thememl-2012-main.xsd`                | `http://schemas.microsoft.com/office/thememl/2012/main`                | [[MS-ODRAWXML] 5.17](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/de6e746a-c9e3-48ad-884a-774aac2ad80d)  |
| `word-2012-wordprocessingDrawing.xsd`  | `http://schemas.microsoft.com/office/word/2012/wordprocessingDrawing`  | [[MS-ODRAWXML] 5.18](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/44351d27-cd96-461b-89ae-3be25ed82425)  |
| `drawing-2014-chart.xsd`               | `http://schemas.microsoft.com/office/drawing/2014/chart`               | [[MS-ODRAWXML] 5.20](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/40b8f1fc-b266-4f1f-90ec-d8ae7bafb140)  |
| `drawing-2014-chart-ac.xsd`            | `http://schemas.microsoft.com/office/drawing/2014/chart/ac`            | [[MS-ODRAWXML] 5.21](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/5a2048a5-7116-48a9-95b6-9c7b8e70ff44)  |
| `drawing-2014-chartex.xsd`             | `http://schemas.microsoft.com/office/drawing/2014/chartex`             | [[MS-ODRAWXML] 5.22](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/e2723b0a-9120-42a5-bd11-c252ccb13c1e)  |
| `drawing-2014-main.xsd`                | `http://schemas.microsoft.com/office/drawing/2014/main`                | [[MS-ODRAWXML] 5.23](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/55a2958e-599f-46a0-8812-029155d485cb)  |
| `drawing-2016-SVG-main.xsd`            | `http://schemas.microsoft.com/office/drawing/2016/SVG/main`            | [[MS-ODRAWXML] 5.24](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/cc083f6d-bc38-4ff4-b32a-5bc97df8addc)  |
| `drawing-2016-11-main.xsd`             | `http://schemas.microsoft.com/office/drawing/2016/11/main`             | [[MS-ODRAWXML] 5.25](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/96e8cdeb-7774-461b-957e-09b7ec8e2765)  |
| `drawing-2016-11-diagram.xsd`          | `http://schemas.microsoft.com/office/drawing/2016/11/diagram`          | [[MS-ODRAWXML] 5.26](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/8607d4b7-2dc8-45e7-9317-808373935e47)  |
| `drawing-2013-main-command.xsd`        | `http://schemas.microsoft.com/office/drawing/2013/main/command`        | [[MS-ODRAWXML] 5.27](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/f01549ab-276f-461a-a9be-c672a5393b1a)  |
| `drawing-2016-ink.xsd`                 | `http://schemas.microsoft.com/office/drawing/2016/ink`                 | [[MS-ODRAWXML] 5.28](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/9fb2d49d-0881-4e7d-8b38-95373d76302c)  |
| `drawing-2017-model3d.xsd`             | `http://schemas.microsoft.com/office/drawing/2017/model3d`             | [[MS-ODRAWXML] 5.29](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/6c414e62-4825-4100-9ca1-88fefc5fb699)  |
| `drawing-2016-12-diagram.xsd`          | `http://schemas.microsoft.com/office/drawing/2016/12/diagram`          | [[MS-ODRAWXML] 5.30](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/e2d5dcbc-cb93-40b9-896d-46033bc2711c)  |
| `drawing-2017-03-chart.xsd`            | `http://schemas.microsoft.com/office/drawing/2017/03/chart`            | [[MS-ODRAWXML] 5.31](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/07ad9d54-eb9e-4d52-831e-aa6487b295c2)  |
| `drawing-2017-decorative.xsd`          | `http://schemas.microsoft.com/office/drawing/2017/decorative`          | [[MS-ODRAWXML] 5.32](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/6146d89f-9146-415b-99e2-39e694b5a980)  |
| `drawing-2018-hyperlinkcolor.xsd`      | `http://schemas.microsoft.com/office/drawing/2018/hyperlinkcolor`      | [[MS-ODRAWXML] 5.33](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/014fbc20-3705-4812-b8cd-93f5af05b504)  |
| `drawing-2018-animation-model3d.xsd`   | `http://schemas.microsoft.com/office/drawing/2018/animation/model3d`   | [[MS-ODRAWXML] 5.34](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/c939a613-ae17-423a-9d33-7fb2e07b7b7f)  |
| `drawing-2018-animation.xsd`           | `http://schemas.microsoft.com/office/drawing/2018/animation`           | [[MS-ODRAWXML] 5.35](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/901a7e62-aa4a-48a0-9ecb-cf2401a2b47a)  |
| `drawing-2018-sketchyshapes.xsd`       | `http://schemas.microsoft.com/office/drawing/2018/sketchyshapes`       | [[MS-ODRAWXML] 5.36](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/8d84ecec-8b42-42d7-a51a-ca81862b0dd3)  |
| `drawing-2020-classificationShape.xsd` | `http://schemas.microsoft.com/office/drawing/2020/classificationShape` | [[MS-ODRAWXML] 5.37](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/1f3ad775-d46f-4c60-8457-04121d909fe3)  |
| `word-2020-oembed.xsd`                 | `http://schemas.microsoft.com/office/word/2020/oembed`                 | [[MS-ODRAWXML] 5.38](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/b495a2c4-89bf-47e3-b165-dacb3508bb72)  |
| `drawing-2021-scriptlink.xsd`          | `http://schemas.microsoft.com/office/drawing/2021/scriptlink`          | [[MS-ODRAWXML] 5.39](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/f830ed7e-a16f-4863-9112-711c02e00269)  |
| `drawing-2021-livefeed.xsd`            | `http://schemas.microsoft.com/office/drawing/2021/livefeed`            | [[MS-ODRAWXML] 5.40](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/2084bd49-c84a-4779-b7b6-331902b88dfe)  |
| `drawing-2022-imageformula.xsd`        | `http://schemas.microsoft.com/office/drawing/2022/imageformula`        | [[MS-ODRAWXML] 5.41](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/0c47e53f-d2a7-457d-b7a0-26c7544dd7b2)  |
| `drawing-2015-06-chart.xsd`            | `http://schemas.microsoft.com/office/drawing/2015/06/chart`            | [[MS-ODRAWXML] 5.42](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/4a7a3cd6-1782-4b99-b223-5a811e505d73)  |
| `wml-2006.xsd`                         | `http://schemas.microsoft.com/office/word/2006/wordml`                 | [[MS-OFFMACRO2] 5.1](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-offmacro2/230e441a-0a5b-4c4c-8239-0a446f235101) |

[MS-DOCX]: https://learn.microsoft.com/en-us/openspecs/office_standards/ms-docx/d0a2e301-0ff7-4e9e-9bb7-ff47070dce0a
[MS-ODRAWXML]: https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/bdc95a77-957c-40f8-9ef2-47cbcdeb8af2
[MS-OFFMACRO2]: https://learn.microsoft.com/en-us/openspecs/office_standards/ms-offmacro2/230e441a-0a5b-4c4c-8239-0a446f235101
