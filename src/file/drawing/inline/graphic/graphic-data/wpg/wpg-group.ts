import type { IMediaDataTransformation } from "@file/media";
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import { Form } from "../pic/shape-properties/form";

export type GroupChild = XmlComponent;

export type WpgGroupCoreOptions = {
    readonly children: readonly GroupChild[];
};

export type WpgGroupOptions = WpgGroupCoreOptions & {
    readonly transformation: IMediaDataTransformation;
};

const createGroupProperties = (transform: IMediaDataTransformation): XmlComponent =>
    new BuilderElement({
        name: "wpg:grpSpPr",
        children: [new Form(transform)],
    });

const createNonVisualGroupProperties = (): XmlComponent =>
    new BuilderElement({
        name: "wpg:cNvGrpSpPr",
    });

export const createWpgGroup = (options: WpgGroupOptions): XmlComponent =>
    new BuilderElement({
        name: "wpg:wgp",
        children: [createNonVisualGroupProperties(), createGroupProperties(options.transformation), ...options.children],
    });
