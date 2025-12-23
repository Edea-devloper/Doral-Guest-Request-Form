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

            // Add Custom Virtual Fields (Not in SharePoint list)
            const customFields: IFieldInfo[] = [
                {
                    EntityPropertyName: "ApplicantName",
                    InternalName: "ApplicantName",
                    Title: "Applicant Name",
                    TypeAsString: "Text",
                    Filterable: false,
                    Sortable: false
                } as unknown as IFieldInfo,
                {
                    EntityPropertyName: "ApplicantDepartment",
                    InternalName: "ApplicantDepartment",
                    Title: "Applicant Department",
                    TypeAsString: "Text",
                    Filterable: false,
                    Sortable: false
                } as unknown as IFieldInfo,
                {
                    EntityPropertyName: "GuestStatus",
                    InternalName: "GuestStatus",
                    Title: "Status of the Guest",
                    TypeAsString: "Text",
                    Filterable: false,
                    Sortable: false
                } as unknown as IFieldInfo,
                {
                    EntityPropertyName: "RequestDate",
                    InternalName: "RequestDate",
                    Title: "Request Date",
                    TypeAsString: "DateTime",
                    Filterable: false,
                    Sortable: false
                } as unknown as IFieldInfo
            ];

            selectedFields.push(...customFields);

            setFields(selectedFields);
        };

        if (listId && listColumns?.length > 0) {
            getFields();
        }
    }, [listId, listColumns]);

    return { fields };
};
















// import * as React from "react";
// import { IFieldInfo } from "@pnp/sp/fields";

// import { getListFields } from "../services/list.service";

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
