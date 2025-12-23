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
    const SKIP_FIELDS = ["NumberofGuestsinform"];
    // const spCache = spfi(sp).using(Caching({ store: "session" }));

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
export const getGuestInfoListItems = async (listId: string, parentIds: number[]): Promise<any[]> => {
    const sp = getSP();

    if (!parentIds || parentIds.length === 0) return [];

    // Build dynamic OR filter
    const filterQuery = parentIds?.map(id => `ParentID eq ${id}`).join(" or ");

    try {
        const items = await sp.web.lists
            .getById(listId)
            .items
            .select("Id", "Title", "ParentID")
            .filter(filterQuery)(); // apply dynamic filter

        return items;
    } catch (error) {
        console.error("Error fetching Guest Info filtered items:", error);
        return [];
    }
};

