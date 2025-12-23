import { getSP } from "./getSP";
import "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/site-users/web";
import { IFieldInfo } from "@pnp/sp/fields";

/**
 * Get list items by List ID
 */
// export const getItemsByListId = async (
//     listId: string,
//     select: string[], context: any, mainListId:string,
//     top: number = 5000
// ): Promise<any[]> => {

//     const _sp = getSP(context);

//     try {
//         return await _sp.web.lists
//             .getById(listId)
//             .items
//             .select(...select)
//             .top(top)();
//     } catch (error) {
//         console.error("Error fetching list items:", error);
//         return [];
//     }
// };
export const getItemsByListId = async (
    listId: string,                 // Child list
    select: string[],               // Child list select
    context: any,
    mainListId: string,             // Parent/Main list
    mainListSelect: string[] = ["Id", "ApplicantsDepartment"],
    top: number = 5000
): Promise<any[]> => {

    const _sp = getSP(context);

    try {
        // 1️⃣ Get main list items
        const mainListItems = await _sp.web.lists
            .getById(mainListId)
            .items
            .select(...mainListSelect)
            .top(top)();

        // Create lookup map: Id -> ApplicantDept
        const mainListMap = new Map<number, string>();
        mainListItems.forEach(item => {
            mainListMap.set(item.Id, item.ApplicantsDepartment);
        });

        // 2️⃣ Get child list items
        const childItems = await _sp.web.lists
            .getById(listId)
            .items
            .select(...select, "ParentID")
            .top(top)();

        // 3️⃣ Merge department from main list
        const result = childItems.map(child => ({
            ...child,
            Department: mainListMap.get(child.ParentID) || ""
        }));

        return result;

    } catch (error) {
        console.error("Error fetching list items:", error);
        return [];
    }
};


/**
 * Bulk delete items by List ID
 */
export const deleteItemsByListId = async (
    listId: string, context: any,
    ids: number[]
): Promise<void> => {

    const _sp = getSP(context);

    try {
        await Promise.all(
            ids.map(id =>
                _sp.web.lists.getById(listId).items.getById(id).delete()
            )
        );
    } catch (error) {
        console.error("Error deleting list items:", error);
        throw error;
    }
};

/**
 * Check if current user has delete permission
 */
export const canUserDeleteItems = async (): Promise<boolean> => {
    const _sp = getSP();

    try {
        const perms = await _sp.web.currentUser();
        return !!perms;
    } catch (error) {
        console.error("Error checking user permissions:", error);
        return false;
    }
};


export const getListColumns = async (listId: string, context: any): Promise<any[]> => {
    const _sp = getSP(context);

    try {
        const fields: IFieldInfo[] = await _sp.web.lists
            .getById(listId)
            .fields
            .filter("Hidden eq false")
            .select("Title", "InternalName", "TypeAsString")();

        return fields.map(f => ({
            key: f.InternalName,
            text: f.Title,
            type: f.TypeAsString
        }));
    } catch (err) {
        console.error("Error loading columns", err);
        return [];
    }
};


export const updateItemsStatusByListId = async (
    context: any,
    listId: string,
    itemIds: number[],
    statusValue: string,
    cacheList: string,Dept:string
): Promise<void> => {

    if (!itemIds || itemIds.length === 0) return;

    const sp = getSP(context);

    for (const id of itemIds) {
        await sp.web.lists
            .getById(listId)
            .items
            .getById(id)
            .update({
                Status: statusValue
            });
    }

    await sp.web.lists
        .getById(cacheList)
        .items
        .add({
            IDs: itemIds.toString(),Department:Dept
        });

};

export const getDepartmentForCurrentUser = async (
  context: any,
  departmentListId: string
): Promise<string> => {
  const sp = getSP(context);

  try {
    // Get current user
    const currentUser = await sp.web.currentUser();
    const userId = currentUser.Id;

    // Get all department items with Manager column
    const items = await sp.web.lists
      .getById(departmentListId)
      .items.select("Title", "Manager/Id")
      .expand("Manager")();

    // Check if current user is in Manager column (multi-people)
    const deptItem = items.find(item => 
      item.Manager?.some((mgr: any) => mgr.Id === userId)
    );

    return deptItem ? deptItem.Title : "NoDept";

  } catch (error) {
    console.error("Error fetching department:", error);
    return "NoDept";
  }
};
