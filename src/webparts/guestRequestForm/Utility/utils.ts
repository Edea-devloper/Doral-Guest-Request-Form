import { getSP } from "./getSP";
import "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/fields";
import "@pnp/sp/items";
import "@pnp/sp/attachments";
import "@pnp/sp/site-users/web";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/site-groups"
import { IFieldInfo } from '@pnp/sp/fields';
// import { IItem } from "@pnp/sp/items";

export const getListColumns = async (selectedList: string): Promise<any> => {
  const _sp = getSP();

  try {
    const fields: IFieldInfo[] = await _sp.web.lists.getById(selectedList).fields
      .filter("Hidden eq false and ReadOnlyField eq false")
      .select("Title", "InternalName", "TypeAsString", "Choices")();

    return fields.map(field => ({
      key: field.InternalName,
      text: field.Title,
      Coltype: field.TypeAsString,
      options: (field.TypeAsString === "Choice" || field.TypeAsString === "MultiChoice") ? field.Choices : []
    }));
  } catch (error) {
    console.error('Error fetching list columns:', error);
    return [];
  }
};


export const saveListItem = async (
  listId: string,
  formData: any,
  stepOrder: number,
  ApprovalConfig: any,
  itemId?: number
): Promise<any> => {
  const _sp = getSP();

  let statusValue = "";

  switch (stepOrder) {
    case 1:
      statusValue = "Draft";
      break;
    case 2:
      statusValue = "Pending CIO Approval";
      break;
    case 3:
      statusValue = "Pending IT Approval";
      break;
    case 4:
      statusValue = "Done";
      break;
    case -1:
      statusValue = "Rejected";
      break;
    default:
      statusValue = "Unknown";
  }

  try {
    console.log("Saving to SharePoint:", formData);

    const cleanedData: Record<string, any> = {};

    for (const [key, value] of Object.entries(formData)) {
      // Skip undefined or null
      if (value === undefined || value === null) continue;

      // Handle Person/Lookup fields that contain an object
      if (typeof value === "object" && value !== null) {
        const val: any = value as any;

        // If it has an Id (User or Lookup field)
        if (val.Id) {
          cleanedData[key + "Id"] = val.Id;
          continue;
        }

        // If it only has EMail, SharePoint expects an Id — skip
        if (val.EMail && !val.Id) continue;
      }

      // Normal fields
      cleanedData[key] = value;
    }


    let result;

    if (itemId) {
      // Update existing item

      result = await _sp.web.lists.getById(listId).items.getById(itemId).update({ ...cleanedData, StepOrder: stepOrder, ApprovalConfig: ApprovalConfig, Status:statusValue });

      return { success: true, action: "update", id: itemId, result };
    } else {
      // Add new item
      result = await _sp.web.lists.getById(listId).items.add({ ...cleanedData, StepOrder: stepOrder, ApprovalConfig: ApprovalConfig, Status:statusValue });

      return { success: true, action: "add", id: result.data?.ID, result };
    }
  } catch (error) {
    console.error("Error saving item:", error);
    return { success: false, error };
  }
};

export const getListItemById = async (listId: string, itemId: number) => {
  try {
    const sp = getSP();

    // Fetch item with expanded user fields
    const item = await sp.web.lists
      .getById(listId)
      .items.getById(itemId)
      .select(
        "*,Author/Id,Author/Title,Editor/Id,Editor/Title,ApplicantsName/Id,ApplicantsName/Title,ApplicantsName/EMail"
      )
      .expand("Author,Editor,ApplicantsName")();

    // Get all list fields to detect which are manually created
    const fields = await sp.web.lists
      .getById(listId)
      .fields.filter("Hidden eq false and ReadOnlyField eq false")
      .select("InternalName,TypeAsString")();

    // Build whitelist of manually created field names
    const manualFieldNames = fields.map((f: any) => f.InternalName.toLowerCase());

    // Add required default fields
    manualFieldNames.push("id", "created");

    // Clean item and include user field email
    const cleanedItem: Record<string, any> = {};

    for (const [key, value] of Object.entries(item as Record<string, any>)) {
      const keyLower = key.toLowerCase();

      // Skip OData or system metadata
      if (keyLower.startsWith("odata.")) continue;

      // Skip internal system links
      if (typeof value === "string" && value.toLowerCase().startsWith("web/lists(guid'")) continue;

      // ✅ If it's a user field, keep email & title info
      if (typeof value === "object" && value !== null && "EMail" in value && "Id" in value) {
        cleanedItem[key] = {
          Id: value.Id,
          Title: value.Title,
          EMail: value.EMail
        };
        continue;
      }

      // ✅ Only include manually created + Id + Created
      if (manualFieldNames.includes(keyLower)) {
        cleanedItem[key] = value;
      }
    }

    return cleanedItem;
  } catch (error) {
    console.error(`Error fetching item ${itemId} from list ${listId}:`, error);
    throw error;
  }
};

// ✅ Get Guest Info items for specific parent form
export const getGuestInfoItems = async (listId: string, parentFormId: number) => {
  const sp = getSP();
  try {
    const items = await sp.web.lists
      .getById(listId)
      .items.filter(`ParentID eq ${parentFormId}`)();

    return items || [];
  } catch (error) {
    console.error("Error fetching guest info items:", error);
    return [];
  }
};

// // ✅ Save or update main list item
// export const saveListItem = async (listId: string, formData: any) => {
//   const sp = getSP();
//   try {
//     let result: any;
//     if (formData.ID) {
//       // Update existing item
//       await sp.web.lists.getById(listId).items.getById(formData.ID).update(formData);
//       result = { success: true, action: "update", id: formData.ID };
//     } else {
//       // Add new item
//       const added = await sp.web.lists.getById(listId).items.add(formData);
//       result = { success: true, action: "add", id: added.data.ID };
//     }
//     return result;
//   } catch (error) {
//     console.error("Error saving item:", error);
//     return { success: false, error };
//   }
// };

// ✅ Save Guest Info Rows (create/update)
export const saveGuestInfoItems = async (
  listId: string,
  parentFormId: number,
  guestRows: any[]
) => {
  const sp = getSP();
  const results: any[] = [];

  for (const row of guestRows) {
    try {
      const payload = { ...row, ParentID: parentFormId };

      if (row.ID) {
        // Update
        await sp.web.lists.getById(listId).items.getById(row.ID).update(payload);
        results.push({ id: row.ID, action: "updated" });
      } else {
        // Add
        const added = await sp.web.lists.getById(listId).items.add(payload);
        results.push({ id: added.data.ID, action: "added" });
      }
    } catch (error) {
      console.error("Error saving guest row:", row, error);
    }
  }

  return results;
};

// ✅ Delete Guest Info Items by ID array
export const deleteGuestInfoItems = async (listId: string, deleteIds: number[]) => {
  const sp = getSP();
  for (const id of deleteIds) {
    try {
      await sp.web.lists.getById(listId).items.getById(id).delete();
      console.log(`Deleted guest item ID ${id}`);
    } catch (error) {
      console.error(`Error deleting guest item ID ${id}:`, error);
    }
  }
};

export const getNextListItemId = async (listId: string): Promise<number> => {
  try {
    const sp = getSP();

    // ✅ Get latest item by ID in descending order
    const items = await sp.web.lists
      .getById(listId)
      .items
      .select("ID")
      .orderBy("ID", false) // descending
      .top(1)();

    if (items && items.length > 0) {
      const lastId = items[0].ID;
      return lastId + 1;
    }

    // If no items found, start from 1
    return 1;

  } catch (error) {
    console.error("Error fetching next list item ID:", error);
    return 1; // fallback default
  }
};

export const getUserDepartment = async (
  siteUrl: string,
  listName: string,
  emailColumn: string,
  departmentColumn: string,
  userEmail?: string
): Promise<string | null> => {
  try {
    // ✅ If user email not provided, get current user's email
    if (!userEmail) {
      const currentUserResp = await fetch(
        `${siteUrl}/_api/web/currentuser`,
        { headers: { Accept: "application/json;odata=nometadata" } }
      );

      if (!currentUserResp.ok) throw new Error("Failed to get current user");
      const currentUser = await currentUserResp.json();
      userEmail = currentUser?.Email;
    }

    if (!userEmail) throw new Error("User email not found");

    // ✅ Encode list name properly
    const encodedListName = encodeURIComponent(listName);

    // ✅ Build REST API URL
    const apiUrl = `${siteUrl}/_api/web/lists/getbytitle('${encodedListName}')/items?$select=${departmentColumn}&$filter=${emailColumn} eq '${userEmail}'&$top=1`;

    // ✅ Fetch data from SharePoint REST API
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json;odata=nometadata",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // ✅ Return department if found
    if (data.value && data.value.length > 0) {
      const department = data.value[0][departmentColumn];
      console.log(`✅ Department for ${userEmail}:`, department);
      return department || null;
    }

    console.warn(`⚠️ No department found for ${userEmail}`);
    return null;
  } catch (error) {
    console.error("❌ Error fetching department:", error);
    return null;
  }
};

export const getUserIdByEmail = async (email: string): Promise<number | null> => {
  const _sp = getSP();
  try {
    if (!email) {
      console.warn("⚠️ No email provided for getUserIdByEmail");
      return null;
    }

    // Ensure the user exists and get their information
    const user = await _sp.web.ensureUser(email);

    // Return the user ID
    return user?.Id || null;
  } catch (error) {
    console.error("❌ Error fetching user ID by email:", error);
    return null;
  }
};

export const getGuestTemplateData = async (listId: string): Promise<any[]> => {
  const sp = getSP();

  try {
    const items = await sp.web.lists
      .getById(listId)
      .items.select("*")
      .top(5000)(); // fetch up to 5000 items

    console.log(`✅ Fetched ${items.length} items from GuestTemplate (List ID: ${listId})`);
    return items;
  } catch (error) {
    console.error(`❌ Error fetching data from GuestTemplate (List ID: ${listId}):`, error);
    return [];
  }
};