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
    getGuestRequestListItems
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
    guestRequestList?: string,
    onResetPage?: () => void
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
    onStatusBasedFilter: (items: any[]) => void;
    onDateRagneFilter: (items: any[]) => void;

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

        if (initialized && listId && fields?.length > 0) {
            fetchData();
        }
    }, [initialized, listId, fields, pageSize, orderBy, filter]);








    // React.useEffect(() => {
    //     const fetchData = async (): Promise<void> => {
    //         const items = await pager?.goTo(page - 1);


    //         // Get array of Parent IDs
    //         // const parentIds = items?.map((x: any) => x.ParentID);
    //         const parentIds = Array.from(new Set(items?.map((x: any) => x.ParentID)));


    //         // Fetch only matching guest records
    //         const guestListItems = await getGuestRequestListItems(guestRequestList || '', parentIds || []);

    //         // Merge guest info into items
    //         const updatedItems = items?.map((item: any) => {
    //             const matchedGuest = guestListItems.find((guest: any) => guest.ID === item.ParentID);

    //             return {
    //                 ...item,
    //                 ApplicantName: matchedGuest ? matchedGuest?.ApplicantsName?.Title : null,
    //                 ApplicantDepartment: matchedGuest ? matchedGuest.ApplicantsDepartment : null,
    //                 GuestStatus: matchedGuest ? matchedGuest.Status : null,
    //                 RequestDate: matchedGuest ? matchedGuest.ApplicationDate : null,
    //             };
    //         });

    //         setData(updatedItems || [])

    //         // setData(items || []);
    //     };
    //     fetchData();
    // }, [page, pager]);



    React.useEffect(() => {
        const fetchData = async (): Promise<void> => {
            try {
                setLoading(true); // START LOADING

                const items = await pager?.goTo(page - 1);

                const parentIds = Array.from(new Set(items?.map((x: any) => x.ParentID)));

                const guestListItems = await getGuestRequestListItems(guestRequestList || '', parentIds || []);

                const updatedItems = items?.map((item: any) => {
                    const matchedGuest = guestListItems.find((guest: any) => guest.ID === item.ParentID);

                    return {
                        ...item,
                        ApplicantName: matchedGuest?.ApplicantsName?.Title ?? null,
                        ApplicantDepartment: matchedGuest?.ApplicantsDepartment ?? null,
                        GuestStatus: matchedGuest?.Status ?? null,
                        RequestDate: matchedGuest?.ApplicationDate ?? null,
                    };
                });

                setData(updatedItems || []);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false); // STOP LOADING
            }
        };

        if (pager) fetchData();
    }, [page, pager, guestRequestList]);







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

        onResetPage?.(); // reset page
    };

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
        onResetPage?.(); // reset page
    };



    // const onStatusBasedFilter = (guestItems: any[]): void => {

    //     // If user selected "All Status" → reset filter and return
    //     if (guestItems?.[0]?.isSelectedStatusIsAll === true) {
    //         setFilter("");
    //         return;
    //     }

    //     if (!guestItems || guestItems?.length === 0 || !data || data?.length === 0) return;

    //     // Step 1: Extract IDs from guest items
    //     const guestIds = guestItems?.map(g => g?.ID);

    //     // Step 2: Extract parent IDs from data
    //     // const parentIds = data.map(d => d.ParentID);
    //     // (remove duplicates)
    //     const parentIds = Array.from(new Set(data?.map(d => d?.ParentID)));

    //     // Step 3: Find intersecting IDs where guest ID matches parent ID
    //     const matchedIds = parentIds.filter(id => guestIds.includes(id));

    //     // Step 4: Make unique list of IDs
    //     const uniqueMatchedIds = Array.from(new Set(matchedIds))?.filter(id => id !== null);

    //     // If no matches → clear filter
    //     if (uniqueMatchedIds?.length === 0) {
    //         setFilter("");
    //         return;
    //     }

    //     // Step 5: Build filter query
    //     const filterQuery = uniqueMatchedIds?.map(id => `ParentID eq ${id}`).join(" or ");

    //     console.log("Generated Filter Query:", filterQuery);

    //     // Step 6: Apply filter
    //     setFilter(filterQuery);
    //     onResetPage?.(); // reset page
    // };


    // 
    
    const onStatusBasedFilter = async (guestItems: any[]): Promise<void> => {

        // If user selected "All Status"
        if (guestItems?.[0]?.isSelectedStatusIsAll) {
            setFilter("");
            onResetPage?.();
            return;
        }

        if (!guestItems || guestItems.length === 0) return;

        setLoading(true);

        try {
            // Get ALL Parent IDs from guest request list based on selected statuses
            const guestIds = guestItems.map(g => g.ID);

            // Build OData Filter for SP Query
            const filterQuery = guestIds.map(id => `ParentID eq ${id}`).join(" or ");

            setFilter(filterQuery);
            onResetPage?.(); // reset to first page
        }
        finally {
            setLoading(false);
        }
    };




    //---------------------------------

    const onDateRagneFilter = async (guestItems: any[]): Promise<void> => {

        // If user selected "All Status"
        if (guestItems?.[0]?.isClearFilter == true) {
            setFilter("");
            onResetPage?.();
            return;
        }

        if (!guestItems || guestItems.length === 0) return;

        setLoading(true);

        try {
            // Get ALL Parent IDs from guest request list based on selected statuses
            const guestIds = guestItems.map(g => g.ID);

            // Build OData Filter for SP Query
            const filterQuery = guestIds.map(id => `ParentID eq ${id}`).join(" or ");

            setFilter(filterQuery);
            onResetPage?.(); // reset to first page
        }
        finally {
            setLoading(false);
        }
    };



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
        onStatusBasedFilter,
        onDateRagneFilter
    };
};
