import { IMediaDataTransformation } from "@file/media";
import { XmlComponent } from "@file/xml-components";

import { Pic } from "../pic";
import { Form } from "../pic/shape-properties/form";
import { WpsShape } from "../wps/wps-shape";

export type GroupChild = WpsShape | Pic;

export type WpgGroupCoreOptions = {
    readonly children: readonly GroupChild[];
    // readonly nonVisualProperties?: INonVisualShapePropertiesOptions;
    // readonly bodyProperties?: IBodyPropertiesOptions;
};

export type WpgGroupOptions = WpgGroupCoreOptions & {
    readonly transformation: IMediaDataTransformation;
};

export class GroupProperties extends XmlComponent {
    private readonly form: Form;

    public constructor({ transform }: { readonly transform: IMediaDataTransformation }) {
        super(`wpg:grpSpPr`);

        this.form = new Form(transform);
        this.root.push(this.form);
    }
}

export class NonVisualGroupProperties extends XmlComponent {
    public constructor() {
        super("wpg:cNvGrpSpPr");
    }
}

export class WpgGroup extends XmlComponent {
    public constructor(options: WpgGroupOptions) {
        super("wpg:wgp");

        this.root.push(new NonVisualGroupProperties());
        this.root.push(
            new GroupProperties({
                transform: options.transformation,
            }),
        );
        this.root.push(...options.children);
    }
}
