import cn from "classnames";
import * as React from "react";
import { Spinner, SpinnerSize } from "@fluentui/react";

import { IStatus } from "../../../models/IStatus";
import { useOrderBy } from "../../../hooks/useOrderBy";
import { useExportCsv } from "../../../hooks/useExportCsv";
import { useTableData } from "../../../hooks/useTableData";
import { usePagination } from "../../../hooks/usePagination";

import { Links } from "./Links/Links";
import { Controls } from "./Controls/Controls";
import { TableHead } from "./TableHead/TableHead";
import { TableBody } from "./TableBody/TableBody";
import { useFields } from "../../../hooks/useFields";
import { TableFooter } from "./TableFooter/TableFooter";
import { getDirection } from "../../../utils/localization";
import { IProcessConfiguration } from "../../../models/IProcessConfiguration";

interface IDashMainProps {
    list: string;
    newItemUrl: string;
    statuses: IStatus[];
    securityLink: string;
    listColumns: string[];
    statusFieldName: string;
    detailsFormUrl: string;
    processConfiguration?: IProcessConfiguration;
    ApprovalConfigData: any;
    primaryColor: any;
    guestRequestList: string;
}

export const DashMain = ({
    list,
    statuses,
    newItemUrl,
    listColumns,
    securityLink,
    statusFieldName,
    processConfiguration,
    detailsFormUrl,
    ApprovalConfigData,
    primaryColor,
    guestRequestList
}: IDashMainProps): JSX.Element => {
    const { fields } = useFields(list, listColumns);
    const { orderBy, onChageOrderBy } = useOrderBy({ column: "Modified", order: "desc" });
    const { page, pageSize, changePage, changePageSize } = usePagination();
    const handleResetPage = () => changePage(1); // move page to 1

    const {
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
        
    } = useTableData(page, list, pageSize, fields, statusFieldName, orderBy, processConfiguration, ApprovalConfigData, guestRequestList, handleResetPage);

    const { onExportCsv } = useExportCsv(fields, data);

    const onExportExcel = (): void => {
        onExportCsv();
    };

    return (
        <div className="dash_main">
            <Links
                newItemUrl={newItemUrl}
                onDeleteItems={onDeleteItems}
                onExportExcel={onExportExcel}
            />
            <Controls
                statuses={statuses}
                showMyItems={onShowMyItems}
                showAllItems={onShowAllItems}
                selectedStatus={selectedStatus}
                onSelectStatus={onSelectStatus}
                searchListData={onSearchListData}
                showCreatedItems={onShowItemsCreatedByMe}
                ApprovalConfigData={ApprovalConfigData}
                listId={list}
                statusBasedData={onStatusBasedFilter}
                dateRagneFilter={onDateRagneFilter}
                data={data}
                guestRequestList={guestRequestList}
            />
            <>
                {loading && (
                    <Spinner
                        size={SpinnerSize.large}
                        className="spinnerLoader"
                        label="Loading..."
                        color={primaryColor}
                    />
                )}
                <div className={cn("dash_table", loading && "loading")}>
                    <table dir={getDirection()} style={{direction: getDirection()}}>
                        <TableHead
                            data={data}
                            fields={fields}
                            orderBy={orderBy}
                            setOrderBy={onChageOrderBy}
                            filteredColumns={filteredColumns}
                            onApplyFilter={onApplyColumnFilter}
                            onSelectAllItems={onSelectAllItems}
                            primaryColor={primaryColor}
                        />
                        <TableBody
                            data={data}
                            fields={fields}
                            statuses={statuses || []}
                            onSelectItem={onSelectItem}
                            statusFieldName={statusFieldName}
                            detailsFormUrl={detailsFormUrl}
                        />
                    </table>
                </div>
                <TableFooter
                    page={page}
                    pageSize={pageSize}
                    pagesCount={pagesCount}
                    changePage={changePage}
                    securityLink={securityLink}
                    changePageSize={changePageSize}
                />
            </>
        </div>
    );
};
