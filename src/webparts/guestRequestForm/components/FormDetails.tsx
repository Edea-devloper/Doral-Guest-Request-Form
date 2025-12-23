import * as React from "react";
import styles from "./GuestRequestForm.module.scss";
import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { getUserIdByEmail } from "../Utility/utils";

export interface IFormDetailsProps {
  FormDetailsConfig: any[];
  context: any;
  list: string;
  initialData?: any; // for update form
  formIdDisplay?: string; // 👈 added for displaying form id like Auto-001 or actual ID
  onFormDataChange: (data: any) => void; // pass data to parent
  ShowValidation: boolean;
  currentUserDepartment: string
  ViewMode: boolean;
}

const FormDetails: React.FC<IFormDetailsProps> = ({
  FormDetailsConfig,
  context,
  list,
  initialData = {},
  formIdDisplay,
  onFormDataChange,
  ShowValidation, currentUserDepartment, ViewMode
}) => {


  const [formData, setFormData] = React.useState<{ [key: string]: any }>({});

  React.useEffect(() => {
    const updateUserId = async () => {
      if (!formData?.ApplicantsNameId && formData?.ApplicantsName?.EMail) {
        const tempID = await getUserIdByEmail(formData.ApplicantsName.EMail);
        if (tempID) {
          setFormData((prev: any) => ({
            ...prev,
            ApplicantsNameId: tempID,
          }));
        }
      }
    };

    updateUserId();
  }, [formData?.ApplicantsName?.EMail]);

  // React.useEffect(() => {
  //     formData.ApplicantsDepartment == "" ?  formData.ApplicantsDepartment = currentUserDepartment : "";
  // }, [currentUserDepartment]);

  // Filter active (non-disabled) fields
  const activeFields = FormDetailsConfig?.filter((f) => !f.isDisabled);

  // Initialize form data if editing
  React.useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Notify parent when formData changes
  React.useEffect(() => {
    onFormDataChange(formData);
  }, [formData]);

  // Handle field changes
  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Render input dynamically by field type
  const renderInputField = (field: any) => {
    const key = field.Internalname || field.selectedColumn;
    const rawValue = formData[key];
    const normalizedValue =
      typeof rawValue === "object"
        ? rawValue?.EMail || rawValue?.Title || rawValue?.Name || ""
        : rawValue || "";

    // If it's a date column, convert value to yyyy-MM-dd format
    const formattedValue =
      (field.columnType || "").toLowerCase().includes("date") && normalizedValue
        ? new Date(normalizedValue).toISOString().split("T")[0]
        : normalizedValue;

    const commonProps = {
      id: key,
      name: key,
      placeholder: field.placeholder || field.title || "",
      required: field.isfieldrequired || false,
      className: styles.formInput,
      value: formattedValue || "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        handleChange(key, e.target.value),
    };

    switch ((field.columnType || "").toLowerCase()) {
      case "email":
        return (
          <>
            <input type="email" {...commonProps} disabled={ViewMode} />
            {ShowValidation &&
              field.isfieldrequired &&
              commonProps.value == "" ? (
              <>
                <br />
                <span
                  style={{
                    color: "red",
                    textAlign: "right",
                    direction: "rtl",
                    float: "right",
                  }}
                >
                  שדה חובה
                </span>
              </>
            ) : (
              ""
            )}
          </>
        );
      case "number":
        return (
          <>
            <input type="number" {...commonProps} disabled={ViewMode} />
            {ShowValidation &&
              field.isfieldrequired &&
              commonProps.value == "" ? (
              <>
                <br />
                <span
                  style={{
                    color: "red",
                    textAlign: "right",
                    direction: "rtl",
                    float: "right",
                  }}
                >
                  שדה חובה
                </span>
              </>
            ) : (
              ""
            )}
          </>
        );
      case "date":
      case "datetime": {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const formattedDate = `${yyyy}-${mm}-${dd}`;

        return (
          <>
            <input
              type="date"
              {...commonProps} disabled={ViewMode}
              value={commonProps.value || formattedDate}
              onChange={(e) => handleChange(key, e.target.value)}
              style={{ textAlign: "right" }}
            />
            {ShowValidation &&
              field.isfieldrequired &&
              !commonProps.value.trim() && (
                <>
                  <br />
                  <span
                    style={{
                      color: "red",
                      textAlign: "right",
                      direction: "rtl",
                      float: "right",
                    }}
                  >
                    שדה חובה
                  </span>
                </>
              )}
          </>
        );
      }
      case "choice":
        return (
          <>
            <select {...commonProps} disabled={ViewMode}>
              <option value="">בחר...</option>
              {field.options?.map((opt: any, idx: number) => (
                <option key={idx} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {ShowValidation &&
              field.isfieldrequired &&
              commonProps.value == "" ? (
              <>
                <br />
                <span
                  style={{
                    color: "red",
                    textAlign: "right",
                    direction: "rtl",
                    float: "right",
                  }}
                >
                  שדה חובה
                </span>
              </>
            ) : (
              ""
            )}
          </>
        );
      case "multichoice":
        return (
          <>
            <select
              {...commonProps}
              multiple
              value={formData[key] || []}
              onChange={(e) =>
                handleChange(
                  key,
                  Array.from(e.target.selectedOptions, (opt) => opt.value)
                )
              }
            >
              {field.options?.map((opt: any, idx: number) => (
                <option key={idx} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {ShowValidation &&
              field.isfieldrequired &&
              formData[key] == undefined ? (
              <>
                <br />
                <span
                  style={{
                    color: "red",
                    textAlign: "right",
                    direction: "rtl",
                    float: "right",
                  }}
                >
                  שדה חובה
                </span>
              </>
            ) : (
              ""
            )}
          </>
        );
      case "boolean":
        return (
          <>
            <input
              type="checkbox"
              checked={formData[key] || false}
              onChange={(e) => handleChange(key, e.target.checked)}
              className={styles.formCheckbox}
            />
            {ShowValidation &&
              field.isfieldrequired &&
              formData[key] == null ? (
              <>
                <br />
                <span
                  style={{
                    color: "red",
                    textAlign: "right",
                    direction: "rtl",
                    float: "right",
                  }}
                >
                  שדה חובה
                </span>
              </>
            ) : (
              ""
            )}
          </>
        );

      case "user": {
        const selectedEmail = formData?.[key]?.EMail ?? "";
        const selectedUserId = formData?.[key + "Id"] ?? null;
        // Determine default value for PeoplePicker (email array)
        const defaultUser = (key === "ApplicantsName" ? [selectedEmail] : [])


        const renderPicker = () => (
          <>
            <PeoplePicker
              key={field.uniqueId}
              context={context}
              titleText=""
              personSelectionLimit={1}
              ensureUser={true}
              required={field.isfieldrequired}
              showtooltip={true}
              principalTypes={[PrincipalType.User]}
              disabled={ViewMode}
              resolveDelay={500}
              defaultSelectedUsers={defaultUser}
              onChange={(items: any[]) => {
                const user = items && items.length > 0 ? items[0] : null;
                handleChange(key + "Id", user ? user.id : null);
                handleChange(
                  key,
                  user
                    ? {
                      Id: user.Id,
                      EMail: user.secondaryText ?? "",
                      Title: user.text ?? "",
                    }
                    : null
                );
              }}
            />
            {ShowValidation &&
              field.isfieldrequired &&
              !(
                selectedUserId ||
                (selectedEmail && selectedEmail.trim() !== "")
              ) && (
                <span
                  style={{
                    color: "red",
                    textAlign: "right",
                    direction: "rtl",
                    float: "right",
                  }}
                >
                  שדה חובה
                </span>
              )}
          </>
        );

        return renderPicker();
      }

      case "text": {
        //const defaultUserEmail = context?.pageContext?.user?.email || "";
        if (key === "ApplicantsEmail") {
          //const emailValue = commonProps.value && commonProps.value.trim() !== "" ? commonProps.value : defaultUserEmail;
          return (
            <>
              <input
                type="email" disabled={ViewMode}
                {...commonProps}
                value={commonProps.value}
                onChange={(e) => handleChange(key, e.target.value)}
                style={{ textAlign: "right" }}
              />
              {ShowValidation && field.isfieldrequired && (formData[key] == "" || formData[key] == null) && (
                <>
                  <br />
                  <span
                    style={{
                      color: "red",
                      textAlign: "right",
                      direction: "rtl",
                      float: "right",
                    }}
                  >
                    שדה חובה
                  </span>
                </>
              )}
            </>
          );
        }
        // if (key === "ApplicantsDepartment") {
        //   const DefaultValue = currentUserDepartment;
        //   (formData[key] == "" ? formData[key] = currentUserDepartment : "")
        //   return (
        //     <>
        //       <input
        //         type="text" disabled={ViewMode}
        //         // {...commonProps}
        //         placeholder={commonProps.placeholder}
        //         className={commonProps.className}
        //         value={(formData[key] == "" ? DefaultValue : formData[key])}
        //         onChange={(e) => handleChange(key, e.target.value)}
        //         style={{ textAlign: "right" }}
        //       />
        //       {ShowValidation && field.isfieldrequired && (formData[key] == "") && (
        //         <>
        //           <br />
        //           <span style={{ color: "red", textAlign: "right", direction: "rtl", float: "right", }}>שדה חובה</span>
        //         </>
        //       )}
        //     </>
        //   );
        // }
        if (key === "ApplicantsDepartment") {
          React.useEffect(() => {
            const defaultUserEmail = context?.pageContext?.user?.email || "";
            if (!formData[key] && currentUserDepartment) {
              handleChange(key, currentUserDepartment);
            }
            (formData["ApplicantsEmail"] == "" || formData["ApplicantsEmail"] == null ? formData["ApplicantsEmail"] = defaultUserEmail : "")
          }, [currentUserDepartment]);

          return (
            <>
            <input
              type="text"
              disabled={ViewMode}
              {...commonProps}
              value={formData[key] || ""}
              onChange={(e) => handleChange(key, e.target.value)}
              style={{ textAlign: "right" }}
            />
                          {ShowValidation && field.isfieldrequired && (formData[key] == "" || formData[key] == null) && (
                <>
                  <br />
                  <span style={{ color: "red", textAlign: "right", direction: "rtl", float: "right", }}>שדה חובה</span>
                </>
              )}
            </>
          );
        }

        // ✅ For all other text fields
        return (
          <>
            <input
              type="text" disabled={ViewMode}
              {...commonProps}
              onChange={(e) => handleChange(key, e.target.value)}
              style={{ textAlign: "right" }}
            />
            {ShowValidation &&
              field.isfieldrequired &&
              (!commonProps.value || commonProps.value === "") && (
                <>
                  <br />
                  <span
                    style={{
                      color: "red",
                      textAlign: "right",
                      direction: "rtl",
                      float: "right",
                    }}
                  >
                    שדה חובה
                  </span>
                </>
              )}
          </>
        );
      }

      default:
        return (
          <>
            <input type="text" {...commonProps} disabled={ViewMode} />
            {ShowValidation &&
              field.isfieldrequired &&
              commonProps.value == "" ? (
              <>
                <span
                  style={{
                    color: "red",
                    textAlign: "right",
                    direction: "rtl",
                    float: "right",
                  }}
                >
                  שדה חובה
                </span>
              </>
            ) : (
              ""
            )}
          </>
        );
    }
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>פרטי הטופס</h2>

      <div className={styles.formGrid}>
        {/* ✅ Static Form ID (Auto/Real) */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>מס' טופס</label>
          <input
            type="text"
            className={styles.formInput}
            readOnly
            value={formIdDisplay || "Auto-001"}
          />
        </div>

        {activeFields?.map((field: any, index: number) => (
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
        ))}
      </div>
    </div>
  );
};

export default FormDetails;
