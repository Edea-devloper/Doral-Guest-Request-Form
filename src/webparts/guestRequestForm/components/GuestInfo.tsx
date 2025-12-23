import * as React from 'react';
import styles from './GuestRequestForm.module.scss';
import '@fortawesome/fontawesome-free/css/all.min.css';
import * as XLSX from 'xlsx';
import { getGuestInfoItems } from '../Utility/utils';

export interface IGuestInfoSectionProps {
    GuestInfoConfig: any[];
    GuestInfoList: string;
    parentFormId?: number;
    context: any;
    isEditMode?: boolean;
    onGuestDataChange: (data: { rows: any[]; deletedIds: number[] }) => void;
    ShowValidation: boolean;
    defaultRows: any[];
    ViewMode:boolean;
}

const GuestInfoSection: React.FC<IGuestInfoSectionProps> = ({
    GuestInfoConfig,
    GuestInfoList,
    parentFormId,
    isEditMode = false,
    context, defaultRows,ViewMode,
    onGuestDataChange, ShowValidation
}) => {
    const [rows, setRows] = React.useState<any[]>([{}]);
    const [deletedIds, setDeletedIds] = React.useState<number[]>([]);
    const [loading, setLoading] = React.useState(false);

    // ✅ Load only configured columns + ID + ParentID
    React.useEffect(() => {
        const loadGuestItems = async () => {
            if (!isEditMode || !parentFormId || !GuestInfoList) return;

            setLoading(true);
            try {
                const items = await getGuestInfoItems(GuestInfoList, parentFormId);

                const allowedKeys = GuestInfoConfig
                    ?.filter((f) => !f.isDisabled)
                    ?.map((f) => f.Internalname || f.selectedColumn)
                    ?.filter(Boolean);

                // Always keep ParentID and ID
                allowedKeys.push("ParentID", "ID");

                const filteredItems = items.map((item: { [x: string]: any; hasOwnProperty: (arg0: any) => any; }) => {
                    const filtered: Record<string, any> = {};
                    allowedKeys.forEach((key) => {
                        if (item.hasOwnProperty(key)) filtered[key] = item[key];
                    });
                    return filtered;
                });

                setRows(filteredItems.length > 0 ? filteredItems : [{}]);
            } catch (err) {
                console.error("Error loading guest info:", err);
                setRows([{}]);
            } finally {
                setLoading(false);
            }
        };
        loadGuestItems();
    }, [isEditMode, parentFormId, GuestInfoList, GuestInfoConfig]);

    // 🟩 Set default rows for NEW forms (non-edit mode)
    React.useEffect(() => {
        if (!isEditMode && defaultRows && defaultRows.length > 0) {
            console.log("✅ Setting default guest rows from template:", defaultRows);
            setRows(defaultRows);
        }
    }, [isEditMode, defaultRows]);


    // 🧠 Track all row + delete state changes in parent
    React.useEffect(() => {
        onGuestDataChange({ rows, deletedIds });
    }, [rows, deletedIds]);

    // ➕ Add Row
    const addRow = () => setRows([...rows, {}]);

    // ❌ Mark row for delete (delete later on Save)
    const markForDelete = (index: number) => {
        const rowToDelete = rows[index];
        if (rowToDelete?.ID) {
            setDeletedIds((prev) => [...prev, rowToDelete.ID]);
        }

        const updated = [...rows];
        updated.splice(index, 1);
        setRows(updated.length > 0 ? updated : []);
    };

    // ✏️ Handle field change
    const handleChange = (rowIndex: number, fieldKey: string, value: any) => {
        const updated = [...rows];
        updated[rowIndex] = { ...updated[rowIndex], [fieldKey]: value };
        setRows(updated);
    };

    const activeColumns = GuestInfoConfig?.filter((f) => !f.isDisabled) || [];

    // 📥 Excel Import
    const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e: any) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const excelData: any[] = XLSX.utils.sheet_to_json(worksheet);

            if (!excelData || excelData.length === 0) return;

            const mappedData = excelData.map((excelRow) => {
                const mappedRow: any = { ParentID: parentFormId };
                activeColumns.forEach((col) => {
                    const key = col.Internalname || col.selectedColumn;
                    const excelValue = excelRow[col.title];
                    mappedRow[key] = excelValue || '';
                });
                return mappedRow;
            });

            setRows((prev) => {
                const isInitialEmpty =
                    prev.length === 1 && Object.keys(prev[0]).length === 0;
                return [...(isInitialEmpty ? [] : prev), ...mappedData];
            });

            event.target.value = '';
        };
        reader.readAsArrayBuffer(file);
    };

    const handleImportClick = () => {
        const input = document.getElementById('excelFile') as HTMLInputElement;
        if (input) input.click();
    };

    // 📤 Excel Download Template
    const handleDownloadExcel = () => {
        if (!activeColumns || activeColumns.length === 0) return;
        const headers = activeColumns.map((col) => col.title);
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Guest Info');
        XLSX.writeFile(wb, 'GuestInfoTemplate.xlsx');
    };

    // Render table cell
    const renderCell = (field: any, rowIndex: number) => {
        const key = field.Internalname || field.selectedColumn;
        const value = rows[rowIndex]?.[key] || '';
        const placeholder = field.placeholder || field.title || '';

        switch ((field.columnType || '').toLowerCase()) {
            case 'choice':
                return (
                    <> <select
                        className={styles.tableSelect} disabled={ViewMode}
                        value={value}
                        onChange={(e) => handleChange(rowIndex, key, e.target.value)}
                        required={field.isfieldrequired}
                    >
                        <option value="">בחר...</option>
                        {field.options?.map((opt: any, i: number) => (
                            <option key={i} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>{ShowValidation && field.isfieldrequired && value == "" ? <><span style={{ color: 'red', textAlign: 'right', direction: 'rtl', float: 'right' }}>שדה חובה</span></> : ""}</>
                );
            case 'email':
                return (
                    <>
                        <input
                            type="email"
                            className={styles.tableInput} disabled={ViewMode}
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => handleChange(rowIndex, key, e.target.value)}
                            required={field.isfieldrequired}
                        />
                        {ShowValidation && field.isfieldrequired && value == "" ? <><span style={{ color: 'red', textAlign: 'right', direction: 'rtl', float: 'right' }}>שדה חובה</span></> : ""}</>
                );
            default:

                const isCorporateEmail = field.Internalname === "CorporateEmail";
                const valueTrimmed = (typeof value === "string" ? value : typeof value === "number" ? String(value) : "").trim();
                // const valueTrimmed = (value?.trim() || "");

                // strict pattern that requires "@" and a dot
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const publicDomainPattern = /@(gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|live\.com|aol\.com|icloud\.com|mail\.com|msn\.com)$/i;

                let isInvalidEmail = false;

                if (isCorporateEmail) {
                    if (
                        !valueTrimmed ||                       
                        !emailPattern.test(valueTrimmed) ||   
                        publicDomainPattern.test(valueTrimmed) 
                    ) {
                        isInvalidEmail = true;
                    }
                }

                const showError =
                    ShowValidation &&
                    field.isfieldrequired &&
                    isInvalidEmail;

                return (
                    <>
                        <input disabled={ViewMode}
                            type={field.columnType?.toLowerCase() === "email" ? "email" : "text"}
                            className={styles.tableInput}
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => handleChange(rowIndex, key, e.target.value)}
                            required={field.isfieldrequired}
                        />
                        {/* {showError && (
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
                        )} */}
                        {(ShowValidation && field.columnType?.toLowerCase() !== "email" && field.isfieldrequired && value == "") || showError? <><span style={{ color: 'red', textAlign: 'right', direction: 'rtl', float: 'right' }}>שדה חובה</span></> : ""}
                    </>
                );


        }
    };

    return (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>פרטי האורחים</h2>

            {loading ? (
                <div>Loading guest info...</div>
            ) : (
                <>
                    <div className={styles.importSection}>
                        <input
                            type="file"
                            id="excelFile"
                            accept=".xlsx,.xls"
                            style={{ display: 'none' }}
                            onChange={handleExcelImport}
                        />
                        <button className={styles.btnImport} onClick={handleImportClick} disabled={ViewMode}>
                            <i className="fas fa-file-excel"></i>
                            <span>ייבוא אורחים מאקסל</span>
                        </button>
                        <button
                            className={`${styles.btnDownload} ${styles.btnSecondary}`} disabled={ViewMode}
                            onClick={handleDownloadExcel}
                        >
                            <i className="fas fa-download"></i> הורד את אקסל
                        </button>
                        <span className={styles.importHint}>
                            ניתן להעלות קובץ Excel עם פרטי אורחים מרובים
                        </span>
                    </div>

                    <div className={styles.tableWrapper}>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead className={styles.tableHeader}>
                                    <tr>
                                        {activeColumns.map((col, i) => (
                                            <th key={i}>
                                                {col.title}
                                                {col.isfieldrequired && (
                                                    <span className={styles.requiredStar}> *</span>
                                                )}
                                            </th>
                                        ))}
                                        <th>פעולות</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((_, rowIndex) => (
                                        <tr key={rowIndex}>
                                            {activeColumns.map((field, i) => (
                                                <td key={i}>{renderCell(field, rowIndex)}</td>
                                            ))}
                                            <td>
                                                <button
                                                    className={styles.deleteBtn} disabled={ViewMode}
                                                    onClick={() => markForDelete(rowIndex)}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <button className={styles.addRowBtn} onClick={addRow} disabled={ViewMode}>
                        <i className="fas fa-plus"></i> הוסף אורח נוסף
                    </button>
                </>
            )}
        </div>
    );
};

export default GuestInfoSection;
