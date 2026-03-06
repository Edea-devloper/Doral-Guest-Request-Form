import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as strings from 'GuestRequestFormWebPartStrings';
import GuestRequestForm from './components/GuestRequestForm';
import { IGuestRequestFormProps } from './components/IGuestRequestFormProps';
import { getSP } from './Utility/getSP';
import { getListColumns } from './Utility/utils';
import { PropertyFieldListPicker, PropertyFieldListPickerOrderBy } from '@pnp/spfx-property-controls/lib/PropertyFieldListPicker';
import { PropertyFieldCollectionData, CustomCollectionFieldType } from '@pnp/spfx-property-controls/lib/PropertyFieldCollectionData';

export interface IGuestRequestFormWebPartProps {
  FormDetailsConfig: any[];
  list: string;
  GuestInfoList: string;
  GuestInfoListTemplate:string;
  GuestInfoConfig: any[];
  PurposeOfRequestList: string;
  PurposeOfRequestConfig: any[];
  ApprovalConfigData: any[];
  ContactListSite: string;
  ContactListName: string;
  DepartmentColumnName:string;
  DashboardUrl:string;
  dashboardTitle:string;
  PurposeOfRequestTemplate:string;
}

export default class GuestRequestFormWebPart extends BaseClientSideWebPart<IGuestRequestFormWebPartProps> {

  private _GuestListColumns: { key: string; text: string; Coltype: any; options: any }[] = [];
  private _GuestInfoListColumns: { key: string; text: string; Coltype: any; options: any }[] = [];
  private _PurposeOfRequestListColumns: { key: string; text: string; Coltype: any; options: any }[] = [];

  public render(): void {
    const element: React.ReactElement<IGuestRequestFormProps> = React.createElement(
      GuestRequestForm,
      {
        list: this.properties.list,
        FormDetailsConfig: this.properties.FormDetailsConfig,
        GuestInfoList: this.properties.GuestInfoList,
        GuestInfoListTemplate:this.properties.GuestInfoListTemplate,
        GuestInfoConfig: this.properties.GuestInfoConfig,
        PurposeOfRequestList: this.properties.PurposeOfRequestList,
        PurposeOfRequestConfig: this.properties.PurposeOfRequestConfig,
        ApprovalConfigData: this.properties.ApprovalConfigData,
        ContactListName: this.properties.ContactListName,
        ContactListSite: this.properties.ContactListSite,
        DepartmentColumnName:this.properties.DepartmentColumnName,
        DashboardUrl:this.properties.DashboardUrl,
        context: this.context,
        dashboardTitle:this.properties.dashboardTitle,
        PurposeOfRequestTemplate:this.properties.PurposeOfRequestTemplate
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    getSP(this.context);

    const promises: Promise<void>[] = [];

    if (this.properties.list) {
      promises.push(
        getListColumns(this.properties.list).then((columns) => {
          this._GuestListColumns = columns;
        })
      );
    }

    if (this.properties.GuestInfoList) {
      promises.push(
        getListColumns(this.properties.GuestInfoList).then((columns) => {
          this._GuestInfoListColumns = columns;
        })
      );
    }

    if (this.properties.PurposeOfRequestList) {
      promises.push(
        getListColumns(this.properties.PurposeOfRequestList).then((columns) => {
          this._PurposeOfRequestListColumns = columns;
        })
      );
    }

    await Promise.all(promises);
    this._syncCollectionWithColumns();

    return Promise.resolve();
  }

  private _syncCollectionWithColumns(): void {
    // 🔹 Sync FormDetailsConfig
    if (this.properties.FormDetailsConfig?.length > 0 && this._GuestListColumns.length > 0) {
      this.properties.FormDetailsConfig = this.properties.FormDetailsConfig.map((item: any) => {
        const matchingCol = this._GuestListColumns.find(col => col.key === item.selectedColumn);
        const isChoice = matchingCol?.Coltype?.toLowerCase() === 'choice' || matchingCol?.Coltype?.toLowerCase() === 'multichoice';
        return {
          ...item,
          columnType: matchingCol?.Coltype || '',
          Internalname: matchingCol?.key || '',
          options: isChoice ? matchingCol?.options || [] : []
        };
      });
    }

    // 🔹 Sync GuestInfoConfig
    if (this.properties.GuestInfoConfig?.length > 0 && this._GuestInfoListColumns.length > 0) {
      this.properties.GuestInfoConfig = this.properties.GuestInfoConfig.map((item: any) => {
        const matchingCol = this._GuestInfoListColumns.find(col => col.key === item.selectedColumn);
        const isChoice = matchingCol?.Coltype?.toLowerCase() === 'choice' || matchingCol?.Coltype?.toLowerCase() === 'multichoice';
        return {
          ...item,
          columnType: matchingCol?.Coltype || '',
          Internalname: matchingCol?.key || '',
          options: isChoice ? matchingCol?.options || [] : []
        };
      });
    }

    // 🔹 Sync PurposeOfRequestConfig
    if (this.properties.PurposeOfRequestConfig?.length > 0 && this._PurposeOfRequestListColumns.length > 0) {
      this.properties.PurposeOfRequestConfig = this.properties.PurposeOfRequestConfig.map((item: any) => {
        const matchingCol = this._PurposeOfRequestListColumns.find(col => col.key === item.selectedColumn);
        const isChoice = matchingCol?.Coltype?.toLowerCase() === 'choice' || matchingCol?.Coltype?.toLowerCase() === 'multichoice';
        return {
          ...item,
          columnType: matchingCol?.Coltype || '',
          Internalname: matchingCol?.key || '',
          options: isChoice ? matchingCol?.options || [] : []
        };
      });
    }
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  //#region Property Changes
  protected async onPropertyPaneFieldChanged(propertyPath: string, oldValue: any, newValue: any): Promise<void> {
    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);

    // 🔹 Handle Guest main list
    if (propertyPath === 'list' && oldValue !== newValue) {
      this.properties.FormDetailsConfig = [];
      this._GuestListColumns = newValue ? await getListColumns(newValue) : [];
      this.context.propertyPane.refresh();
    }

    // 🔹 FormDetailsConfig
    if (propertyPath === 'FormDetailsConfig') {
      const updatedCollection = newValue.map((item: any) => {
        const matchingCol = this._GuestListColumns.find(col => col.key === item.selectedColumn);
        const isChoice = matchingCol?.Coltype?.toLowerCase() === 'choice' || matchingCol?.Coltype?.toLowerCase() === 'multichoice';
        return {
          ...item,
          columnType: matchingCol?.Coltype || '',
          Internalname: matchingCol?.key || '',
          options: isChoice ? matchingCol?.options || [] : []
        };
      });
      this.properties.FormDetailsConfig = updatedCollection;
      this.context.propertyPane.refresh();
    }

    // 🔹 Guest Info list
    if (propertyPath === 'GuestInfoList' && oldValue !== newValue) {
      this.properties.GuestInfoConfig = [];
      this._GuestInfoListColumns = newValue ? await getListColumns(newValue) : [];
      this.context.propertyPane.refresh();
    }

    // 🔹 Guest Info Config
    if (propertyPath === 'GuestInfoConfig') {
      const updatedGuestInfo = newValue.map((item: any) => {
        const matchingCol = this._GuestInfoListColumns.find(col => col.key === item.selectedColumn);
        const isChoice = matchingCol?.Coltype?.toLowerCase() === 'choice' || matchingCol?.Coltype?.toLowerCase() === 'multichoice';
        return {
          ...item,
          columnType: matchingCol?.Coltype || '',
          Internalname: matchingCol?.key || '',
          options: isChoice ? matchingCol?.options || [] : []
        };
      });
      this.properties.GuestInfoConfig = updatedGuestInfo;
      this.context.propertyPane.refresh();
    }

    // 🔹 Purpose Of Request List
    if (propertyPath === 'PurposeOfRequestList' && oldValue !== newValue) {
      this.properties.PurposeOfRequestConfig = [];
      this._PurposeOfRequestListColumns = newValue ? await getListColumns(newValue) : [];
      this.context.propertyPane.refresh();
    }

    // 🔹 Purpose Of Request Config
    if (propertyPath === 'PurposeOfRequestConfig') {
      const updatedPurposeConfig = newValue.map((item: any) => {
        const matchingCol = this._PurposeOfRequestListColumns.find(col => col.key === item.selectedColumn);
        const isChoice = matchingCol?.Coltype?.toLowerCase() === 'choice' || matchingCol?.Coltype?.toLowerCase() === 'multichoice';
        return {
          ...item,
          columnType: matchingCol?.Coltype || '',
          Internalname: matchingCol?.key || '',
          options: isChoice ? matchingCol?.options || [] : []
        };
      });
      this.properties.PurposeOfRequestConfig = updatedPurposeConfig;
      this.context.propertyPane.refresh();
    }
  }
  //#endregion

  protected async onPropertyPaneConfigurationStart(): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.properties.list) {
      promises.push(getListColumns(this.properties.list).then(cols => this._GuestListColumns = cols));
    }
    if (this.properties.GuestInfoList) {
      promises.push(getListColumns(this.properties.GuestInfoList).then(cols => this._GuestInfoListColumns = cols));
    }
    if (this.properties.PurposeOfRequestList) {
      promises.push(getListColumns(this.properties.PurposeOfRequestList).then(cols => this._PurposeOfRequestListColumns = cols));
    }

    await Promise.all(promises);
    this.context.propertyPane.refresh();
  }

  //#region Property Pane
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: strings.PropertyPaneDescription },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                // 🧾 Guest Form List
                PropertyFieldListPicker('list', {
                  label: 'Select a Guest List',
                  selectedList: this.properties.list,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  key: 'guestListPicker',
                  disabled: false,
                  onGetErrorMessage: null as any,
                  deferredValidationTime: 0
                }),

                // 🧩 Guest Form Configuration
                PropertyFieldCollectionData('FormDetailsConfig', {
                  key: 'FormDetailsConfig',
                  label: 'Form Details Configuration',
                  panelHeader: 'Manage Form Details Fields',
                  manageBtnLabel: 'Configure Fields',
                  value: this.properties.FormDetailsConfig || [],
                  enableSorting: true,
                  fields: [
                    { id: 'title', title: 'Display Name', type: CustomCollectionFieldType.string, required: true },
                    { id: 'selectedColumn', title: 'Select Column', type: CustomCollectionFieldType.dropdown, required: true, options: this._GuestListColumns },
                    { id: 'placeholder', title: 'Placeholder', type: CustomCollectionFieldType.string },
                    { id: 'isfieldrequired', title: 'Required', type: CustomCollectionFieldType.boolean },
                    { id: 'isDisabled', title: 'Disabled', type: CustomCollectionFieldType.boolean }
                  ],
                  disabled: false
                }),

                // 🧾 Guest Info List
                PropertyFieldListPicker('GuestInfoList', {
                  label: 'Select a Guest Info List',
                  selectedList: this.properties.GuestInfoList,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  key: 'guestInfoListPicker',
                  disabled: false,
                  onGetErrorMessage: null as any,
                  deferredValidationTime: 0
                }),
                
                // 🧾 Guest Info Template List
                PropertyFieldListPicker('GuestInfoListTemplate', {
                  label: 'Select a Guest Info Template List',
                  selectedList: this.properties.GuestInfoListTemplate,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  key: 'guestInfoListPicker',
                  disabled: false,
                  onGetErrorMessage: null as any,
                  deferredValidationTime: 0
                }),

                // 🧩 Guest Info Configuration
                PropertyFieldCollectionData('GuestInfoConfig', {
                  key: 'GuestInfoConfig',
                  label: 'Guest Info Configuration',
                  panelHeader: 'Manage Guest Info Fields',
                  manageBtnLabel: 'Configure Guest Info Fields',
                  value: this.properties.GuestInfoConfig || [],
                  enableSorting: true,
                  fields: [
                    { id: 'title', title: 'Display Name', type: CustomCollectionFieldType.string, required: true },
                    { id: 'selectedColumn', title: 'Select Column', type: CustomCollectionFieldType.dropdown, required: true, options: this._GuestInfoListColumns },
                    { id: 'placeholder', title: 'Placeholder', type: CustomCollectionFieldType.string },
                    { id: 'isfieldrequired', title: 'Required', type: CustomCollectionFieldType.boolean },
                    { id: 'isDisabled', title: 'Disabled', type: CustomCollectionFieldType.boolean }
                  ],
                  disabled: false
                }),

                // 🧾 Purpose Of Request List
                PropertyFieldListPicker('PurposeOfRequestList', {
                  label: 'Select Purpose Of Request List',
                  selectedList: this.properties.PurposeOfRequestList,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  key: 'PurposeOfRequestListPicker',
                  disabled: false,
                  onGetErrorMessage: null as any,
                  deferredValidationTime: 0
                }),

                // 🧩 Purpose Of Request Configuration
                PropertyFieldCollectionData('PurposeOfRequestConfig', {
                  key: 'PurposeOfRequestConfig',
                  label: 'Purpose Of Request Configuration',
                  panelHeader: 'Manage Purpose Of Request Fields',
                  manageBtnLabel: 'Configure Purpose Of Request Fields',
                  value: this.properties.PurposeOfRequestConfig || [],
                  enableSorting: true,
                  fields: [
                    { id: 'title', title: 'Display Name', type: CustomCollectionFieldType.string, required: true },
                    { id: 'selectedColumn', title: 'Select Column', type: CustomCollectionFieldType.dropdown, required: true, options: this._PurposeOfRequestListColumns },
                    { id: 'placeholder', title: 'Placeholder', type: CustomCollectionFieldType.string },
                    { id: 'isfieldrequired', title: 'Required', type: CustomCollectionFieldType.boolean },
                    { id: 'isDisabled', title: 'Disabled', type: CustomCollectionFieldType.boolean }
                  ],
                  disabled: false
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
                PropertyPaneTextField('ContactListSite', {
                  label: "Contact List Site",
                  value: this.properties.ContactListSite
                }),
                PropertyPaneTextField('ContactListName', {
                  label: "Contact List Name",
                  value: this.properties.ContactListName
                }),
                PropertyPaneTextField('DepartmentColumnName', {
                  label: "Department Column InternalName",
                  value: this.properties.DepartmentColumnName
                }),
                PropertyPaneTextField('DashboardUrl', {
                  label: "Dashboard Url",
                  value: this.properties.DashboardUrl
                }),
                PropertyPaneTextField('dashboardTitle', {
                  label: "Dashboard Title",
                  value: this.properties.dashboardTitle
                }),
                PropertyFieldListPicker('PurposeOfRequestTemplate', {
                  label: 'Select a Purpose Of Request Template List',
                  selectedList: this.properties.PurposeOfRequestTemplate,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  key: 'guestInfoListPicker',
                  disabled: false,
                  onGetErrorMessage: null as any,
                  deferredValidationTime: 0
                })
              ]
            }
          ]
        }
      ]
    };
  }
  //#endregion
}
