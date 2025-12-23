import * as React from "react";

import { IStatus } from "../../models/IStatus";

import { DashMain } from "./DashMain/DashMain";
import { getDirection } from "../../utils/localization";
import { IProcessConfiguration } from "../../models/IProcessConfiguration";

interface IMainProps {
    list: string;
    title: string;
    newItemUrl: string;
    statuses: IStatus[];
    securityLink: string;
    listColumns: string[];
    statusFieldName: string;
    processConfiguration?: IProcessConfiguration;
    ApprovalConfigData: any
    primaryColor: any
    guestInfoList: string
}

export const Main = (props: IMainProps): JSX.Element => {

    const { title, ApprovalConfigData, primaryColor, guestInfoList, ...rest } = props;
    return (
        <main className="main_wrapper dash_wrapper" dir={getDirection()}>
            <div className="cloud_item1">
                <img src={require("../../images/cloud-1.png")} alt="" />
            </div>
            <div className="cloud_item2">
                <img src={require("../../images/cloud-2.png")} alt="" />
            </div>
            <div className="container">
                <div className="dash_title text-center">
                    <h2>{title}</h2>
                </div>
                <DashMain {...rest} detailsFormUrl={props.newItemUrl} ApprovalConfigData={ApprovalConfigData} primaryColor={primaryColor} guestInfoList={guestInfoList}/>
            </div>
        </main>
    );
};
