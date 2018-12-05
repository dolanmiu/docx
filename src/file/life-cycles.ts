export interface IOnCompile {
    readonly onCompile: () => void;
}

// Needed because of: https://github.com/s-panferov/awesome-typescript-loader/issues/432
/**
 * @ignore
 */
export const WORKAROUND4 = "";
