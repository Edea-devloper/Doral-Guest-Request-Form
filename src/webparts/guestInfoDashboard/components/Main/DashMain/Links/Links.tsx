import * as React from "react";
import { getLocalizedString } from "../../../../utils/localization";

interface ILinksProps {
    newItemUrl: string;
    onDeleteItems: () => void;
    onExportExcel: () => void;
}

export const Links = ({
    newItemUrl,
    onDeleteItems,
    onExportExcel,
}: ILinksProps): JSX.Element => {
    const handlePrint = (): void => {
        window.print();
    };

    return (
        <div className="dash_links" dir="ltr">
            <div className="dash_btn">
                <button type="button" onClick={onDeleteItems}>
                    <img
                        src={require("../../../../images/delete.svg")}
                        alt=""
                    />
                    {getLocalizedString("DeleteText")}
                </button>
            </div>
            { true && 
            <>
                <div className="dash_btn export_btn">
                    <button type="button" onClick={onExportExcel}>
                        <img
                            src={require("../../../../images/download.svg")}
                            alt=""
                        />
                        {getLocalizedString("ExportToExcelText")}
                    </button>
                </div>
                <div className="dash_btn print_btn" style={{display: 'none'}}>
                    <button type="button" onClick={handlePrint}>
                        <img src={require("../../../../images/print.svg")} alt="" />
                        {getLocalizedString("PrintText")}
                    </button>
                </div>
            </>
            }
            <div className="dash_btn new_formbtn">
                <button
                    type="button"
                    onClick={() => window.open(newItemUrl, "__blank")}
                >
                    <img src={require("../../../../images/plus.svg")} alt="" />
                    {getLocalizedString("CreateNewFormText")}
                </button>
            </div>
        </div>
    );
};
