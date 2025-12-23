import { IStatus } from "../models/IStatus";

export interface IGuestInfoDashboardProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  filePickerResult: string;
    list: string;
    title: string;
    githubLink: string;
    newItemUrl: string;
    statuses: IStatus[];
    twitterLink: string;
    facebookLink: string;
    securityLink: string;
    primaryColor: string;
    instagramLink: string;
    developerLink: string;
    listColumns: string[];
    backgroundColor: string;
    statusFieldName: string;
    renderBottomLinks: boolean;
    orderedColumns: { key: string; name: string }[];
    backgroundColorHeader:string;
    rightToLeft: boolean;
    processConfiguration: string;
    SPGroups: any
    ApprovalConfigData:any[];
    guestRequestList: string;
}
