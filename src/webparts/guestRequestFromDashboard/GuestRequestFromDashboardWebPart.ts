import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'GuestRequestFromDashboardWebPartStrings';
import GuestRequestFromDashboard from './components/GuestRequestFromDashboard';
import { IGuestRequestFromDashboardProps } from './components/IGuestRequestFromDashboardProps';

import {
  type IPropertyPaneConfiguration,
  PropertyPaneCheckbox,
  PropertyPaneTextField,
  PropertyPaneToggle,
} from '@microsoft/sp-property-pane';

import { IFieldInfo } from "@pnp/sp/fields";
import {
  PropertyFieldListPicker,
  PropertyFieldListPickerOrderBy,
} from "@pnp/spfx-property-controls/lib/PropertyFieldListPicker";
import {
  PropertyFieldColorPicker,
  PropertyFieldColorPickerStyle,
} from "@pnp/spfx-property-controls/lib/PropertyFieldColorPicker";
import {
  IColumnReturnProperty,
  IPropertyFieldRenderOption,
  PropertyFieldColumnPicker,
  PropertyFieldColumnPickerOrderBy,
} from "@pnp/spfx-property-controls/lib/PropertyFieldColumnPicker";
import {
  PropertyFieldCollectionData,
  CustomCollectionFieldType,

} from "@pnp/spfx-property-controls/lib/PropertyFieldCollectionData";
import { PropertyFieldFilePicker, IFilePickerResult } from "@pnp/spfx-property-controls/lib/PropertyFieldFilePicker";
import { PropertyFieldCodeEditor, PropertyFieldCodeEditorLanguages } from '@pnp/spfx-property-controls/lib/PropertyFieldCodeEditor';
import { PropertyFieldOrder } from "@pnp/spfx-property-controls/lib/PropertyFieldOrder";
import { getSP } from "./pnpjsConfig";
import { getContext } from "./contextConfig";

import { getListFields } from "./services/list.service";
import { orderSelectedColumns } from "./utils/columnsOrder";


import { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import { IFileInfo } from "@pnp/sp/files";
import { initializeLocalization } from "./utils/localization";

import { IStatus } from './models/IStatus'



export interface IGuestRequestFromDashboardWebPartProps {
  description: string;
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
  backgroundColorHeader: string;
  rightToLeft: boolean;
  processConfiguration: string;
  SPGroups: any;
  ApprovalConfigData: any[];
  guestInfoList: string;
}





export default class GuestRequestFromDashboardWebPart extends BaseClientSideWebPart<IGuestRequestFromDashboardWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';
  private _fields: IFieldInfo[] = [];

  public render(): void {
    const element: React.ReactElement<IGuestRequestFromDashboardProps> = React.createElement(
      GuestRequestFromDashboard,
      {
        description: this.properties.description,
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        list: this.properties.list,
        title: this.properties.title,
        statuses: this.properties.statuses,
        githubLink: this.properties.githubLink,
        newItemUrl: this.properties.newItemUrl,
        twitterLink: this.properties.twitterLink,
        primaryColor: this.properties.primaryColor,
        facebookLink: this.properties.facebookLink,
        securityLink: this.properties.securityLink,
        developerLink: this.properties.developerLink,
        instagramLink: this.properties.instagramLink,
        orderedColumns: this.properties.orderedColumns,
        backgroundColor: this.properties.backgroundColor,
        statusFieldName: this.properties.statusFieldName,
        renderBottomLinks: this.properties.renderBottomLinks,
        listColumns: this.properties.orderedColumns ? this.properties.orderedColumns.map((c) => c.key) : [],
        backgroundColorHeader: this.properties.backgroundColorHeader,
        filePickerResult: this.properties.filePickerResult,
        rightToLeft: this.properties.rightToLeft,
        processConfiguration: this.properties.processConfiguration,
        SPGroups: this.properties.SPGroups,
        ApprovalConfigData: this.properties.ApprovalConfigData,
        guestInfoList: this.properties.guestInfoList,
      }
    );

    ReactDom.render(element, this.domElement);
    this._applyBackgroundColorToCommandBar(this.properties.backgroundColorHeader);
  }

  private async onListChange(listId?: string): Promise<void> {
    if (listId || this.properties.list) {
      const fields = await getListFields(listId || this.properties.list);
      this._fields = fields;
    }
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
    document.documentElement.style.setProperty(
      "--primary-color",
      this.properties.primaryColor
    );

    document.documentElement.style.setProperty(
      "--background-color",
      this.properties.backgroundColor
    );


    // Set default value for SPGroups if not already set
    if (!this.properties.SPGroups) {
      // this.properties.SPGroups = "All stakeholders, HR, IT Team (Eli), Operations Manager (Shimon), Direct Manager"; // default value
      this.properties.SPGroups = "CIO, IT Team"; // default value
    }


    getContext(this.context);
    getSP(this.context);

    // Initialize the locatization strings
    initializeLocalization(this.properties.rightToLeft ? "rtl" : "ltr");

    await this.onListChange();
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }
    const { semanticColors } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty(
        "--bodyText",
        semanticColors.bodyText || null
      );
      this.domElement.style.setProperty(
        "--link",
        semanticColors.link || null
      );
      this.domElement.style.setProperty(
        "--linkHovered",
        semanticColors.linkHovered || null
      );
    }
  }

  private _getLuminance(color: string): number {
    if (!color) {
      // Default to white if color is null or undefined
      color = '#ffffff';
    }

    const rgbMatch = color.match(/\w\w/g);
    if (!rgbMatch) {
      // Default to white if color is not in the expected format
      return 1; // Luminance of white
    }

    const rgb = rgbMatch.map((c: string) => parseInt(c, 16));
    const [r, g, b] = rgb.map((c: number) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private _isColorDark = (color: string): boolean => {
    const luminance = this._getLuminance(color);
    return luminance < 0.5; // Adjust threshold as needed
  };

  private _applyBackgroundColorToCommandBar(color: string): void {
    const colorFont = this._isColorDark(this.properties.backgroundColorHeader) ? 'white' : 'black';
    const commandBarChildren = document.querySelectorAll('.ms-CommandBar > div');
    const commandBaItem = document.querySelectorAll('.ms-Button--commandBar');
    commandBaItem.forEach((child) => {
      (child as HTMLElement).style.color = colorFont;
    });


    const commandBar = document.querySelector('.ms-CommandBar');
    if (commandBar) {
      commandBar.setAttribute('style', `padding: 0px 15px 0px 0px;`);
    }
    commandBarChildren.forEach((child) => {
      (child as HTMLElement).style.backgroundColor = color;
      (child as HTMLElement).style.height = '50px';
    });
  }

  private async uploadFile(filePickerResult: IFilePickerResult): Promise<string> {
    if (filePickerResult.fileAbsoluteUrl) {
      return filePickerResult.fileAbsoluteUrl;
    }

    const sp: SPFI = getSP(this.context);
    const file = await filePickerResult.downloadFileContent(); // Get the file content
    const fileBuffer = await file.arrayBuffer();

    const folderPath = "/sites/createitem/SiteAssets/SitePages"; // Adjust your folder path
    // const fileName = encodeURI (filePickerResult.fileName); // Encode the file name
    const fileUpload: IFileInfo = await sp.web.getFolderByServerRelativePath(folderPath).files.addUsingPath(`${folderPath}/${filePickerResult.fileName}`, fileBuffer, { Overwrite: true });

    // Construct the absolute URL correctly by using site URL only once
    const absoluteUrl = `${this.context.pageContext.web.absoluteUrl.split('/sites/createitem')[0]}${fileUpload.ServerRelativeUrl}`;

    return absoluteUrl;
  }

  // Use the uploadFile function in your onFilePickerSave and onFilePickerChanged

  private async onFilePickerSave(filePickerResult: IFilePickerResult): Promise<void> {
    if (filePickerResult) {
      const fileUrl = await this.uploadFile(filePickerResult);
      this.properties.filePickerResult = fileUrl;
      this.context.propertyPane.refresh();
      this.render();
    }
  }

  private async onFilePickerChanged(filePickerResult: IFilePickerResult): Promise<void> {
    if (filePickerResult) {
      const fileUrl = await this.uploadFile(filePickerResult);
      this.properties.filePickerResult = fileUrl;
      this.context.propertyPane.refresh();
      this.render();
    }
  }


  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription,
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField("title", {
                  label: strings.TitleFieldLabel,
                }),
                PropertyFieldListPicker("lists", {
                  label: "Select a list",
                  selectedList: this.properties.list,
                  includeHidden: false,
                  orderBy:
                    PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: (
                    propertyPath,
                    oldValue,
                    newValue
                  ) => {
                    this.onListChange(newValue);
                    this.properties.list = newValue;
                    this.properties.listColumns = [];
                    this.properties.orderedColumns = [];
                  },
                  properties: this.properties,
                  context: this.context as any,
                  onGetErrorMessage: undefined,
                  deferredValidationTime: 0,
                  key: "listPickerFieldId",
                }),
                PropertyFieldListPicker("guestInfoList", {
                  label: "Select Guest Info List",
                  selectedList: this.properties.guestInfoList,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  deferredValidationTime: 0,
                  key: "guestInfoList",
                }),
                PropertyPaneTextField("SPGroups", {
                  label: "Enter SharePoint Groups",
                  value: this.properties.SPGroups,
                }),
                PropertyFieldColumnPicker("listColumns", {
                  label: "Select columns",
                  context: this.context as any,
                  selectedColumn: this.properties.listColumns,
                  listId: this.properties.list,
                  disabled: false,
                  orderBy:
                    PropertyFieldColumnPickerOrderBy.Title,
                  onPropertyChange: (
                    propertyPath,
                    oldValue,
                    newValue
                  ) => {
                    const expandedFields = this._fields
                      .filter((f) =>
                        newValue.includes(
                          f.InternalName
                        )
                      )
                      .map((f) => ({
                        name: f.Title,
                        key: f.EntityPropertyName,
                      }));

                    this.properties.listColumns = newValue;
                    this.properties.orderedColumns =
                      this.properties.orderedColumns
                        ?.length > 0
                        ? orderSelectedColumns(
                          expandedFields,
                          this.properties
                            .orderedColumns
                        )
                        : expandedFields;
                  },
                  columnsToExclude: this._fields
                    ?.filter(
                      (f) =>
                        f.Hidden ||
                        f.Group === "_Hidden" ||
                        f.TypeDisplayName ===
                        "Computed" ||
                        f.TypeDisplayName === "Lookup"
                    )
                    ?.map((f) => f.Id),
                  properties: this.properties,
                  onGetErrorMessage: undefined,
                  deferredValidationTime: 0,
                  key: "multiColumnPickerFieldId",
                  displayHiddenColumns: false,
                  columnReturnProperty:
                    IColumnReturnProperty["Internal Name"],
                  multiSelect: true,
                  renderFieldAs:
                    IPropertyFieldRenderOption[
                    "Multiselect Dropdown"
                    ],
                }),
                PropertyFieldOrder("orderedColumns", {
                  key: "orderedColumns",
                  label: "Ordered Columns",
                  items: this.properties.orderedColumns,
                  textProperty: "name",
                  properties: this.properties,
                  onPropertyChange: (
                    propertyPath,
                    oldValue,
                    newValue
                  ) => {
                    this.properties.orderedColumns =
                      newValue;
                  },
                }),
                PropertyFieldColumnPicker("statusFieldName", {
                  label: "Select a status column",
                  context: this.context as any,
                  selectedColumn:
                    this.properties.statusFieldName,
                  listId: this.properties.list,
                  disabled: false,
                  orderBy:
                    PropertyFieldColumnPickerOrderBy.Title,
                  onPropertyChange: (
                    propertyPath,
                    oldValue,
                    newValue
                  ) => {
                    const statusField = this._fields.find(
                      (f) => f.InternalName === newValue
                    );
                    this.properties.statusFieldName =
                      statusField?.EntityPropertyName ||
                      "";
                  },
                  properties: this.properties,
                  deferredValidationTime: 0,
                  key: "columnPickerFieldId",
                  displayHiddenColumns: false,
                  columnReturnProperty:
                    IColumnReturnProperty["Internal Name"],
                }),
                PropertyFieldCollectionData("statuses", {
                  key: "statuses",
                  label: "Statuses",
                  panelHeader: "Statuses",
                  manageBtnLabel: "Manage statuses",
                  value: this.properties.statuses,
                  fields: [
                    {
                      id: "color",
                      title: "Color (hex)",
                      type: CustomCollectionFieldType.string,
                      required: true,
                    },
                    {
                      id: "value",
                      title: "Status",
                      type: CustomCollectionFieldType.string,
                      required: true,
                    },
                    {
                      id: "label",
                      title: "Label",
                      type: CustomCollectionFieldType.string,
                      required: true,
                    },
                    {
                      id: "enTitle",
                      title: "English Title",
                      type: CustomCollectionFieldType.string,
                    },
                  ],
                  disabled: false,
                }),
                PropertyFieldColorPicker("primaryColor", {
                  label: "Primary color",
                  selectedColor: this.properties.primaryColor,
                  onPropertyChange: (
                    propertyPath,
                    oldValue,
                    newValue
                  ) => {
                    this.properties.primaryColor = newValue;

                    document.documentElement.style.setProperty(
                      "--primary-color",
                      newValue
                    );
                  },
                  properties: this.properties,
                  disabled: false,
                  debounce: 1000,
                  isHidden: false,
                  alphaSliderHidden: false,
                  style: PropertyFieldColorPickerStyle.Full,
                  iconName: "Precipitation",
                  key: "primartColorFieldId",
                }),
                PropertyFieldColorPicker("backgroundColor", {
                  label: "Background color",
                  selectedColor:
                    this.properties.backgroundColor,
                  onPropertyChange: (
                    propertyPath,
                    oldValue,
                    newValue
                  ) => {
                    this.properties.backgroundColor =
                      newValue;

                    document.documentElement.style.setProperty(
                      "--background-color",
                      newValue
                    );
                  },
                  properties: this.properties,
                  disabled: false,
                  debounce: 1000,
                  isHidden: false,
                  alphaSliderHidden: false,
                  style: PropertyFieldColorPickerStyle.Full,
                  iconName: "Precipitation",
                  key: "backgroungColorFieldId",
                }),
                PropertyPaneToggle('rightToLeft', { label: "Right to Left" }),
                PropertyFieldCodeEditor('processConfiguration', {
                  label: 'Edit Process Configuration',
                  panelTitle: 'Edit Process Configuration',
                  initialValue: this.properties.processConfiguration,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  disabled: false,
                  key: 'codeEditorProcessConfiguration',
                  language: PropertyFieldCodeEditorLanguages.JSON,
                  options: {
                    wrap: true,
                    fontSize: 14,
                  }
                }),
                PropertyFieldCollectionData("ApprovalConfigData", {
                  key: "ApprovalConfigData",
                  label: "Approval Config",
                  panelHeader: "Manage Collection Items",
                  manageBtnLabel: "Manage Items",
                  value: this.properties.ApprovalConfigData ? this.properties.ApprovalConfigData : [],
                  enableSorting: false,
                  fields: [
                    {
                      id: "notes",
                      title: "Note",
                      type: CustomCollectionFieldType.string,
                      required: false
                    },
                    {
                      id: "date",
                      title: "Date",
                      type: CustomCollectionFieldType.string,
                      required: false
                    },
                    {
                      id: "status",
                      title: "Status",
                      type: CustomCollectionFieldType.string,
                      required: false
                    },
                    {
                      id: "confirmingFactor",
                      title: "Confirming Factor",
                      type: CustomCollectionFieldType.string,
                      required: false
                    },
                    {
                      id: "stage",
                      title: "Stage",
                      type: CustomCollectionFieldType.number,
                      required: false
                    },
                    {
                      id: "SharepointGroup",
                      title: "Sharepoint Group",
                      type: CustomCollectionFieldType.string,
                      required: false
                    },
                    {
                      id: "StepOrder",
                      title: "StepOrder",
                      type: CustomCollectionFieldType.number,
                      required: false
                    },
                    {
                      id: "ShowApproveRejectButton",
                      title: "Show Approve button",
                      type: CustomCollectionFieldType.boolean,
                      required: false
                    }
                  ],
                  disabled: false,
                }),
              ],
            },
          ],
        },
        {
          header: {
            description: strings.PropertyPaneDescription,
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField("newItemUrl", {
                  label: "New item URL",
                }),
                PropertyPaneCheckbox("renderBottomLinks", {
                  text: "Render bottom links",
                }),
                PropertyPaneTextField("securityLink", {
                  label: "Security link",
                }),
                PropertyPaneTextField("developerLink", {
                  label: "Developer link",
                }),
                PropertyPaneTextField("twitterLink", {
                  label: "Twitter link",
                }),
                PropertyPaneTextField("facebookLink", {
                  label: "Facebook link",
                }),
                PropertyPaneTextField("instagramLink", {
                  label: "Instagram link",
                }),
                PropertyPaneTextField("githubLink", {
                  label: "GitHub link",
                }),
              ],
            },
          ],
        },
        {
          header: {
            description: "Logo and Background Color",
          },
          groups: [
            {
              groupName: "Header Appearance",
              groupFields: [

                PropertyFieldColorPicker("backgroundColorHeader", {
                  label: "Background color",
                  selectedColor: this.properties.backgroundColorHeader,
                  onPropertyChange: (
                    propertyPath,
                    oldValue,
                    newValue
                  ) => {
                    this.properties.backgroundColorHeader = newValue;

                    document.documentElement.style.setProperty(
                      "--background-color",
                      newValue
                    );
                  },
                  properties: this.properties,
                  disabled: false,
                  debounce: 1000,
                  isHidden: false,
                  alphaSliderHidden: false,
                  style: PropertyFieldColorPickerStyle.Full,
                  iconName: "Precipitation",
                  key: "backgroungColorFieldId",
                }),
                PropertyFieldFilePicker('filePicker', {
                  context: this.context as any,
                  filePickerResult: this.properties.filePickerResult as any,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  onSave: this.onFilePickerSave.bind(this),
                  onChanged: this.onFilePickerChanged.bind(this),
                  key: "filePickerId",
                  buttonLabel: "File Picker",
                  label: "File Picker",
                })
              ],
            },
          ],
        },
      ],
    };
  }



}
