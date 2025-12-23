import * as React from "react";
import { IFieldInfo } from "@pnp/sp/fields";

import { IStatus } from "../../../../models/IStatus";
import { IBaseListItem } from "../../../../models/IBaseListItem";

interface ITableBodyProps {
    statuses: IStatus[];
    fields: IFieldInfo[];
    data: IBaseListItem[];
    statusFieldName: string;
    onSelectItem: (item: IBaseListItem) => void;
    detailsFormUrl: string;
}

export const TableBody = ({
    data,
    fields,
    statuses,
    statusFieldName,
    onSelectItem,
    detailsFormUrl,
}: ITableBodyProps): JSX.Element => {
    const onRenderItem = (
        item: IBaseListItem,
        field: IFieldInfo
    ): JSX.Element => {
        if (statusFieldName === field.EntityPropertyName) {
            const rawStatus = item[
                field.EntityPropertyName as keyof IBaseListItem
            ] as string;
            const statusValue = rawStatus?.toLowerCase();

            // find from statuses array (your existing logic)
            const customStatus = statuses?.find(
                (s) => s.value?.toLowerCase() === statusValue
            );

            // default colors
            let background = customStatus?.color ?? "transparent";
            let color = "black";

            // apply fixed mapping if field = status
            if (statusValue === "completed") {
                background = "green";
                color = "white";
            } else if (statusValue === "in progress") {
                background = "yellow";
                color = "black";
            } else if (statusValue === "not yet completed") {
                background = "red";
                color = "white";
            } else if (statusValue === "not yet started") {
                background = "gray";
                color = "white";
            }

            return (
                <p
                    className="status_field"
                    style={{
                        background,
                        color,
                        borderRadius: "15px",
                        fontWeight: 500,
                        marginLeft: "12px",
                    }}
                >
                    {customStatus?.label ?? rawStatus}
                </p>
            );
        } else if (field.TypeAsString === "DateTime") {
            return (
                <p>
                    {item[field.EntityPropertyName]
                        ? new Date(
                            item[field.EntityPropertyName] as string
                        ).toLocaleDateString("en-GB")
                        : ""}
                </p>
            );
        } else if (field.TypeAsString === "User") {
            return (
                <p>
                    {
                        (
                            item[field.EntityPropertyName as keyof IBaseListItem] as {
                                [k: string]: string;
                            }
                        )?.Title
                    }
                </p>
            );
        } else if (field.InternalName === "NumberOfGuestsInForm") {
            return <p>{item.NumberOfGuestsInForm ?? 0}</p>;
        }
        else {
            return (
                <p>
                    {typeof item[field.EntityPropertyName as keyof IBaseListItem] ===
                        "object"
                        ? (
                            item[field.EntityPropertyName as keyof IBaseListItem] as {
                                [k: string]: string;
                            }
                        )?.Title
                        : item[field.EntityPropertyName as keyof IBaseListItem]}
                </p>
            );
        }
    };

    return (
        <tbody>
            {data.map((item) => (
                <tr key={item.Id as number}>
                    <td>
                        <div className="check_box">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                onClick={() => {
                                    onSelectItem(item);
                                }}
                                checked={item?.selected as boolean}
                            />
                        </div>
                    </td>
                    <td>
                        <a
                            className="item-link"
                            href={`${detailsFormUrl}?formId=${item.ID}`}
                            target="_blank"
                            data-interception="off"
                            rel="noopener noreferrer"
                        >
                            <div className="item-link-image" />
                        </a>
                    </td>
                    {fields.map((field) => (
                        <td key={field.InternalName}>{onRenderItem(item, field)}</td>
                    ))}
                </tr>
            ))}
        </tbody>
    );
};
