export interface IPacker {
    pack(path: string): void;
}

// Needed because of: https://github.com/s-panferov/awesome-typescript-loader/issues/432
export const WORKAROUND = "";
