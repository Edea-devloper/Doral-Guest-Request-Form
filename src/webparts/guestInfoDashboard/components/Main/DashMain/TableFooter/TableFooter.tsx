import cn from "classnames";
import * as React from "react";
import { Dropdown } from "@fluentui/react";
import { getDirection, getLocalizedString } from "../../../../utils/localization";

interface ITableFooterProps {
    page: number;
    pageSize: number;
    pagesCount: number;
    securityLink: string;
    changePage: (newPage: number) => void;
    changePageSize: (newPageSize: number) => void;
}

export const TableFooter = ({
    page,
    pageSize,
    pagesCount,
    securityLink,
    changePage,
    changePageSize,
}: ITableFooterProps): JSX.Element => {
    const handleChangePage = (newPage: number): void => {
        if (newPage >= 1 && newPage <= pagesCount) {
            changePage(newPage);
        }
    };

    const arrowRight = require("../../../../images/arrow-right.svg");
    const arrowLeft = require("../../../../images/arrow-left.svg");

    const prevArrow = arrowLeft;
    const nextArrow = arrowRight;

    return (
        <div className="dash_bottom">
            <div className="dash_btmLeft">
                <p>{getLocalizedString("ItemsPerPageText_He")}</p>
                <Dropdown
                    className={cn("dropdown", "hapyy_dropdown")}
                    selectedKey={pageSize}
                    options={[
                        { key: 10, text: `10 ${getLocalizedString("ItemsText_He")}` },
                        { key: 20, text: `20 ${getLocalizedString("ItemsText_He")}` },
                        { key: 50, text: `50 ${getLocalizedString("ItemsText_He")}` },
                        { key: 100, text: `100 ${getLocalizedString("ItemsText_He")}` },
                    ]}
                    onChange={(_, item) => {
                        changePageSize(item?.key as number);
                    }}
                />
                <p>
                    <a href={securityLink}>
                        {getLocalizedString("PermissionsText_He")}
                        <img
                            src={require("../../../../images/security.svg")}
                            alt=""
                        />
                    </a>
                </p>
            </div>
            <div className="dash_btmRight" style={{flexDirection: getDirection() === "rtl" ? "row-reverse" : "row" }}>
                <a
                    href="#"
                    className="next"
                    onClick={() => {
                        handleChangePage(page - 1);
                    }}
                >
                    <img src={prevArrow} alt="" />
                    {getLocalizedString("PrevPageText_He")}
                </a>
                {Array.from({ length: pagesCount }, (_, i) => (
                    <a
                        key={i}
                        href="#"
                        className={i + 1 === page ? "active" : ""}
                        onClick={() => {
                            handleChangePage(i + 1);
                        }}
                    >
                        {i + 1}
                    </a>
                ))}
                <a
                    href="#"
                    className="prev"
                    onClick={() => {
                        handleChangePage(page + 1);
                    }}
                >
                    {getLocalizedString("NextPageText_He")}
                    <img src={nextArrow} alt="" />
                </a>
            </div>
        </div>
    );
};
