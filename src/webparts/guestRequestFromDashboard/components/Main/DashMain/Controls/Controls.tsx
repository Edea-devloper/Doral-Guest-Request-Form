import cn from "classnames";
import * as React from "react";
import { DatePicker, Dropdown } from "@fluentui/react";
import { debounce } from "@microsoft/sp-lodash-subset";

import { IStatus } from "../../../../models/IStatus";
import { getDirection, getLocalizedString } from "../../../../utils/localization";
import { getCurrentUserGroups, isCurrentUserManager } from "../../../../services/list.service";

interface IControlsProps {
    statuses: IStatus[];
    selectedStatus: string;
    showMyItems: () => void;
    showAllItems: () => void;
    showCreatedItems: () => void;
    searchListData: (value: string) => void;
    onSelectStatus: (status: string) => void;
    ApprovalConfigData: any;
    listId: any;
    dateRangeFilter: (fromDate: Date | null, toDate: Date | null) => void;
}

export const Controls = ({
    statuses,
    selectedStatus,
    showMyItems,
    showAllItems,
    searchListData,
    onSelectStatus,
    showCreatedItems,
    ApprovalConfigData,
    listId,
    dateRangeFilter
}: IControlsProps): JSX.Element => {
    // const [activeFilter, setActiveFilter] = React.useState<"all" | "my" | "created" | null>(null);
    const [activeFilter, setActiveFilter] = React.useState<"all" | "my" | "created">("all");

    const [fromDate, setFromDate] = React.useState<Date | null>(null);
    const [toDate, setToDate] = React.useState<Date | null>(null);



    const [isApprover, setIsApprover] = React.useState(false);
    const handleSearchListData = debounce(
        async (value: string): Promise<void> => {
            searchListData(value);
        },
        800
    );

    // React.useEffect(() => {
    //     const checkApproverGroups = async () => {
    //         const groupsTitles = await getCurrentUserGroups();
    //         const isInApprovers1 = groupsTitles.includes("Approvers1");
    //         const isInApprovers2 = groupsTitles.includes("Approvers2");

    //         setIsApprover(isInApprovers1 || isInApprovers2);
    //     };

    //     checkApproverGroups();
    // }, []);
    React.useEffect(() => {
        const checkApproverGroups = async () => {
            const groupsTitles = await getCurrentUserGroups();

            const isDynamicApprover = ApprovalConfigData?.some((item: { ShowApproveRejectButton: boolean; SharepointGroup: string; }) =>
                item.ShowApproveRejectButton === true &&
                groupsTitles.includes(item.SharepointGroup)
            );

            const isManager = await isCurrentUserManager(listId);
            console.log(isManager)
            // setIsApprover(isDynamicApprover || isManager);

            setIsApprover(isDynamicApprover || false);
        };

        checkApproverGroups();
    }, [ApprovalConfigData]);

    return (
        <div className="dash_upper">
            <div className="dash_search">
                <form action="">
                    <input
                        type="search"
                        placeholder={getLocalizedString("SearchPlaceholderText")}
                        onChange={(event) =>
                            handleSearchListData(event.target.value)
                        }
                        onKeyDown={(event) =>
                            event.key === "Enter" && event.preventDefault()
                        }
                    />
                </form>

                <div className="date-range-filter">
                    <DatePicker
                        placeholder="From Date"
                        value={fromDate ?? undefined}
                        onSelectDate={(date) => setFromDate(date || null)}
                        formatDate={(date) => date?.toLocaleDateString("en-GB") ?? ""}
                    />
                    <DatePicker
                        placeholder="To Date"
                        value={toDate ?? undefined}
                        onSelectDate={(date) => setToDate(date || null)}
                        formatDate={(date) => date?.toLocaleDateString("en-GB") ?? ""}
                    />

                    {/* <PrimaryButton
                        text="Apply Filter"
                        onClick={() => dateRangeFilter(fromDate, toDate)}
                        styles={{
                            root: {
                                height: 29,
                                minHeight: '29px',
                                padding: "0 3px",
                                borderRadius: 6,
                                fontSize: '13px',
                                marginBottom: '5px'
                            }
                        }}
                    /> */}

                    <div className="dash_btn new_formbtn">
                        <button
                            type="button"
                            onClick={() => dateRangeFilter(fromDate, toDate)}

                            style={{
                                padding: '5px 9px 6px 6px;',
                                fontSize: '13px',
                                height: '30px',
                                marginBottom: '6px'
                            }}
                        >
                            Apply Filter
                        </button>
                    </div>

                    {/* <PrimaryButton
                        text="Clear Filter"
                        onClick={() => {
                            setFromDate(null);
                            setToDate(null);
                            dateRangeFilter(null, null); // Reset filter in parent
                        }}
                        styles={{
                            root: {
                                height: 29,
                                minHeight: '29px',
                                padding: "0 3px",
                                borderRadius: 6,
                                fontSize: '13px',
                                background: 'red',
                                marginBottom: '5px'
                            }
                        }}
                    /> */}

                    <div className="dash_btn new_formbtn">
                        <button
                            type="button"
                            onClick={() => {
                                setFromDate(null);
                                setToDate(null);
                                dateRangeFilter(null, null); // Reset filter in parent
                            }}

                            style={{
                                padding: '5px 9px 6px 6px;',
                                fontSize: '13px',
                                height: '30px',
                                marginBottom: '6px'
                            }}
                        >
                            Clear Filter
                        </button>
                    </div>
                </div>
            </div>







            <div className="dash_rightscrol">
                <div className="dash_uprRight">
                    <div className="dash_rightBtnwrap">
                        {isApprover && (
                            <div className="dash_rightBtn">
                                {/* <a href="#" onClick={showAllItems}>
                                    {getLocalizedString("AllFilter")}
                                </a>
                                <a href="#" onClick={showMyItems}>
                                    {getLocalizedString("RelatedToMeFilter")}
                                </a> */}
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        showAllItems();
                                        setActiveFilter("all");
                                    }}
                                    className={cn({ active: activeFilter === "all" })}
                                >
                                    {getLocalizedString("AllFilter_He")}
                                </a>

                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        showMyItems();
                                        setActiveFilter("my");
                                    }}
                                    className={cn({ active: activeFilter === "my" })}
                                >
                                    {getLocalizedString("RelatedToMeFilter_He")}
                                </a>

                                {/* <a href="#" onClick={showCreatedItems}>
                                {getLocalizedString("CreatedByMeFilter")}
                                </a> */}
                            </div>
                        )}
                    </div>


                    <div className="dash_statBtn" style={{ display: 'none' }}>
                        <Dropdown
                            selectedKey={selectedStatus}
                            options={[
                                { key: "", text: getLocalizedString("StatusFilterPlaceholder") },
                                ...(statuses || []).map((status) => ({
                                    key: status.value,
                                    text: status.label,
                                    data: { color: status.color },
                                })),
                            ]}
                            placeholder={getLocalizedString("StatusFilterPlaceholder")}
                            className={cn("dropdown", "statue_dropdown")}
                            onChange={(_, item) => {
                                onSelectStatus(item?.key as string);
                            }}
                            onRenderOption={(item) => (
                                <div className="status_option" dir={getDirection()}>
                                    <span
                                        className="status_color"
                                        style={{
                                            background: item?.data?.color,
                                        }}
                                    />
                                    <span className="status_text">
                                        {item?.text}
                                    </span>
                                </div>
                            )}
                            calloutProps={{ calloutWidth: 120 }}
                        />
                    </div>


                </div>
            </div>
        </div>
    );
};
