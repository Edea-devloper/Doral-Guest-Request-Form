import * as React from "react";
import { IFieldInfo } from "@pnp/sp/fields";

import { IOrder } from "../../../../models/IOrder";
import { IBaseListItem } from "../../../../models/IBaseListItem";

import { Filter } from "../Filter/Filter";

interface ITableHeadProps {
    orderBy?: IOrder;
    fields: IFieldInfo[];
    data: IBaseListItem[];
    filteredColumns: string[];
    setOrderBy: (order: IOrder) => void;
    onSelectAllItems: (selected: boolean) => void;
    onApplyFilter: (column: string, values: string[], wipe?: boolean) => void;
    primaryColor: any;
}

export const TableHead = ({
    data,
    fields,
    orderBy,
    filteredColumns,
    setOrderBy,
    onApplyFilter,
    onSelectAllItems,
    primaryColor
}: ITableHeadProps): JSX.Element => {
    const [isAllItemsSelected, setIsAllItemsSelected] =
        React.useState<boolean>(false);

    const handleSelectAllItems = (): void => {
        onSelectAllItems(!isAllItemsSelected);
        setIsAllItemsSelected(!isAllItemsSelected);
    };

    const handleColumnClick = (column: string): void => {
        setOrderBy({
            column,
            order: orderBy?.order === "asc" ? "desc" : "asc",
        });
    };

    return (
        <thead>
            <tr>
                <th>
                    <div className="check_minus">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            checked={isAllItemsSelected}
                            onClick={handleSelectAllItems}
                        />
                    </div>
                </th>
                <th>

                </th>
                {fields.map((field) => (
                    <th key={field.InternalName}>
                        <span
                            onClick={() =>
                                handleColumnClick(field.EntityPropertyName)
                            }
                        >
                            {field.Title}
                        </span>
                        {orderBy?.order === "asc" &&
                            orderBy?.column === field.EntityPropertyName && (
                                <img
                                    src={require("../../../../images/arrow-down.svg")}
                                    alt=""
                                />
                            )}
                        {orderBy?.order === "desc" &&
                            orderBy?.column === field.EntityPropertyName && (
                                <img
                                    alt=""
                                    style={{ transform: "rotate(180deg)" }}
                                    src={require("../../../../images/arrow-down.svg")}
                                />
                            )}
                        {field.Filterable && (
                            <Filter
                                isActive={filteredColumns.includes(
                                    field.EntityPropertyName
                                )}
                                columnName={field.EntityPropertyName}
                                fieldType={field.TypeAsString}
                                values={Array.from(
                                    new Set(
                                        data
                                            ?.map((item:any) => {
                                                if (field.TypeAsString === "User") {
                                                   
                                                    return item[field.EntityPropertyName] ? item[field.EntityPropertyName].Title as string : "";
                                                }
                                                // else if(field.TypeAsString === "DateTime"){
                                                //     return item[field.EntityPropertyName]?new Date(item[field.EntityPropertyName] as string).toLocaleDateString('en-GB') :""
                                                // }
                                                return item[field.EntityPropertyName as keyof IBaseListItem] as string;
                                            })
                                            .filter((item) => item)
                                    )
                                )}
                                onApplyFilter={onApplyFilter}
                                primaryColor={primaryColor}
                            />
                        )}
                    </th>
                ))}
            </tr>
        </thead>
    );
};
