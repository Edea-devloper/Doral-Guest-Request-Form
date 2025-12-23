import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';

import {
  PropertyFieldListPicker,
  PropertyFieldListPickerOrderBy
} from '@pnp/spfx-property-controls/lib/PropertyFieldListPicker';

import {
  PropertyFieldCollectionData,
  CustomCollectionFieldType
} from '@pnp/spfx-property-controls/lib/PropertyFieldCollectionData';

import GuestDashboardDepartmentWise from './components/GuestDashboardDepartmentWise';
// import { IGuestDashboardDepartmentWiseProps } from './components/IGuestDashboardDepartmentWiseProps';
import { getListColumns } from './Utility/utils';

export interface IGuestDashboardDepartmentWiseWebPartProps {
  guestListId: string;
  departmentListId: string;
  TableConfig: any[];
  mainListId: string;
  DepartmentColumnName:string;
  DashboardHeader:string;
  FormUrl:string;
  cacheList:string;
}

export default class GuestDashboardDepartmentWiseWebPart
  extends BaseClientSideWebPart<IGuestDashboardDepartmentWiseWebPartProps> {

  private _guestListColumns: { key: string; text: string }[] = [];

  public render(): void {
    const element = React.createElement(GuestDashboardDepartmentWise, {
      context: this.context,
      guestListId: this.properties.guestListId,
      departmentListId: this.properties.departmentListId,
      TableConfig: this.properties.TableConfig,
      mainListId: this.properties.mainListId,
      DepartmentColumnName:this.properties.DepartmentColumnName,
      DashboardHeader:this.properties.DashboardHeader,
      FormUrl:this.properties.FormUrl,
      cacheList:this.properties.cacheList
    });

    ReactDom.render(element, this.domElement);
  }

  protected async onPropertyPaneConfigurationStart(): Promise<void> {
    if (this.properties.guestListId) {
      const cols = await getListColumns(this.properties.guestListId, this.context);
      this._guestListColumns = cols.map(c => ({
        key: c.key,
        text: c.text
      }));
    }
  }

  protected onPropertyPaneFieldChanged(
    propertyPath: string,
    oldValue: any,
    newValue: any
  ): void {
    if (propertyPath === 'guestListId' && oldValue !== newValue) {
      this.properties.TableConfig = [];
      this._guestListColumns = [];
      this.context.propertyPane.refresh();
    }
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: 'Guest Dashboard Configuration' },
          groups: [
            {
              groupName: 'Lists',
              groupFields: [
                PropertyFieldListPicker('mainListId', {
                  label: 'Main List',
                  selectedList: this.properties.mainListId,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  multiSelect: false,
                  context: this.context as any,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  key: 'guestListPicker'
                }),
                PropertyFieldListPicker('guestListId', {
                  label: 'Guest List',
                  selectedList: this.properties.guestListId,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  multiSelect: false,
                  context: this.context as any,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  key: 'guestListPicker'
                }),
                PropertyFieldListPicker('cacheList', {
                  label: 'Guest Cache List',
                  selectedList: this.properties.cacheList,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  multiSelect: false,
                  context: this.context as any,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  key: 'guestListPicker'
                }),
                PropertyFieldListPicker('departmentListId', {
                  label: 'Department List',
                  selectedList: this.properties.departmentListId,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  multiSelect: false,
                  context: this.context as any,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  key: 'departmentListPicker'
                })
              ]
            },
            {
              groupName: 'Table Configuration',
              groupFields: [
                PropertyPaneTextField('DashboardHeader', {
                  label: "Dashboard Header",
                  value: this.properties.DashboardHeader
                }),
                PropertyFieldCollectionData('TableConfig', {
                  key: 'TableConfig',
                  label: 'Table Columns',
                  panelHeader: 'Configure Table Columns',
                  manageBtnLabel: 'Configure Columns',
                  value: this.properties.TableConfig || [],
                  enableSorting: true,
                  disabled: !this.properties.guestListId,
                  fields: [
                    {
                      id: 'title',
                      title: 'Display Name',
                      type: CustomCollectionFieldType.string,
                      required: true
                    },
                    {
                      id: 'selectedColumn',
                      title: 'Select Column',
                      type: CustomCollectionFieldType.dropdown,
                      required: true,
                      options: this._guestListColumns
                    }
                  ]
                }),
                PropertyPaneTextField('DepartmentColumnName', {
                  label: "Department Column DisplayNameName",
                  value: this.properties.DepartmentColumnName
                }),
                PropertyPaneTextField('FormUrl', {
                  label: "Form Url",
                  value: this.properties.FormUrl
                })
              ]
            }
          ]
        }
      ]
    };
  }
}