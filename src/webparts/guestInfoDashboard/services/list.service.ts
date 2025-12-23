// import { spfi } from "@pnp/sp";
import { IItems } from "@pnp/sp/items";
// import { Caching } from "@pnp/queryable";
import { IFieldInfo } from "@pnp/sp/fields";
import "@pnp/sp/profiles";
import "@pnp/sp/webs";
import "@pnp/sp/site-users";
import { getSP } from "../pnpjsConfig";
import { IOrder } from "../models/IOrder";

import { AsyncPager } from "./async-pager";

const getPagesCount = async (
    request: IItems,
    pageSize: number
): Promise<number> => {
    let itemsCount = 0;

    for await (const items of request) {
        itemsCount += items.length;
    }

    return Math.ceil(itemsCount / pageSize);
};

export const getPager = async <T>(
    listId: string,
    pageSize: number,
    fields: IFieldInfo[],
    orderBy?: IOrder,
    query?: string
): Promise<{ pagerInstance: AsyncPager<T[]>; pagesCount: number }> => {
    const sp = getSP();
    // const spCache = spfi(sp).using(Caching({ store: "session" }));

    const SKIP_FIELDS = ["ApplicantName", "ApplicantDepartment", "GuestStatus", "RequestDate"];

    const expandableFields = fields
        .filter((f) => f.TypeAsString === "User" || f.TypeAsString === "Lookup")
        .map((f) => f.EntityPropertyName);

    // const selectableColumns = fields.map((f) =>
    //     expandableFields.includes(f.EntityPropertyName)
    //         ? `${f.EntityPropertyName}/Title`
    //         : f.EntityPropertyName
    // );

    const selectableColumns = fields
        .filter((f) => !SKIP_FIELDS.includes(f.EntityPropertyName))
        .map((f) =>
            expandableFields.includes(f.EntityPropertyName)
                ? `${f.EntityPropertyName}/Title`
                : f.EntityPropertyName
        );

    const expandableColumns = fields
        .filter((f) => expandableFields.includes(f.EntityPropertyName))
        .map((f) => f.EntityPropertyName);

    // const request = spCache.web.lists
    const request = sp.web.lists
        .getById(listId)
        .items.select(...Array.from(new Set(["Id", ...selectableColumns])))
        .expand(...expandableColumns)
        .top(pageSize);

    if (orderBy?.column && orderBy?.order) {
        request.orderBy(orderBy.column, orderBy.order === "asc");
    }

    request.filter(query || "");

    const pagesCount = await getPagesCount(request, pageSize);

    const pagerInstance = new AsyncPager<T[]>(request);
    return { pagerInstance, pagesCount };
};

export const getListFields = async (listId: string): Promise<IFieldInfo[]> => {
    const sp = getSP();
    // const spCache = spfi(sp).using(Caching({ store: "session" }));

    // const fields = await spCache.web.lists.getById(listId).fields();
    const fields = await sp.web.lists.getById(listId).fields();

    return fields;
};

export const deleteListItems = async (
    listId: string,
    itemIds: number[]
): Promise<void> => {
    const sp = getSP();
    // const spCache = spfi(sp).using(Caching({ store: "session" }));

    // const list = spCache.web.lists.getById(listId);
    const list = sp.web.lists.getById(listId);

    const promises = itemIds.map((id) => list.items.getById(id).delete());

    await Promise.all(promises);
};
export const getCurrentUserProfile = async (): Promise<{ name: string, pictureUrl: string }> => {
    const sp = getSP();
    // const spCache = spfi(sp).using(Caching({ store: "session" }));

    // const currentUser = await spCache.web.currentUser();
    // const profileProps = await spCache.profiles.myProperties();
    const currentUser = await sp.web.currentUser();
    const profileProps = await sp.profiles.myProperties();

    const userProfileProps = profileProps?.UserProfileProperties?.reduce((acc: { [x: string]: any; }, prop: { Key: string | number; Value: any; }) => {
        acc[prop.Key] = prop.Value;
        return acc;
    }, {} as { [key: string]: string });

    return {
        name: currentUser?.Title,
        pictureUrl: userProfileProps?.PictureURL
    };
};

/**
 * Gets the list of groups names that the current user is a member of.
 * @returns The list of group names the current user is a member of.
 */
export const getCurrentUserGroups = async (): Promise<string[]> => {
    const sp = getSP();
    const groups = await sp.web.currentUser.groups();
    const groupsTitles = groups.map((g: { Title: any; }) => g.Title);

    return groupsTitles;
}

export const getCurrentUserInfo = async (): Promise<{
    email: string;
    title: string;
    loginName: string;
}> => {
    const sp = getSP();
    const user = await sp.web.currentUser();

    return {
        email: user.Email,
        title: user.Title,
        loginName: user.LoginName,
    };
};

// Check if current user is listed as Manager in any item of the list
export const isCurrentUserManager = async (listID: string): Promise<boolean> => {
    const sp = getSP();
    const user = await sp.web.currentUser();
    const userEmail = user.Email;

    //    const directManagerFilter = `(RecruiterManager/EMail eq '${email}' and StepOrder eq 1)`

    try {
        const items = await sp.web.lists
            .getById(listID)
            .items.filter(`RecruiterManager/EMail eq '${userEmail}'`)
            .top(1)(); // We only need to check if at least one item matches

        return items?.length > 0;
    } catch (error) {
        console.error("Error checking if current user is Manager:", error);
        return false;
    }
};


/**
 * Get Guest Info list items filtered by ParentID list
 * @param listId list Guid
 * @param parentIds array of parent IDs
 * @returns filtered guest info items
 */
export const getGuestRequestListItems = async (listId: string, parentIds: number[]): Promise<any[]> => {
    const sp = getSP();

    if (!parentIds || parentIds.length === 0) return [];

    // Build dynamic OR filter
    const filterQuery = parentIds?.map(id => `ID eq ${id}`).join(" or ");

    try {
        const items = await sp.web.lists
            .getById(listId)
            .items
            .select("Id", "Title", "ApplicantsName/Title", "ApplicantsDepartment", "Status", "ApplicationDate")
            .expand("ApplicantsName")
            .filter(filterQuery)();

        return items;
    } catch (error) {
        console.error("Error fetching Guest Info filtered items:", error);
        return [];
    }
};


/**
 * Get Guest Info list items filtered by Status value
 * @param listId list Guid
 * @param status status string value
 * @returns filtered guest info items
 */
export const getRequestListDataBasedOnStatusValue = async (
    listId: string,
    status: string
): Promise<any[]> => {

     // If selected dropdown = "All Status" → return custom object instead of calling API
    if (status === "All Status") {
        return [{ isSelectedStatusIsAll: true }];
    }

    const sp = getSP();

    try {
        // If blank status passed → return ALL items
        const filterQuery = status && status.trim() !== ""
            ? `Status eq '${status}'`
            : "";

        const items = await sp.web.lists
            .getById(listId)
            .items
            .select(
                "Id",
                "Title",
                "ApplicantsName/Title",
                "ApplicantsDepartment",
                "Status",
                "ApplicationDate"
            )
            .expand("ApplicantsName")
            .filter(filterQuery)();

        return items;

    } catch (error) {
        console.error("Error fetching Guest Info items by status:", error);
        return [];
    }
};



// this is the column -ApplicationDate
// i was pass the from and to date and list id 
// get the record between that date range aslo add that from and to date 
// create the function here 
/**
 * Get Guest Info list items filtered by Date Range
 * @param listId list Guid
 * @param fromDate starting date
 * @param toDate ending date
 * @returns filtered guest info items
 */
export const getRequestListDataBasedOnDateRangeValue = async (
    listId: string,
    fromDate: Date | null,
    toDate: Date | null
): Promise<any[]> => {

    const sp = getSP();

    try {

        // If no date selected → return all items
        if (!fromDate && !toDate) {
            const allItems = await sp.web.lists
                .getById(listId)
                .items
                .select(
                    "Id",
                    "Title",
                    "ApplicantsName/Title",
                    "ApplicantsDepartment",
                    "Status",
                    "ApplicationDate"
                )
                .expand("ApplicantsName")();
            return allItems;
        }

        // Convert dates to ISO format for SharePoint filter
        const from = fromDate ? new Date(fromDate).toISOString() : null;
        const to = toDate
            ? new Date(new Date(toDate).setHours(23, 59, 59, 999)).toISOString()
            : null;

        // Build dynamic filter string
        let filterQuery = "";

        if (from && to) {
            filterQuery = `ApplicationDate ge datetime'${from}' and ApplicationDate le datetime'${to}'`;
        } else if (from) {
            filterQuery = `ApplicationDate ge datetime'${from}'`;
        } else if (to) {
            filterQuery = `ApplicationDate le datetime'${to}'`;
        }

        const items = await sp.web.lists
            .getById(listId)
            .items
            .select(
                "Id",
                "Title",
                "ApplicantsName/Title",
                "ApplicantsDepartment",
                "Status",
                "ApplicationDate"
            )
            .expand("ApplicantsName")
            .filter(filterQuery)();

        return items;

    } catch (error) {
        console.error("Error fetching items by date range:", error);
        return [];
    }
};
