import { IFieldInfo } from "@pnp/sp/fields";

import { IBaseListItem } from "../models/IBaseListItem";

export const useExportCsv = (
    fields: IFieldInfo[],
    data: IBaseListItem[]
): { onExportCsv: () => void } => {
    const onExportCsv = (): void => {
        const preparedData = data.map((row) => {
            const newRow: { [k: string]: string | number | boolean } = {};
            fields.forEach((field) => {
                newRow[field.EntityPropertyName] =
                    typeof row[
                        field.EntityPropertyName as keyof IBaseListItem
                    ] === "object"
                        ? ((
                            row[
                            field.EntityPropertyName as keyof IBaseListItem
                            ] as {
                                [k: string]: string;
                            }
                        )?.Title as string)
                        : (row[
                            field.EntityPropertyName as keyof IBaseListItem
                        ] as string);
            });
            return newRow;
        });
        const csv = [
            fields.map((f) => f.Title).join(","),
            ...preparedData.map((row) => Object.values(row).join(",")),
        ].join("\n");
        // const blob = new Blob([csv], { type: "text/csv; charset=utf-8;" });
        const BOM = "\uFEFF"; // UTF-8 BOM
        const blob = new Blob([BOM + csv], {
            type: "text/csv;charset=utf-8;"
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "data.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return { onExportCsv };
};
