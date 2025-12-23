import * as React from "react";
import { IFieldInfo } from "@pnp/sp/fields";

import { IOrder } from "../models/IOrder";
import { getContext } from "../contextConfig";
import { AsyncPager } from "../services/async-pager";
import { IBaseListItem } from "../models/IBaseListItem";
import {
    getPager,
    deleteListItems,
    getCurrentUserGroups,
    getCurrentUserInfo,
    isCurrentUserManager,
    getGuestInfoListItems
} from "../services/list.service";
import { IProcessConfiguration } from "../models/IProcessConfiguration";

export const useTableData = (
    page: number,
    listId: string,
    pageSize: number,
    fields: IFieldInfo[],
    statusFieldName: string,
    orderBy?: IOrder,
    processConfiguration?: IProcessConfiguration,
    ApprovalConfigData?: any,
    guestInfoList?: string | undefined
): {
    loading: boolean;
    pagesCount: number;
    data: IBaseListItem[];
    selectedStatus: string;
    onApplyColumnFilter: (
        column: string,
        values: string[],
        wipe?: boolean,
        fieldType?: string
    ) => void;
    filteredColumns: string[];
    onShowMyItems: () => void;
    onShowAllItems: () => void;
    onShowItemsCreatedByMe: () => void;
    onDeleteItems: () => Promise<void>;
    onSelectStatus: (status: string) => void;
    onSelectItem: (item: IBaseListItem) => void;
    onSelectAllItems: (selected: boolean) => void;
    onSearchListData: (searchText: string) => void;
    onDateRangeFilter: (fromDate: Date | null, toDate: Date | null) => void;
} => {
    const [filter, setFilter] = React.useState<string>("");
    const [filtersMap, setFiltersMap] = React.useState<Record<string, string>>(
        {}
    );
    const [data, setData] = React.useState<IBaseListItem[]>([]);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [pagesCount, setPagesCount] = React.useState<number>(0);
    const [pager, setPager] = React.useState<
        AsyncPager<IBaseListItem[]> | undefined
    >(undefined);
    const [selectedStatus, setSelectedStatus] = React.useState<string>("");
    const [filteredColumns, setFilteredColumns] = React.useState<string[]>([]);
    const [initialized, setInitialized] = React.useState(false);

    // ================================================ On page load set a default value("For my approval") on Dashboard ===============================================
    //   React.useEffect(() => {
    //     const init = async () => {
    //       const checkCurrentUserGroup = await getCurrentUserGroups();
    //       if (
    //         checkCurrentUserGroup.includes("Approvers1") ||
    //         checkCurrentUserGroup.includes("Approvers2")
    //       ) {
    //         await onShowMyItems();
    //         setInitialized(true);
    //       } else {
    //         await onShowAllItems();
    //         setInitialized(true);
    //       }
    //     };

    //     init();
    //   }, []);


    React.useEffect(() => {
        const init = async () => {
            const checkCurrentUserGroup = await getCurrentUserGroups();

            // Dynamically determine if the user is an approver
            const isApprover = ApprovalConfigData?.some(
                (item: any) =>
                    item.ShowApproveRejectButton === true &&
                    checkCurrentUserGroup.includes(item.SharepointGroup)
            );

            if (isApprover) {
                // await onShowMyItems();
                await onShowAllItems();
            } else {
                await onShowAllItems();
            }

            setInitialized(true);
        };

        init();
    }, [ApprovalConfigData]);



    // ============================================================= Get List Data ====================================================================================

    const fetchData = async () => {
        try {
            setLoading(true);
            const checkCurrentUserGroup = await getCurrentUserGroups();
            let filterQuery = filter;
            // let filterQuery = buildFilterString(filtersMap);
            const filtersMapString = buildFilterString(filtersMap);
            if (filtersMapString) {
                filterQuery = filterQuery
                    ? `${filterQuery} and ${filtersMapString}`
                    : filtersMapString;
            }

            // Extract group names from ApprovalConfigData
            const approvalGroups = ApprovalConfigData?.map(
                (item: any) => item.SharepointGroup
            ).filter((group: string | null) => !!group); // Remove nulls or undefined

            // Check if current user belongs to any of these groups
            const isUserInApprovalGroup = approvalGroups?.some((group: string) =>
                checkCurrentUserGroup.includes(group)
            );

            const isManager = await isCurrentUserManager(listId);

            // if (isUserInApprovalGroup) {
            //     if (filter === "") {
            //         filterQuery = "";
            //     }
            // } else {
            //     const { pageContext } = getContext();
            //     if (filter === "") {
            //         filterQuery = `AuthorId eq ${pageContext.legacyPageContext?.userId}`;
            //     } else {
            //         filterQuery += ` and AuthorId eq ${pageContext.legacyPageContext?.userId}`;
            //     }
            // }


            if (isUserInApprovalGroup) {
                if (filter === "") {
                    filterQuery = "";
                }
            } else {
                const { pageContext } = getContext();
                if (filter === "") {
                    // filterQuery = `AuthorId eq ${pageContext.legacyPageContext?.userId}`;
                    if (isManager) {
                        filterQuery = "";
                    } else {
                        filterQuery = `AuthorId eq ${pageContext.legacyPageContext?.userId}`;
                    }
                } else if (filter !== "" && isManager) {
                    const { email } = await getCurrentUserInfo();
                    // const directManagerFilter = `(RecruiterManager/EMail eq '${email}')`;
                    const directManagerStep1Filter = `(RecruiterManager/EMail eq '${email}' and StepOrder eq 1)`;
                    filterQuery = directManagerStep1Filter;
                } else {
                    // filterQuery += ` and AuthorId eq ${pageContext.legacyPageContext?.userId}`;
                    if (isManager) {
                        filterQuery = "";
                    } else {
                        filterQuery += ` and AuthorId eq ${pageContext.legacyPageContext?.userId}`;
                    }
                }
            }


            // if (isUserInApprovalGroup) {
            //     // User is in approval group: show everything
            //     filterQuery = "";
            // } else if (isManager) {
            // const { email } = await getCurrentUserInfo();
            // const directManagerFilter = `(RecruiterManager/EMail eq '${email}')`;
            // filterQuery = directManagerFilter;

            // } else {
            //     // Normal user: restrict to own items
            //     const { pageContext } = getContext();
            //     if (filter === "") {
            //         filterQuery = `AuthorId eq ${pageContext.legacyPageContext?.userId}`;
            //     } else {
            //         filterQuery += ` and AuthorId eq ${pageContext.legacyPageContext?.userId}`;
            //     }
            // }


            const { pagerInstance, pagesCount } = await getPager<IBaseListItem>(
                listId,
                pageSize,
                fields,
                orderBy,
                filterQuery
            );

            setPager(pagerInstance);
            setPagesCount(pagesCount);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };



    React.useEffect(() => {
        // const fetchData = async () => {
        //     try {
        //         setLoading(true);
        //         const checkCurrentUserGroup = await getCurrentUserGroups();
        //         console.log(checkCurrentUserGroup);
        //         let filterQuery = filter;
        //         // let filterQuery = buildFilterString(filtersMap);
        //         const filtersMapString = buildFilterString(filtersMap);
        //         if (filtersMapString) {
        //             filterQuery = filterQuery
        //                 ? `${filterQuery} and ${filtersMapString}`
        //                 : filtersMapString;
        //         }

        //         // Extract group names from ApprovalConfigData
        //         const approvalGroups = ApprovalConfigData?.map(
        //             (item: any) => item.SharepointGroup
        //         ).filter((group: string | null) => !!group); // Remove nulls or undefined

        //         // Check if current user belongs to any of these groups
        //         const isUserInApprovalGroup = approvalGroups?.some((group: string) =>
        //             checkCurrentUserGroup.includes(group)
        //         );

        //         if (
        //             // checkCurrentUserGroup.includes("FormsDashboardadmins") ||
        //             // checkCurrentUserGroup.includes("Approvers1") ||
        //             // checkCurrentUserGroup.includes("Approvers2")

        //             // checkCurrentUserGroup.includes("All stakeholders") ||
        //             // checkCurrentUserGroup.includes("HR") ||
        //             // checkCurrentUserGroup.includes("IT Team (Eli)") ||
        //             // checkCurrentUserGroup.includes("Operations Manager (Shimon)") ||
        //             // checkCurrentUserGroup.includes("Direct Manager")
        //             isUserInApprovalGroup
        //         ) {
        //             if (filter === "") {
        //                 filterQuery = "";
        //             }
        //         } else {
        //             const { pageContext } = getContext();
        //             // filterQuery =
        //             //     filter === ""
        //             //         ? `AuthorId eq ${pageContext.legacyPageContext?.userId}`
        //             //         : `${filter} and AuthorId eq ${pageContext.legacyPageContext?.userId}`;
        //             if (filter === "") {
        //                 filterQuery = `AuthorId eq ${pageContext.legacyPageContext?.userId}`;
        //             } else {
        //                 filterQuery += ` and AuthorId eq ${pageContext.legacyPageContext?.userId}`;
        //             }
        //         }

        //         const { pagerInstance, pagesCount } = await getPager<IBaseListItem>(
        //             listId,
        //             pageSize,
        //             fields,
        //             orderBy,
        //             filterQuery
        //         );

        //         setPager(pagerInstance);
        //         setPagesCount(pagesCount);
        //     } catch (error) {
        //         console.error(error);
        //     } finally {
        //         setLoading(false);
        //     }
        // };

        if (initialized && listId && fields?.length > 0) {
            fetchData();
        }
    }, [initialized, listId, fields, pageSize, orderBy, filter]);

    React.useEffect(() => {
        const fetchData = async (): Promise<void> => {
            const items = await pager?.goTo(page - 1);

            // Get array of Parent IDs
            const parentIds = items?.map((x: any) => x.ID);

            // Fetch only matching guest records
            const guestListItems = await getGuestInfoListItems(guestInfoList || '', parentIds || []);

            // Group guest records by ParentID
            const guestsByParent = guestListItems.reduce((acc: Record<number, any[]>, item: any) => {
                const key = item.ParentID;
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
            }, {});

            // Add NumberofGuestsinform property to each main item
            const updatedItems = items?.map((item: any) => ({
                ...item,
                NumberofGuestsinform: guestsByParent[item.ID]?.length || 0
            }));

            setData(updatedItems || [])

            // setData(items || []);
        };
        fetchData();
    }, [page, pager]);

    const onSelectAllItems = (selected: boolean): void => {
        setData((prevData) => prevData.map((i) => ({ ...i, selected })));
    };

    const onSelectItem = (item: IBaseListItem): void => {
        setData((prevData) =>
            prevData.map((i) =>
                i.Id === item.Id ? { ...i, selected: !i.selected } : i
            )
        );
    };

    // const onDeleteItems = async (): Promise<void> => {
    //     const itemsToDelete = data.filter((i) => i.selected).map((i) => i.Id);

    //     if (!itemsToDelete.length) {
    //         return;
    //     }

    //     try {
    //         setLoading(true);

    //         await deleteListItems(listId, itemsToDelete as number[]);
    //         setData((prevData) => prevData.filter((i) => !i.selected));
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // const onDeleteItems = async (): Promise<void> => {
    //     const itemsToDelete = data.filter((i) => i.selected).map((i) => i.Id);

    //     if (!itemsToDelete.length) {
    //         return;
    //     }

    //     try {
    //         setLoading(true);

    //         // 1. Delete selected items
    //         await deleteListItems(listId, itemsToDelete as number[]);

    //         // 2. Refresh the pager (fetch updated count & pages)
    //         const filterQuery = filter;
    //         const filtersMapString = buildFilterString(filtersMap);
    //         const finalFilterQuery = filtersMapString
    //             ? filterQuery
    //                 ? `${filterQuery} and ${filtersMapString}`
    //                 : filtersMapString
    //             : filterQuery;

    //         const { pagerInstance, pagesCount } = await getPager<IBaseListItem>(
    //             listId,
    //             pageSize,
    //             fields,
    //             orderBy,
    //             finalFilterQuery
    //         );

    //         setPager(pagerInstance);
    //         setPagesCount(pagesCount);

    //         // 3. Adjust current page if necessary
    //         const newPage = page > pagesCount ? Math.max(1, pagesCount) : page;

    //         // Wait until the pager is updated, then go to the new page
    //         const items = await pagerInstance.goTo(newPage - 1);
    //         setData(items || []);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const onDeleteItems = async (): Promise<void> => {
        const itemsToDelete = data.filter((i) => i.selected).map((i) => i.Id);

        if (!itemsToDelete.length) return;

        try {
            setLoading(true);
            await deleteListItems(listId, itemsToDelete as number[]);
        } catch (error) {
            console.error("Error deleting items:", error);
        } finally {
            if (initialized && listId && fields?.length > 0) {
                await fetchData();
            }
            setLoading(false);
        }
    };

    const onSelectStatus = (status: string): void => {
        if (!status) {
            setFilter("");
            setSelectedStatus("");
            return;
        }
        const filterQuery = `${statusFieldName} eq '${status}'`;

        setFilter(filterQuery);
        setSelectedStatus(status);
    };

    // const onSearchListData = (searchText: string): void => {
    //     if (searchText) {
    //         const filterQuery = fields
    //             .filter((f) => f.Filterable)
    //             .map((c) => `substringof('${searchText}', ${c.EntityPropertyName})`)
    //             .join(" or ");

    //         setFilter(filter ? filter.concat(` and (${filterQuery})`) : filterQuery);
    //     } else {
    //         setFilter("");
    //     }
    // };

    const onSearchListData = (searchText: string): void => {
        if (searchText) {

            const filterQuery = fields
                .filter((f) => f.Filterable)
                .map((field) => {

                    // Check if field is a People Picker (FieldTypeKind = 20)
                    if (field.FieldTypeKind === 20) {
                        return `substringof('${searchText}', ${field.EntityPropertyName}/Title)`;
                    }

                    // If DateTime field, convert to string format search
                    if (field.FieldTypeKind === 4) {
                        return `substringof('${searchText}', ${field.EntityPropertyName})`;
                    }

                    // Normal text / number fields
                    return `substringof('${searchText}', ${field.EntityPropertyName})`;
                })
                .join(" or ");

            setFilter(filter ? `${filter} and (${filterQuery})` : filterQuery);

        } else {
            setFilter("");
        }
    };


    const onShowAllItems = (): void => {
        setFilter("");
        setSelectedStatus("");
        setFilteredColumns([]);
    };


    // const onDateRangeFilter = (fromDate: Date | null, toDate: Date | null): void => {
    //     // If no date selected → reset filter
    //     if (!fromDate && !toDate) {
    //         setFilter("");
    //         return;
    //     }
    //     const dateFilters: string[] = [];
    //     // Convert to SharePoint datetime format
    //     if (fromDate) {
    //         dateFilters.push(`ApplicationDate ge datetime'${fromDate.toISOString()}'`);
    //     }
    //     if (toDate) {
    //         // To include full-day, extend time to 23:59:59
    //         const adjustedToDate = new Date(toDate);
    //         adjustedToDate.setHours(23, 59, 59);

    //         dateFilters.push(`ApplicationDate le datetime'${adjustedToDate.toISOString()}'`);
    //     }
    //     const dateFilterQuery = dateFilters.join(" and ");
    //     // Merge with existing filters (if the user already searched text or status)
    //     setFilter(filter ? `${filter} and (${dateFilterQuery})` : dateFilterQuery);
    // };


    const onDateRangeFilter = (fromDate: Date | null, toDate: Date | null): void => {

        // If no date selected → return empty filter
        if (!fromDate && !toDate) {
            setFilter("");
            return;
        }

        const dateFilters: string[] = [];

        // Convert dates to ISO format recognized by SharePoint API
        if (fromDate) {
            dateFilters.push(`ApplicationDate ge datetime'${fromDate.toISOString()}'`);
        }

        if (toDate) {
            // Extend to last second of the day so the date is included
            const adjustedToDate = new Date(toDate);
            adjustedToDate.setHours(23, 59, 59, 999);

            dateFilters.push(`ApplicationDate le datetime'${adjustedToDate.toISOString()}'`);
        }

        // Combine filters
        const dateFilterQuery = dateFilters.join(" and ");

        setFilter(dateFilterQuery)
    };









    /**
     * Show items awaiting for an approval by the current user.
     * The function gets the current user's SharePoint groups to define roles.
     * Then it uses the process configuration to map groups to steps in the process.
     * Finally, the function creates a filter for getting items that are awaiting user's approval.
     */
    // const onShowMyItems = async (): Promise<void> => {
    //     // Get the user SharePoint groups
    //     const groupsTitles = await getCurrentUserGroups();
    //     // Get steps available for the user
    //     const stepsForCurrentUser = processConfiguration?.steps.filter((step) => groupsTitles.indexOf(step.sharePointGroup) !== -1);
    //     // Get filter query for every step
    //     const stepsFilterQueries = stepsForCurrentUser?.map((step) => `(StepOrder eq ${step.order} and ${step.statusColumn} ne '${processConfiguration?.stepCompletedStatus}')`)
    //     // Combine all queries together
    //     const filterQuery = stepsFilterQueries ? stepsFilterQueries?.join(' or ') : '';

    //     setFilter(filterQuery);
    // };

    // const onShowMyItems = async (): Promise<void> => {
    //     // Get the user SharePoint groups
    //     const groupsTitles = await getCurrentUserGroups();

    //     // Determine if user is in Approvers1 or Approvers2
    //     const isUserInApprovers1 = groupsTitles.includes("Approvers1");
    //     const isUserInApprovers2 = groupsTitles.includes("Approvers2");
    //      const isUserInApprovers3 = groupsTitles.includes("Approvers3");

    //     // Get steps available for the user based on their group membership
    //     const stepsForCurrentUser = processConfiguration?.steps.filter((step) =>
    //         groupsTitles.includes(step.sharePointGroup)
    //     );

    //     // Create step-based filters
    //     const stepsFilterQueries =
    //         stepsForCurrentUser?.map(
    //             (step) =>
    //                 `(StepOrder eq ${step.order} and ${step.statusColumn} ne '${processConfiguration?.stepCompletedStatus}')`
    //         ) || [];

    //     // Add role-based StepOrder filters
    //     const roleBasedFilters: string[] = [];

    //     if (isUserInApprovers1) {
    //         roleBasedFilters.push("(StepOrder eq 2)");
    //     }

    //     if (isUserInApprovers2) {
    //         roleBasedFilters.push("(StepOrder eq 3)");
    //     }

    //     if (roleBasedFilters.length > 0) {
    //         stepsFilterQueries.push(`(${roleBasedFilters.join(" or ")})`);
    //     }

    //     // Combine all queries together
    //     const filterQuery =
    //         stepsFilterQueries.length > 0
    //             ? stepsFilterQueries.join(" or ")
    //             : "";

    //     setFilter(filterQuery);
    // };


    const onShowMyItems = async (): Promise<void> => {
        // Get the user SharePoint groups
        const groupsTitles = await getCurrentUserGroups();
        // const { email, title } = await getCurrentUserInfo();
        const { email } = await getCurrentUserInfo();

        // Step filters based on ApprovalConfigData
        const dynamicStepFilters =
            ApprovalConfigData?.filter(
                (step: { ShowApproveRejectButton: boolean; SharepointGroup: string }) =>
                    step.ShowApproveRejectButton === true &&
                    groupsTitles.includes(step.SharepointGroup)
            ).map((step: { StepOrder: any }) => `(StepOrder eq ${step.StepOrder})`) ||
            [];

        // Also optionally add filters for processConfiguration (if needed)
        const stepsForCurrentUser = processConfiguration?.steps.filter((step) =>
            groupsTitles.includes(step.sharePointGroup)
        );

        const stepStatusFilters =
            stepsForCurrentUser?.map(
                (step) =>
                    `(StepOrder eq ${step.order} and ${step.statusColumn} ne '${processConfiguration?.stepCompletedStatus}')`
            ) || [];


        // const directManagerFilter = `(RecruiterManager/EMail eq '${email}')`;
        const directManagerFilter = `(RecruiterManager/EMail eq '${email}' and StepOrder eq 1)`

        // Combine all filters
        const allFilters = [...dynamicStepFilters, ...stepStatusFilters, directManagerFilter];

        const filterQuery = allFilters.length > 0 ? allFilters.join(" or ") : "";

        setFilter(filterQuery);
    };


    const onShowItemsCreatedByMe = (): void => {
        const { pageContext } = getContext();

        const filterQuery = `AuthorId eq ${pageContext.legacyPageContext?.userId}`;

        setFilter(filterQuery);
    };

    // const onApplyColumnFilter = (
    //     column: string,
    //     values: string[],
    //     wipe?: boolean,
    //     fieldType?: string
    // ): void => {
    //     let filterQuery = "";
    //     if (fieldType === "User") {
    //         filterQuery = values
    //             .map((v) => `${column}/Title eq '${v}'`)
    //             .join(" or ");
    //     } else {
    //         filterQuery = values.map((v) => `${column} eq '${v}'`).join(" or ");
    //     }

    //     if (wipe) {
    //         setFilter(
    //             filter.replaceAll(filterQuery, "").replaceAll(" and ()", "")
    //         );
    //     } else {
    //         setFilter(
    //             filter ? filter.concat(` and (${filterQuery})`) : filterQuery
    //         );
    //     }

    //     setFilteredColumns((prev) =>
    //         prev.includes(column)
    //             ? prev.filter((c) => c !== column)
    //             : [...prev, column]
    //     );
    // };

    const buildFilterString = (filters: Record<string, string>) =>
        Object.values(filters).filter(Boolean).join(" and ");

    const onApplyColumnFilter = (
        column: string,
        values: string[],
        wipe?: boolean,
        fieldType?: string
    ): void => {
        let columnFilter = "";

        if (!wipe && values.length > 0) {
            columnFilter =
                fieldType === "User"
                    ? values.map((v) => `${column}/Title eq '${v}'`).join(" or ")
                    : values.map((v) => `${column} eq '${v}'`).join(" or ");
        }

        setFiltersMap((prev) => {
            const updated = { ...prev };

            if (wipe || values.length === 0) {
                delete updated[column];
            } else {
                updated[column] = `(${columnFilter})`;
            }

            const newFilterString = buildFilterString(updated);
            setFilter(newFilterString);

            return updated;
        });

        setFilteredColumns((prev) =>
            wipe || values.length === 0
                ? prev.filter((c) => c !== column)
                : prev.includes(column)
                    ? prev
                    : [...prev, column]
        );
    };

    return {
        data,
        loading,
        pagesCount,
        selectedStatus,
        filteredColumns,
        onSelectItem,
        onDeleteItems,
        onShowMyItems,
        onSelectStatus,
        onShowAllItems,
        onSearchListData,
        onSelectAllItems,
        onApplyColumnFilter,
        onShowItemsCreatedByMe,
        onDateRangeFilter,
    };
};
