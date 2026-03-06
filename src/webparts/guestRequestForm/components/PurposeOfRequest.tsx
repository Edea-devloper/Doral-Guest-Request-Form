import * as React from 'react';
import styles from './GuestRequestForm.module.scss';
import { getGuestTemplateData } from '../Utility/utils';
import Select from "react-select";

export interface IPurposeOfRequestProps {
  PurposeOfRequestConfig: any[];
  initialData?: any;
  onFormDataChange: (data: any) => void;
  ShowValidation: boolean;
  ViewMode: boolean;
  PurposeOfRequestTemplate: string;
}

const PurposeOfRequest: React.FC<IPurposeOfRequestProps> = ({
  PurposeOfRequestConfig,
  initialData = {},
  onFormDataChange,
  ShowValidation, ViewMode, PurposeOfRequestTemplate
}) => {
  console.log("Purpose Of Request Configuration:", PurposeOfRequestConfig);

  const [formData, setFormData] = React.useState<{ [key: string]: any }>({});
  const [permissionData, setPermissionData] = React.useState<string[]>([]);

  // ✅ Load initial data only once when editing
  React.useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);
    }
  }, [initialData]);

  // ✅ Notify parent ONLY when local data actually changes
  const prevDataRef = React.useRef<any>(formData);
  React.useEffect(() => {
    const prev = JSON.stringify(prevDataRef.current);
    const curr = JSON.stringify(formData);
    if (prev !== curr) {
      prevDataRef.current = formData;
      onFormDataChange(formData);
    }
  }, [formData]);

  React.useEffect(() => {
    const loadTemplateData = async () => {
      if (!PurposeOfRequestTemplate) return;

      try {
        const response = await getGuestTemplateData(PurposeOfRequestTemplate);

        // Assuming response is an array of list items
        // and each item has a "Title" column
        const titlesArray = response?.map((item: any) => item.Title || "");

        setPermissionData(titlesArray);
      } catch (error) {
        console.error("Error fetching guest template data:", error);
      }
    };

    loadTemplateData();
  }, [PurposeOfRequestTemplate]);


  // Filter out disabled fields
  const activeFields = PurposeOfRequestConfig?.filter((f) => !f.isDisabled);

  // Handle field value changes
  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Field renderer
  const renderInputField = (field: any) => {

    const key = field.Internalname || field.selectedColumn;

    const commonProps = {
      id: key,
      name: key,
      placeholder: field.placeholder || field.title || '',
      required: field.isfieldrequired || false,
      disabled: field.isDisabled || false,
      className:
        field.Internalname === "Other"
          ? styles.formTextarea
          : styles.formInput,
      value: formData[key] || '',
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      ) => {
        handleChange(key, e.target.value);

        // Clear DirectoryName when this field changes (e.g. PurposeOfRequest)
        if (key === "PuroseOfRequest") {
          handleChange("DirectoryName", "");
        }
      }
    };

    const options =
      permissionData?.map((opt: any) => ({
        value: opt,
        label: opt
      })) || [];


    switch ((field.columnType || '').toLowerCase()) {
      case 'email':
        return <> <input type="email" {...commonProps} disabled={ViewMode} /> {ShowValidation && field.isfieldrequired && commonProps.value == "" ? <><span style={{ color: 'red', textAlign: 'right', direction: 'rtl', float: 'right' }}>שדה חובה</span></> : ""}</>;

      case 'number':
        return <> <input type="number" {...commonProps} disabled={ViewMode} /> {ShowValidation && field.isfieldrequired && commonProps.value == "" ? <><span style={{ color: 'red', textAlign: 'right', direction: 'rtl', float: 'right' }}>שדה חובה</span></> : ""}</>;

      case 'date':
      case 'datetime':
        return (
          <>
            <input
              type="date"
              {...commonProps} disabled={ViewMode}
              value={
                formData[key]
                  ? new Date(formData[key]).toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) => handleChange(key, e.target.value)}
            />
            {ShowValidation && field.isfieldrequired && commonProps.value == "" ? <><span style={{ color: 'red', textAlign: 'right', direction: 'rtl', float: 'right' }}>שדה חובה</span></> : ""}</>
        );

      case 'choice':
        if (field.Internalname == "DirectoryName" && formData["PuroseOfRequest"] == "לטובת הרשאות למערכות") {
          return (
            <>
              {/* <select {...commonProps} className={styles.formSelect} disabled={ViewMode}>
                <option value="">בחר...</option>
                {permissionData?.map((opt: any, idx: number) => (
                  <option key={idx} value={opt}>
                    {opt}
                  </option>
                ))}
              </select> */}
              <Select
                className={styles.formSelect2}
                isDisabled={ViewMode}
                value={options.find((o: any) => o.value === formData[key]) || null}
                options={options}
                placeholder="בחר..."
                onChange={(selected: any) => {
                  handleChange(key, selected?.value || "");

                  // Clear DirectoryName when Purpose changes
                  if (key === "PuroseOfRequest") {
                    handleChange("DirectoryName", "");
                  }
                }}

                isSearchable={true}
                isClearable={true}
                menuPortalTarget={document.body}
                // styles={{
                //   control: (base: any) => ({
                //     ...base,
                //     border: '2px solid #d0d3da',
                //     boxShadow: 'none',
                //     backgroundColor: 'transparent',
                //     minHeight: '36px',
                //     '&:hover': {
                //       border: '2px solid #6574cd',
                //       borderRadius: '12px'
                //     }
                //   }),
                //   indicatorSeparator: () => ({ display: 'none' }),
                //   menu: (base: any) => ({
                //     ...base,
                //     zIndex: 9999
                //   })
                // }}
                styles={{
                  control: (base: any) => ({
                    ...base,
                    direction: 'rtl',
                    textAlign: 'right',
                    border: '2px solid #d0d3da',
                    boxShadow: 'none',
                    backgroundColor: 'transparent',
                    minHeight: '51px',
                    bordrradius:'12px',
                    '&:hover': {
                      border: '2px solid #6574cd',
                      borderRadius: '12px'
                    }
                  }),
                  valueContainer: (base: any) => ({
                    ...base,
                    direction: 'rtl',
                    justifyContent: 'flex-start'
                  }),
                  input: (base: any) => ({
                    ...base,
                    direction: 'rtl',
                    textAlign: 'right'
                  }),
                  singleValue: (base: any) => ({
                    ...base,
                    direction: 'rtl',
                    textAlign: 'right'
                  }),
                  placeholder: (base: any) => ({
                    ...base,
                    direction: 'rtl',
                    textAlign: 'right'
                  }),
                  menu: (base: any) => ({
                    ...base,
                    direction: 'rtl',
                    textAlign: 'right',
                    zIndex: 9999,
                    fontFamily: 'Rubik, Arial, sans-serif',
                  }),
                  indicatorSeparator: () => ({
                    display: 'none'
                  }),
                  dropdownIndicator: (base: any) => ({
                    ...base,
                    padding: '4px'
                  })
                }}
              />

              {ShowValidation && field.isfieldrequired && commonProps.value == "" ? <><span style={{ color: 'red', textAlign: 'right', direction: 'rtl', float: 'right' }}>שדה חובה</span></> : ""}
            </>
          );

        } else if (field.Internalname == "DirectoryName" && formData["PuroseOfRequest"] != "לטובת הרשאות למערכות") {
          return (
            <> <textarea disabled={ViewMode} className={styles.formTextarea} value={commonProps.value} onChange={(e) => handleChange(key, e.target.value)} /> {ShowValidation && field.isfieldrequired && commonProps.value == "" ? <><span style={{ height: '90px', color: 'red', textAlign: 'right', direction: 'rtl', float: 'right' }}>שדה חובה</span></> : ""}</>
          )

        }
        else {
          return (
            <>
              <select {...commonProps} className={styles.formSelect} disabled={ViewMode}>
                <option value="">בחר...</option>
                {field.options?.map((opt: any, idx: number) => (
                  <option key={idx} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {ShowValidation && field.isfieldrequired && commonProps.value == "" ? <><span style={{ color: 'red', textAlign: 'right', direction: 'rtl', float: 'right' }}>שדה חובה</span></> : ""}
            </>
          );
        }

      case 'boolean':
        return (
          <> <input
            type="checkbox" disabled={ViewMode}
            checked={!!formData[key]}
            onChange={(e) => handleChange(key, e.target.checked)}
            className={styles.formCheckbox}
          />
            {ShowValidation && field.isfieldrequired && commonProps.value == null ? <><span style={{ color: 'red', textAlign: 'right', direction: 'rtl', float: 'right' }}>שדה חובה</span></> : ""}</>
        );

      case 'note':
        return (
          <> <textarea disabled={ViewMode} className={styles.formTextarea} value={commonProps.value} onChange={(e) => handleChange(key, e.target.value)} /> {ShowValidation && field.isfieldrequired && commonProps.value == "" ? <><span style={{ height: '90px', color: 'red', textAlign: 'right', direction: 'rtl', float: 'right' }}>שדה חובה</span></> : ""}</>
        )

      default:
        return <> <input type="text" {...commonProps} disabled={ViewMode} /> {ShowValidation && field.isfieldrequired && commonProps.value == "" ? <><span style={{ color: 'red', textAlign: 'right', direction: 'rtl', float: 'right' }}>שדה חובה</span></> : ""}</>;
    }
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>מטרת הבקשה</h2>

      <div className={styles.formGrid}>


        {/*         
        {activeFields?.map((field: any, index: number) => (

          (field.Internalname == "Other" ? (formData["PuroseOfRequest"] == "אחר (מלל חופשי)" ? <div key={index} className={styles.formGroup}>

            <label
              htmlFor={field.Internalname || field.selectedColumn}
              className={styles.formLabel}
            >
              {field.title}
              {field.isfieldrequired && (
                <span className={styles.requiredStar}> *</span>
              )}
            </label>

            {renderInputField(field)}

          </div> : "") : 

          <div key={index} className={styles.formGroup}>
            <label
              htmlFor={field.Internalname || field.selectedColumn}
              className={styles.formLabel}
            >
              {field.title}
              {field.isfieldrequired && (
                <span className={styles.requiredStar}> *</span>
              )}
            </label>
            {renderInputField(field)}
          </div>)

        ))} */}

        {activeFields?.map((field: any, index: number) => {

          // CASE 1: Purpose Of Request → Other
          if (
            field.Internalname === "Other" &&
            formData["PuroseOfRequest"] !== "אחר (מלל חופשי)"
          ) {
            return null;
          }

          // CASE 2: Directory Name → Other Permission
          if (
            field.Internalname === "OtherPermission" &&
            formData["DirectoryName"] !== "אחר"
          ) {
            return null;
          }

          return (
            <div key={index} className={styles.formGroup}>
              <label
                htmlFor={field.Internalname || field.selectedColumn}
                className={styles.formLabel}
              >
                {field.title}
                {field.isfieldrequired && (
                  <span className={styles.requiredStar}> *</span>
                )}
              </label>

              {renderInputField(field)}
            </div>
          );
        })}




      </div>
    </div>
  );
};

export default PurposeOfRequest;
