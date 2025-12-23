import * as React from 'react';
import styles from './GuestInfoDashboard.module.scss';
import type { IGuestInfoDashboardProps } from './IGuestInfoDashboardProps';
import cn from "classnames";
import "../styles/style.module.scss";
import "../styles/global.module.scss";
import { Footer } from "./Footer/Footer";
import "../styles/responsive.module.scss";
import "../styles/bootstrap.rtl.module.scss";
import { Main } from "./Main/Main";
import { Header } from "./Header/Header";
import { IProcessConfiguration } from "../models/IProcessConfiguration";

export default class GuestInfoDashboard extends React.Component<IGuestInfoDashboardProps, {}> {
  public render(): React.ReactElement<IGuestInfoDashboardProps> {
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
      guestRequestList,
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
          guestRequestList={guestRequestList}
        />
        <Footer {...rest} />
      </div>
    );
  }
}
