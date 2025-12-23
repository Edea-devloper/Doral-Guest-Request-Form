import * as React from 'react';
import styles from './GuestRequestForm.module.scss';

export interface IPurposeOfRequestProps {
  PurposeOfRequestConfig: any[];
  initialData?: any;
  onFormDataChange: (data: any) => void;
  ShowValidation: boolean;
  ViewMode: boolean;
}

const PurposeOfRequest: React.FC<IPurposeOfRequestProps> = ({
  PurposeOfRequestConfig,
  initialData = {},
  onFormDataChange,
  ShowValidation, ViewMode
}) => {
  console.log("Purpose Of Request Configuration:", PurposeOfRequestConfig);

  const [formData, setFormData] = React.useState<{ [key: string]: any }>({});

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
      className: (field.Internalname == "Other" ? styles.formTextarea : styles.formInput),
      value: formData[key] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        handleChange(key, e.target.value),
    };

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
            {ShowValidation && field.isfieldrequired && commonProps.value == "" ? <><span style={{ color: 'red', textAlign: 'right', direction: 'rtl', float: 'right' }}>שדה חובה</span></> : ""}</>
        );

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
