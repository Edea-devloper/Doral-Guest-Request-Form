import * as React from "react";
import styles from "./GuestDashboardDepartmentWise.module.scss";
import { deleteItemsByListId, getDepartmentForCurrentUser, getItemsByListId, updateItemsStatusByListId } from "../Utility/utils";
import { Callout, DirectionalHint, Dropdown, IDropdownOption } from "@fluentui/react";

export interface IGuestDashboardDepartmentWiseProps {
  context: any;
  guestListId: string;
  departmentListId: string;
  TableConfig: any[];
  mainListId: string;
  DepartmentColumnName: string;
  DashboardHeader: string;
  FormUrl: string;
  cacheList: string;
}

const GuestDashboardDepartmentWise: React.FC<IGuestDashboardDepartmentWiseProps> = ({
  context,
  guestListId,
  departmentListId, mainListId,
  TableConfig, DepartmentColumnName, DashboardHeader, FormUrl, cacheList
}) => {
  const [listData, setListData] = React.useState<any[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [searchText, setSearchText] = React.useState("");
  const [currectuserDept, setCurrectuserDept] = React.useState("");
  const [isUpdating, setIsUpdating] = React.useState(false);


  const [columnFilters, setColumnFilters] = React.useState<{ [key: string]: string[]; }>({});
  const [activeFilterColumn, setActiveFilterColumn] = React.useState<string | null>(null);
  const [filterTarget, setFilterTarget] = React.useState<HTMLElement | null>(null);

  const [sortConfig, setSortConfig] = React.useState<{ key: string | null; direction: "asc" | "desc"; }>({ key: null, direction: "asc" });






  const filteredData = React.useMemo(() => {
    let data = [...listData];

    /* ---------------- SEARCH FILTER ---------------- */
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();

      data = data?.filter(item =>
        Object.values(item)?.some(value => {
          if (value === null || value === undefined) return false;

          if (typeof value === "string") {
            return value.toLowerCase().includes(lowerSearch);
          }

          if (typeof value === "number") {
            return value.toString().includes(lowerSearch);
          }

          if (typeof value === "object") {
            const obj: any = value;

            // Person / Lookup
            if (obj.Title)
              return obj.Title.toLowerCase().includes(lowerSearch);

            if (obj.Email)
              return obj.Email.toLowerCase().includes(lowerSearch);

            // Multi choice / lookup
            if (obj.results)
              return obj.results.join(",").toLowerCase().includes(lowerSearch);
          }

          return false;
        })
      );
    }

    /* ---------------- COLUMN FILTERS ---------------- */
    Object.keys(columnFilters)?.forEach(columnKey => {
      const selectedValues = columnFilters[columnKey];

      if (!selectedValues || selectedValues?.length === 0) return;

      data = data?.filter(item => {
        const value = item[columnKey];
        if (!value) return false;

        let formattedValue = "";

        if (typeof value === "object") {
          if (value.Title) formattedValue = value.Title;
          else if (value.Email) formattedValue = value.Email;
          else if (value.results) formattedValue = value.results.join(", ");
        } else {
          formattedValue = value.toString();
        }

        return selectedValues.includes(formattedValue);
      });
    });

    /* ---------------- SORTING ---------------- */
    if (sortConfig.key) {
      data = [...data].sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];

        const getValue = (val: any) => {
          if (val === null || val === undefined) return "";
          if (typeof val === "object") {
            if (val.Title) return val.Title;
            if (val.Email) return val.Email;
            if (val.results) return val.results.join(", ");
          }
          return val.toString();
        };

        const valueA = getValue(aVal).toLowerCase();
        const valueB = getValue(bVal).toLowerCase();

        if (valueA < valueB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valueA > valueB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }



    return data;
  }, [listData, searchText, columnFilters, sortConfig]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const pagedData = filteredData.slice(startIndex, endIndex);



  React.useEffect(() => {
    const loadData = async (): Promise<void> => {
      if (!guestListId) return;
      const department = await getDepartmentForCurrentUser(context, departmentListId);
      console.log("Current user's department:", department);
      setCurrectuserDept(department);
      const allData = await getItemsByListId(guestListId, ["*"], context, mainListId);
      // Filter data based on department
      const filteredData =
        department === "NoDept"
          ? [] // If no department, return empty array
          : allData.filter(item => item.Department === department);
      setListData(filteredData);
      console.log("AllGuest:", allData); // log fresh data
    };

    loadData();
    console.log("listData:", listData);
    console.log("config:", TableConfig);
  }, [guestListId]);


  const renderCellValue = (value: any) => {
    if (value === null || value === undefined) return "-";

    // Person / Lookup
    if (typeof value === "object") {
      if (value.Title) return value.Title;
      if (value.Email) return value.Email;
      if (value.results) return value.results.join(", ");
    }

    // Date
    if (typeof value === "string" && value.includes("T")) {
      return new Date(value).toLocaleDateString();
    }

    return value.toString();
  };

  const getPageNumbers = (
    currentPage: number,
    totalPages: number
  ): (number | string)[] => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Always show first pages
    pages.push(1);
    pages.push(2);
    pages.push(3);

    // Ellipsis before middle
    if (currentPage > 5) {
      pages.push("...");
    }

    // Middle pages
    const start = Math.max(4, currentPage - 1);
    const end = Math.min(totalPages - 3, currentPage + 1);

    for (let i = start; i <= end; i++) {
      if (i > 3 && i < totalPages - 2) {
        pages.push(i);
      }
    }

    // Ellipsis after middle
    if (currentPage < totalPages - 4) {
      pages.push("...");
    }

    // Always show last pages
    pages.push(totalPages - 2);
    pages.push(totalPages - 1);
    pages.push(totalPages);

    return pages;
  };

  // Check if row is selected
  const isRowSelected = (id: number): boolean => {
    return selectedIds.includes(id);
  };

  // Toggle single row checkbox
  const onRowCheckboxChange = (id: number, checked: boolean): void => {
    setSelectedIds(prev =>
      checked ? [...prev, id] : prev.filter(x => x !== id)
    );
  };

  // Toggle header checkbox (select all / unselect all)
  const onHeaderCheckboxChange = (checked: boolean): void => {
    if (checked) {
      const allIds = pagedData.map(item => item.Id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...allIds])));
    } else {
      const pageIds = pagedData.map(item => item.Id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  React.useEffect(() => {
    console.log("Selected IDs:", selectedIds);
  }, [selectedIds])

  const handleUpdateStatus = async (status: string) => {
    if (selectedIds.length === 0) return;

    try {
      setIsUpdating(true); // show loader
      await updateItemsStatusByListId(context, guestListId, selectedIds, status, cacheList, currectuserDept);
      // Optionally reload data after update
      const allData = await getItemsByListId(guestListId, ["*"], context, mainListId);
      const filteredData =
        currectuserDept === "NoDept"
          ? []
          : allData.filter(item => item.Department === currectuserDept);
      setListData(filteredData);
      setSelectedIds([]); // clear selection
    } catch (error) {
      console.error("Error updating items:", error);
    } finally {
      setIsUpdating(false); // hide loader
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      setIsUpdating(true); // show loader

      await deleteItemsByListId(
        guestListId,
        context,
        selectedIds
      );

      // Reload data after delete
      const allData = await getItemsByListId(
        guestListId,
        ["*"],
        context,
        mainListId
      );

      // Re-apply department filter
      const filteredData =
        currectuserDept === "NoDept"
          ? []
          : allData.filter(item => item.Department === currectuserDept);

      setListData(filteredData);
      setSelectedIds([]);

    } catch (error) {
      console.error("Error deleting items:", error);
    } finally {
      setIsUpdating(false); // hide loader
    }
  };

  // const getDropdownOptions = (columnKey: string): IDropdownOption[] => {
  //   const values = listData
  //     .map(item => {
  //       const value = item[columnKey];

  //       if (!value) return null;

  //       if (typeof value === "object") {
  //         if (value.Title) return value.Title;
  //         if (value.Email) return value.Email;
  //         if (value.results) return value.results.join(", ");
  //       }

  //       if (typeof value === "string" && value.includes("T")) {
  //         return formatDateForDropdown(value);
  //       }

  //       return value.toString();
  //     })
  //     .filter(Boolean);

  //   const uniqueValues = Array.from(new Set(values));

  //   return uniqueValues.map(v => ({
  //     key: v,
  //     text: v
  //   }));
  // };


  const getDropdownOptions = (columnKey: string): IDropdownOption[] => {
    const optionsMap = new Map<string, string>();

    listData.forEach(item => {
      const value = item[columnKey];
      if (!value) return;

      // Person / Lookup
      if (typeof value === "object") {
        if (value.Title) optionsMap.set(value.Title, value.Title);
        else if (value.Email) optionsMap.set(value.Email, value.Email);
        else if (value.results) {
          value.results.forEach((v: string) =>
            optionsMap.set(v, v)
          );
        }
        return;
      }

      // DATE FIELD
      if (typeof value === "string" && value.includes("T")) {
        optionsMap.set(
          value,                      // RAW ISO (KEY)
          formatDateForDropdown(value) // FORMATTED (TEXT)
        );
        return;
      }

      // Normal text / number
      optionsMap.set(value.toString(), value.toString());
    });

    return Array.from(optionsMap.entries()).map(([key, text]) => ({
      key,
      text
    }));
  };


  const onSort = (columnKey: string) => {
    setSortConfig(prev => {
      if (prev.key === columnKey) {
        return {
          key: columnKey,
          direction: prev.direction === "asc" ? "desc" : "asc"
        };
      }
      return {
        key: columnKey,
        direction: "asc"
      };
    });

    setCurrentPage(1);
  };


  const formatDateForDropdown = (value: string): string => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value; // not a valid date

    return date.toLocaleDateString("en-US"); // MM/DD/YYYY
  };




  return (
    <div className={styles.mainbox}>
      {isUpdating && (
        <div className={styles.loaderOverlay}>
          <div className={styles.loader}></div>
        </div>
      )}

      <div className={styles.mainboxbody}>
        <h1>{DashboardHeader ? DashboardHeader : "Guest Request Form"}</h1>
      </div>
      <div className={styles.mainbody}>
        <div className={styles.topcolorline}></div>
        <div className={styles.topBtns}>
          <button className={styles.btnDelete} onClick={handleDelete}><img src={require('../assets/delete.svg')} /> מחיקה</button>
          <a href={FormUrl} target="_blank" style={{ textDecoration: 'none' }}><button className={styles.btnCreate}><img src={require('../assets/plus.svg')} />הוסף טופס חדש</button></a>
        </div>
        <div className={styles.searchFilters}>
          <div className={styles.dash_search}><input type="search" placeholder="Search" value={searchText} onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }} /></div>
          <div className={styles.appvalsBtns}>
            <button className={styles.btnApprove}
              onClick={() => handleUpdateStatus("אישור")}><img src={require('../assets/check.svg')} />  אישור </button>
            <button className={styles.btnReject}
              onClick={() => handleUpdateStatus("דחייה")}><img style={{ height: '20px' }} src={require('../assets/close.png')} />  דחייה </button>
          </div>
        </div>

        <div className={styles.datatablesection}>
          <div className={styles.tableWrapper}>
            <table className={styles.spTable}>
              <thead>


                <tr>
                  <th style={{ width: '20px' }}>
                    <input
                      type="checkbox"
                      className={styles["form-check-input"]}
                      checked={
                        pagedData.length > 0 &&
                        pagedData.every(item => selectedIds.includes(item.Id))
                      }
                      ref={input => {
                        if (input) {
                          const selectedCount = pagedData.filter(item =>
                            selectedIds.includes(item.Id)
                          ).length;
                          input.indeterminate =
                            selectedCount > 0 && selectedCount < pagedData.length;
                        }
                      }}
                      onChange={(e) => onHeaderCheckboxChange(e.target.checked)}
                    />
                  </th>

                  <th style={{ width: '20px' }}></th>

                  {TableConfig.map((col, index) => {
                    const isFiltered = (columnFilters[col.selectedColumn]?.length || 0) > 0;

                    return (
                      <th key={index} className={isFiltered ? styles.filteredHeader : ""}>
                        <div className={styles.headerWithFilter}>

                          {/* <span>{col.title}</span> */}

                          <span
                            className={styles.sortableHeader}
                            onClick={() => onSort(col.selectedColumn)}
                          >
                            {col.title}

                            {sortConfig.key === col.selectedColumn && (
                              <img
                                src={
                                  sortConfig.direction === "asc"
                                    ? require("../assets/sort-asc.png")
                                    : require("../assets/sort-desc.png")
                                }
                                className={styles.sortIcon}
                              />
                            )}
                          </span>


                          <img
                            src={require("../assets/filter01.png")}
                            className={`${styles.filterIcon} ${isFiltered ? styles.activeFilter : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterColumn(col.selectedColumn);
                              setFilterTarget(e.currentTarget as HTMLElement);
                            }}
                          />

                        </div>
                      </th>
                    );
                  })}

                  {(() => {
                    const isDeptFiltered = (columnFilters["Department"]?.length || 0) > 0;

                    return (
                      <th className={isDeptFiltered ? styles.filteredHeader : ""}>
                        <div className={styles.headerWithFilter}>

                          {/* <span>{DepartmentColumnName ? DepartmentColumnName : "Department"}</span> */}
                          <span
                            className={styles.sortableHeader}
                            onClick={() => onSort("Department")}
                          >
                            {DepartmentColumnName ? DepartmentColumnName : "Department"}

                            {sortConfig.key === "Department" && (
                              <img
                                src={
                                  sortConfig.direction === "asc"
                                    ? require("../assets/sort-asc.png")
                                    : require("../assets/sort-desc.png")
                                }
                                className={styles.sortIcon}
                              />
                            )}
                          </span>


                          <img
                            src={require("../assets/filter01.png")}
                            className={`${styles.filterIcon} ${isDeptFiltered ? styles.activeFilter : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterColumn("Department");
                              setFilterTarget(e.currentTarget as HTMLElement);
                            }}
                          />

                        </div>
                      </th>
                    );
                  })()}
                </tr>


                {/* FILTER ROW */}
                {activeFilterColumn && filterTarget && (
                  <Callout
                    target={filterTarget}
                    onDismiss={() => {
                      setActiveFilterColumn(null);
                      setFilterTarget(null);
                    }}
                    directionalHint={DirectionalHint.bottomLeftEdge}
                    setInitialFocus
                  >
                    <div style={{ padding: 12, width: 240 }}>
                      <Dropdown
                        multiSelect
                        selectedKeys={columnFilters[activeFilterColumn] || []}
                        options={getDropdownOptions(activeFilterColumn)}
                        onChange={(_, option) => {
                          if (!option) return;

                          setColumnFilters(prev => {
                            const existing = prev[activeFilterColumn] || [];
                            const updated = option.selected
                              ? [...existing, option.key as string]
                              : existing.filter(v => v !== option.key);

                            return {
                              ...prev,
                              [activeFilterColumn]: updated
                            };
                          });

                          setCurrentPage(1);
                        }}
                      />
                    </div>
                  </Callout>
                )}


              </thead>

              <tbody>
                {pagedData.length > 0 ? (
                  pagedData.map((item, rowIndex) => (
                    <tr key={rowIndex}>
                      {/* <td><input type="checkbox" className={styles["form-check-input"]} /></td> */}
                      <td style={{ width: '20px' }}>
                        <input
                          type="checkbox"
                          className={styles["form-check-input"]}
                          checked={isRowSelected(item.Id)}
                          onChange={(e) =>
                            onRowCheckboxChange(item.Id, e.target.checked)
                          }
                        />
                      </td>
                      <td style={{ width: '20px' }}><a href={`${FormUrl}?formId=${item?.ParentID}`} target="_blank"><img style={{ height: '17px', width: '17px', display: 'flex', alignItems: 'center' }} src={require('../assets/print_4.svg')} /></a></td>
                      {TableConfig && TableConfig?.map((col, colIndex) => (
                        <td key={colIndex}>
                          {renderCellValue(item[col.selectedColumn])}
                        </td>
                      ))}
                      <td>{item.Department}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={TableConfig?.length}>No records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.paginationContainer}>
          <div className={styles.pageSize}>
            <span>עמודים</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10 לעמוד</option>
              <option value={20}>20 לעמוד</option>
              <option value={50}>50 לעמוד</option>
            </select>
          </div>



          <div className={styles.pagination}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              ← לפני
            </button>

            {getPageNumbers(currentPage, totalPages).map((page, index) =>
              page === "..." ? (
                <span key={index} className={styles.ellipsis}>...</span>
              ) : (
                <button
                  key={index}
                  className={
                    currentPage === page ? styles.activePage : ""
                  }
                  onClick={() => setCurrentPage(Number(page))}
                >
                  {page}
                </button>
              )
            )}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              הבא →
            </button>
          </div>



        </div>

      </div>
    </div>
  );
};

export default GuestDashboardDepartmentWise;
