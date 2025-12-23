import * as React from "react";
import { IFieldInfo } from "@pnp/sp/fields";
import { getListFields } from "../services/list.service";


export const useFields = (
    listId: string,
    listColumns: string[]
): { fields: IFieldInfo[] } => {
    const [fields, setFields] = React.useState<IFieldInfo[]>([]);

    React.useEffect(() => {
        const getFields = async (): Promise<void> => {
            const spFields = await getListFields(listId);

            let selectedFields = listColumns
                .map((column) =>
                    spFields.find((f) => f.EntityPropertyName === column)
                )
                .filter((c) => c !== undefined) as IFieldInfo[];

            // Add custom static field manually
            selectedFields.push({
                EntityPropertyName: "NumberofGuestsinform",
                InternalName: "NumberofGuestsinform",
                Title: "Number of Guests in form",
                TypeAsString: "Number",
                Filterable: false,
                Sortable: false
            } as unknown as IFieldInfo); // Force type safety

            setFields(selectedFields);
        };

        if (listId && listColumns?.length > 0) {
            getFields();
        }
    }, [listId, listColumns]);

    return { fields };
};














// export const useFields = (
//     listId: string,
//     listColumns: string[]
// ): { fields: IFieldInfo[] } => {
//     const [fields, setFields] = React.useState<IFieldInfo[]>([]);

//     React.useEffect(() => {
//         const getFields = async (): Promise<void> => {
//             const fields = await getListFields(listId);

//             setFields(
//                 listColumns
//                     .map((column) =>
//                         fields.find((f) => f.EntityPropertyName === column)
//                     )
//                     .filter((c) => c !== undefined) as IFieldInfo[]
//             );
//         };

//         if (listId && listColumns?.length > 0) {
//             getFields();
//         }
//     }, [listId, listColumns]);

//     return { fields };
// };
