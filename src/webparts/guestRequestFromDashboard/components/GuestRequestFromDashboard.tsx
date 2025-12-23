import * as React from 'react';
import styles from './GuestRequestFromDashboard.module.scss';
import type { IGuestRequestFromDashboardProps } from './IGuestRequestFromDashboardProps';
import cn from "classnames";
import "../styles/style.module.scss";
import "../styles/global.module.scss";
import { Footer } from "./Footer/Footer";
import "../styles/responsive.module.scss";
import "../styles/bootstrap.rtl.module.scss";
import { Main } from "./Main/Main";
import { Header } from "./Header/Header";
import { IProcessConfiguration } from "../models/IProcessConfiguration";

export default class GuestRequestFromDashboard extends React.Component<IGuestRequestFromDashboardProps, {}> {
  public render(): React.ReactElement<IGuestRequestFromDashboardProps> {
    const {
      description,
      userDisplayName,
      list,
      title,
      statuses,
      newItemUrl,
      listColumns,
      securityLink,
      statusFieldName,
      backgroundColor,
      filePickerResult,
      backgroundColorHeader,
      SPGroups,
      ApprovalConfigData,
      primaryColor,
      guestInfoList,
      ...rest
    } = this.props;

    let processConfiguration: IProcessConfiguration | undefined;

    try {
      if (this.props.processConfiguration) {
        processConfiguration = JSON.parse(this.props.processConfiguration);
      }
    } catch (error) {
      console.error(error);
    }

    return (
      <div
        className={cn(styles.homePageWrapper)}
        style={{ background: backgroundColor }}
      >
        <Header
          imageUrl={filePickerResult}
          backgroundColor={backgroundColorHeader} />
        <Main
          list={list}
          title={title}
          statuses={statuses}
          newItemUrl={newItemUrl}
          listColumns={listColumns}
          securityLink={securityLink}
          statusFieldName={statusFieldName}
          processConfiguration={processConfiguration}
          ApprovalConfigData={ApprovalConfigData}
          primaryColor={primaryColor}
          guestInfoList={guestInfoList}
        />
        <Footer {...rest} />
      </div>
    );
  }
}
