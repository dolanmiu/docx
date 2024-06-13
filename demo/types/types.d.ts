import { CustomElement, CustomText } from "./custom-type";

declare module "slate" {
    interface CustomTypes {
        Element: CustomElement;
        Text: CustomText;
    }
}
