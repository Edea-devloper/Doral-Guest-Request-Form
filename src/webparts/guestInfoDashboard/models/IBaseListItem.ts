export interface IBaseListItem {
    [p: string]: string | boolean | number | { [k: string]: string };
    isSelected: boolean;
}
