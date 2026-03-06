import * as React from "react";
import styles from "./GuestRequestForm.module.scss";
import "@fortawesome/fontawesome-free/css/all.min.css";
import type { IGuestRequestFormProps } from "./IGuestRequestFormProps";
import FormDetails from "./FormDetails";
import GuestInfoSection from "./GuestInfo";
import PurposeOfRequest from "./PurposeOfRequest";
import {
  deleteGuestInfoItems,
  getGuestTemplateData,
  getListItemById,
  getNextListItemId,
  getUserDepartment,
  saveGuestInfoItems,
  saveListItem,
} from "../Utility/utils";
import ApprovalProcess from "./ApprovalConfig";
import { Dialog, DialogType, DialogFooter } from "@fluentui/react/lib/Dialog";
import { PrimaryButton, DefaultButton } from "@fluentui/react/lib/Button";


const GuestRequestForm: React.FC<IGuestRequestFormProps> = ({
  list,
  FormDetailsConfig,
  GuestInfoList,
  GuestInfoConfig,
  PurposeOfRequestConfig,
  ApprovalConfigData, ContactListSite, ContactListName, DepartmentColumnName, DashboardUrl, GuestInfoListTemplate,PurposeOfRequestTemplate,
  context,dashboardTitle
}) => {
  const [FormID, setFormID] = React.useState<number | null>(null);
  const [stepOrderInitial, setstepOrderInitial] = React.useState<number>(1);
  const [TempFormID, setTempFormID] = React.useState<number | null>(null);
  const [ShowValidation, setShowValidation] = React.useState<boolean>(false);
  const [formData, setFormData] = React.useState<any>({});
  const [formDate, setFormDate] = React.useState<any>("");
  const [currentUserDepartment, setcurrentUserDepartment] = React.useState<any>("");
  const [guestInfo, setGuestInfo] = React.useState<{
    rows: any[];
    deletedIds: number[];
  }>({
    rows: [],
    deletedIds: [],
  });
  const [guestRows, setGuestRows] = React.useState<any[]>([]);
  const [guestTemplate, setGuestTemplate] = React.useState<any[]>([]);
  const [ApprovalConfig, setApprovalConfig] = React.useState<any[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [showPopup, setShowPopup] = React.useState(false);
  const [popupAction, setPopupAction] = React.useState<"approve" | "reject" | null>(null);
  const [popupNote, setPopupNote] = React.useState("");
  const [ViewMode, setViewMode] = React.useState(false);



  // 🔹 Fetch existing form data if formId param is in URL
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const formId = params.get("formId");
        setFormID(Number(formId));
        if (formId && list) {
          console.log("Fetching existing item with ID:", formId);
          const item = await getListItemById(list, Number(formId));
          console.log("Fetched item data:", item);
          setFormData(item);
          setstepOrderInitial(item?.StepOrder);
          (item?.StepOrder > 1 ? setViewMode(true) : setViewMode(false))
          const approvalConfig = item.ApprovalConfig ? JSON.parse(item.ApprovalConfig) : [];
          setApprovalConfig(approvalConfig);
          setFormDate(
            new Date(item.Created).toLocaleString("he-IL", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })
          );
        } else {
          setTempFormID(await getNextListItemId(list));
          const userDepartment = await getUserDepartment(ContactListSite, ContactListName, "Title", DepartmentColumnName, context?.pageContext?.user?.email);
          setcurrentUserDepartment(userDepartment);
          setApprovalConfig(ApprovalConfigData);
          setViewMode(false)
          setFormDate(
            new Date().toLocaleString("he-IL", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })
          );
          const loadGuestInfoFromTemplate = async () => {
            try {
              // 1️⃣ Fetch all GuestTemplate list data
              const templateItems = await getGuestTemplateData(GuestInfoListTemplate);

              if (!templateItems || templateItems.length === 0) {
                console.warn("⚠️ No data found in GuestTemplate list");
                setGuestTemplate([]);
                return;
              }

              // 2️⃣ Extract column internal names from config
              const configColumns = GuestInfoConfig.map((col) => col.Internalname || col.selectedColumn);

              // 3️⃣ Map only columns that exist in template item
              const mappedRows = templateItems.map((item: any) => {
                const newRow: any = {};
                configColumns.forEach((colName) => {
                  if (item.hasOwnProperty(colName)) {
                    newRow[colName] = item[colName];
                  } else {
                    newRow[colName] = ""; // default empty value
                  }
                });
                return newRow;
              });

              // 4️⃣ Set mapped rows into guestRows state
              console.log("Guest rows loaded from template:", mappedRows);
              setGuestTemplate(mappedRows);
            } catch (error) {
              console.error("❌ Error loading guest info from template:", error);
              setGuestTemplate([]);
            }
          };

          await loadGuestInfoFromTemplate();
        }
      } catch (err) {
        console.error("Error fetching form data:", err);
      }
    };

    fetchData();
  }, [list]);

  // Handle form save (main form + guest info)
  const handleSave = async (stepOrder: number, ApprovalConfigVal: any, approvedBy?: string) => {
    // Combine all configurations
    const allConfigs = [
      ...(FormDetailsConfig || []),
      ...(PurposeOfRequestConfig || []),
      // GuestInfoConfig excluded here because we validate it separately
    ];

    // Filter only required & active (non-disabled) fields
    const requiredFields = allConfigs.filter(
      (f) => f.isfieldrequired && !f.isDisabled
    );

    // Find missing or empty required fields
    const missingFields = requiredFields.filter((f) => {
      const key = f.Internalname || f.selectedColumn;
      const value = formData[key];

      // Handle PeoplePicker
      if (Array.isArray(value)) return value.length === 0;
      // Handle checkbox (boolean)
      if (typeof value === "boolean") return false;
      // Handle empty strings or undefined
      return value === undefined || value === null || value === "";
    });

    // Validate Guest Info Rows
    const requiredGuestFields = (GuestInfoConfig || []).filter(
      (f) => f.isfieldrequired && !f.isDisabled
    );

    let guestRowErrors: number[] = [];

    let invalidEmail = false; // add flag before loop

    if (guestRows && guestRows.length > 0) {
      guestRows.forEach((row, rowIndex) => {
        const rowMissing = requiredGuestFields.some((f) => {
          const key = f.Internalname || f.selectedColumn;
          const value = row[key];

          if (key === "CorporateEmail") {
            const corporateEmail = row[key];
            const publicDomainPattern = /@(gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|live\.com|aol\.com|icloud\.com|mail\.com|msn\.com)$/i;

            if (!corporateEmail || publicDomainPattern.test(corporateEmail) || !(corporateEmail.includes('.')) || !(corporateEmail.includes('@'))) {
              setShowValidation(true);
              alert("שדה חובה");
              invalidEmail = true;
            }
          }

          return value === undefined || value === null || value === '';
        });
        if (rowMissing) guestRowErrors.push(rowIndex + 1);
      });
    }

    // Stop save if invalid email found
    if (invalidEmail) {
      return; // stop execution — no data saved
    }
    const emailValues = guestRows
      ?.map((r) => r?.CorporateEmail?.toLowerCase())
      ?.filter(Boolean);

    const hasDuplicate =
      emailValues?.some((val, idx) => emailValues.indexOf(val) !== idx) || false;

    if (hasDuplicate) {
      alert("Duplicate email detected — please enter unique values.");
      return;
    }


    // If missing fields found — stop saving
    // In Draft mode (stepOrder = 1) → allow save even if required fields are missing 
    if (stepOrder !== 1) {
      if (missingFields.length > 0 || guestRowErrors.length > 0) {
        const fieldNames = missingFields.map((f) => f.Internalname).join(", ");
        console.log("Missing Main Form Fields:", fieldNames);

        if (guestRowErrors.length > 0) {
          console.log("Guest Info Rows with Errors:", guestRowErrors.join(", "));
        }

        setShowValidation(true);
        setApprovalConfig(ApprovalConfig);
        alert("אנא מלא את כל השדות החובה לפני שמירה");
        return;
      }
    }

    setSaving(true);
    try {
      // Step 1: Save or update main form
      const result = await saveListItem(list, formData, stepOrder, ApprovalConfigVal, FormID || undefined, approvedBy);
      if (!result.success) throw new Error("Main form save failed");

      const savedFormId = result.result.ID;

      // Step 2: Save Guest Info (add/update)
      if (guestInfo.rows.length > 0) {
        await saveGuestInfoItems(GuestInfoList, savedFormId, guestInfo.rows);
      }

      // Step 3: Delete marked guest items
      if (guestInfo.deletedIds.length > 0) {
        await deleteGuestInfoItems(GuestInfoList, guestInfo.deletedIds);
      }

      alert(
        `Form ${result.action === "add" ? "saved" : "updated"} successfully!`
      );
    } catch (error) {
      console.error("Error saving form:", error);
      alert("Error saving form. Check console for details.");
    } finally {
      setSaving(false);
      window.location.href = DashboardUrl
    }
  };


  // ✅ Prefill default values (date, current user email, etc.)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const formId = params.get("formId");
    if (!formId) {
      const defaults: any = {};

      FormDetailsConfig.forEach((field) => {
        const key = field.Internalname || field.selectedColumn;
        if (!key) return;

        // Skip if value already exists (from initialData)
        if (formData[key] && key !== "ApplicantsDepartment") return;

        const columnType = (field.columnType || "").toLowerCase();

        // 🗓 Prefill date fields with today's date (formatted as yyyy-MM-dd)
        if (columnType.includes("date")) {
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, "0");
          const dd = String(today.getDate()).padStart(2, "0");
          defaults[key] = `${yyyy}-${mm}-${dd}`;
        }

        if (columnType === "text" && key === "ApplicantsDepartment") {
          defaults[key] = "";
        }

        // 📧 Prefill current user's email
        if (key === "ApplicantsEmail" && context?.pageContext?.user?.email) {
          defaults[key] = context.pageContext.user.email;
        }

        // 👤 Prefill current user name in PeoplePicker
        if (key === "ApplicantsName" && context?.pageContext?.user) {
          defaults[key] = {
            EMail: context.pageContext.user.email,
            Title: context.pageContext.user.displayName,
          };
          defaults[key + "Id"] = context.pageContext.user.id || null;
        }

      });

      // Update formData with these defaults
      if (Object.keys(defaults).length > 0) {
        setFormData((prev: any) => ({ ...defaults, ...prev }));
      }
    }


  }, [FormDetailsConfig, context]);

  // 🔹 Open popup
  const openPopup = (action: "approve" | "reject") => {
    setPopupAction(action);
    setPopupNote("");
    action === "reject" ? setShowPopup(true) : handlePopupSubmit();
  };

  const handlePopupSubmit = () => {
    //Removed this logic as per uziya's request
    // if (popupAction === "reject" && !popupNote.trim()) {
    //   alert("יש להזין הערה לפני דחייה");
    //   return;
    // }

    const updatedApprovalConfig = ApprovalConfig.map((step: any) => {
      const stepOrderNum = Number(step.StepOrder);
      const currentStepNum = Number(stepOrderInitial);
      const nextStepNum = currentStepNum + 1;

      // ✅ Update current step (approve/reject)
      if (stepOrderNum === currentStepNum) {
        return {
          ...step,
          date: new Date().toLocaleString("he-IL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }),
          notes: popupNote.trim() || "-",
          status: popupAction === "approve" ? "הושלם" : "נדחה",
        };
      }

      // ✅ If approved → mark next step as pending or final “done” if StepOrder=4
      if (popupAction === "approve" && stepOrderNum === nextStepNum) {
        return {
          ...step,
          status: stepOrderNum == 4 ? "בוצע" : "ממתין לאישור",
        };
      }

      return step;
    });

    const currentUserName = context?.pageContext?.user?.displayName || "Unknown User";

    // 🧠 Update local state
    console.log("hfdisvgkdfv", updatedApprovalConfig);
    setApprovalConfig(updatedApprovalConfig);

    // 🧩 Determine next step or rejection
    const nextStep = popupAction === "approve" ? stepOrderInitial + 1 : -1;

    // 💾 Call your save function with serialized approval config
    handleSave(nextStep, JSON.stringify(updatedApprovalConfig), currentUserName);
    setShowPopup(false);
  };

  const updatedApprovalConfigForSave = (
    stepOrder: number,
    ApprovalConfig: any[],
    popupNote: string,
    popupAction: "approve" | "reject"
  ): string => {
    const updatedConfig = ApprovalConfig.map((step) => {
      const currentOrder = step.StepOrder?.toString();
      const isCurrent = currentOrder === stepOrder?.toString();
      const isNext = currentOrder === (stepOrder + 1)?.toString();

      // ✅ If current step
      if (isCurrent) {
        return {
          ...step,
          date: new Date().toLocaleString("he-IL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }),
          notes: popupNote?.trim() || "-",
          status: popupAction === "approve" ? "הושלם" : "נדחה", // Approved or Rejected
        };
      }

      // ✅ If next step (only when approved)
      if (isNext) {
        return {
          ...step,
          status: "מתמלא כעת", // In Progress
          date: step.date || "-",
          notes: step.notes || "-",
        };
      }

      // Default
      return step;
    });

    return JSON.stringify(updatedConfig);
  };

const[DirectApprove,SetDirectApprove]=React.useState(false);
React.useEffect(()=>{
  setPopupAction("approve");
},[DirectApprove])


  return (
    <div className={styles.pageWrapper} dir="rtl">
      <div className={styles.container}>
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.formNumber}>
            טופס #{FormID == 0 ? (formData?.ID ? formData.ID.toString() : TempFormID) : FormID} <br /> {formDate}{" "}
          </div>
          <div className={styles.headerContent}>
            <h1>{dashboardTitle}</h1>
            <div className={styles.statusBadge}>
              <i className="fas fa-circle"></i> טופס חדש
            </div>
          </div>
        </div>

        {/* FORM CONTENT */}
        <div className={styles.formContent}>
          <FormDetails
            FormDetailsConfig={FormDetailsConfig}
            context={context}
            list={list}
            onFormDataChange={setFormData}
            initialData={formData}
            formIdDisplay={formData?.ID ? formData.ID.toString() : TempFormID}
            ShowValidation={ShowValidation}
            currentUserDepartment={currentUserDepartment}
            ViewMode={ViewMode}
          />

          {/* SECTION: פרטי האורחים */}
          <GuestInfoSection
            context={context}
            GuestInfoConfig={GuestInfoConfig}
            parentFormId={FormID || formData.ID}
            isEditMode={!!FormID}
            onGuestDataChange={(data) => {
              setGuestInfo(data);
              setGuestRows(data.rows);
            }}
            GuestInfoList={GuestInfoList}
            ShowValidation={ShowValidation}
            defaultRows={guestTemplate}
            ViewMode={ViewMode}
          />

          {/* SECTION: מטרת הבקשה */}
          <PurposeOfRequest
            PurposeOfRequestConfig={PurposeOfRequestConfig}
            initialData={formData}
            onFormDataChange={(updatedData) =>
              setFormData((prev: any) => ({ ...prev, ...updatedData }))
            }
            ShowValidation={ShowValidation} ViewMode={ViewMode} PurposeOfRequestTemplate={PurposeOfRequestTemplate}
          />

          {/* SECTION: תהליך אישורים */}
          <ApprovalProcess ApprovalConfigData={ApprovalConfig} currentStepOrder={stepOrderInitial} />


          {/* ACTIONS */}
          {/* Draft and Draft Edit */}
          {stepOrderInitial == 1 ?
            <div className={styles.formActions}>
              <button
                onClick={() => handleSave(stepOrderInitial + 1, updatedApprovalConfigForSave(stepOrderInitial, ApprovalConfig, "", "approve"))}
                disabled={saving}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                <i className="fas fa-paper-plane"></i> הגש בקשה
              </button>

              <button
                onClick={() => handleSave(stepOrderInitial, JSON.stringify(ApprovalConfig))}
                disabled={saving}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                <i className="fa-solid fa-floppy-disk"></i> שמור טיוטה
              </button>

              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => (window.location.href = DashboardUrl)}
              >
                <i className="fas fa-times"></i> ביטול
              </button>
            </div> : ""}

          {/* approval */}
          {(stepOrderInitial === 2 || stepOrderInitial === 3) && (
            <div className={styles.formActions}>
              <button
                onClick={() => {SetDirectApprove(!DirectApprove);openPopup("approve");}}
                disabled={saving}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                <i className="fa-solid fa-check"></i> אשר בקשה
              </button>

              <button
                onClick={() => openPopup("reject")}
                disabled={saving}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                <i className="fa-solid fa-xmark"></i> דחה בקשה
              </button>

              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => (window.location.href = DashboardUrl)}
              >
                <i className="fas fa-times"></i> ביטול
              </button>
            </div>
          )}


          {/* First approval */}
          {stepOrderInitial == 4 || stepOrderInitial == -1 ?
            <div className={styles.formActions}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => (window.location.href = DashboardUrl)}
              >
                <i className="fas fa-times"></i> ביטול
              </button>
            </div> : ""}

        </div>
      </div>
      <Dialog
        hidden={!showPopup}
        onDismiss={() => setShowPopup(false)}
        dialogContentProps={{
          type: DialogType.largeHeader,
          title: "הוסף תגובה",
          subText: "נא להזין הערה",
        }}
        modalProps={{
          isBlocking: true,
        }}
      >
        <textarea
          value={popupNote}
          onChange={(e) => setPopupNote(e.target.value)}
          className={styles.formInput}
          placeholder="הזן הערה כאן..."
          style={{ width: "100%", minHeight: "80px" }}
        />


        <DialogFooter>
          <PrimaryButton
            text={popupAction === "approve" ? "אישור" : "דחייה"}
            onClick={handlePopupSubmit}
          />
          <DefaultButton text="ביטול" onClick={() => setShowPopup(false)} />
        </DialogFooter>
      </Dialog>

    </div>
  );
};

export default GuestRequestForm;
