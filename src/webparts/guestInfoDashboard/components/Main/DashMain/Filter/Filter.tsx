import * as React from "react";
import { Callout, Icon, IconButton, mergeStyles, SearchBox } from "@fluentui/react";
import { getDirection, getLocalizedString } from "../../../../utils/localization";

interface IFilterProps {
    values: string[];
    isActive: boolean;
    columnName: string;
    fieldType: string;
    onApplyFilter: (column: string, values: string[], wipe?: boolean, fieldType?: string) => void;
    primaryColor: any;
}

export const Filter = ({
    values,
    isActive,
    columnName,
    onApplyFilter,
    fieldType,
    primaryColor
}: IFilterProps): JSX.Element => {
    const [isCalloutVisible, setIsCalloutVisible] =
        React.useState<boolean>(false);
    const [searchValue, setSearchValue] = React.useState<string>("");
    const [selectedValues, setSelectedValues] = React.useState<string[]>([]);

    const id = `${columnName}_filter`;

    const searchedValues = React.useMemo(
        () =>
            values.filter((value) =>
                value
                    .toString()
                    .toLowerCase()
                    .includes(searchValue.toLowerCase())
            ),
        [searchValue, values]
    );

    const iconButtonClass = mergeStyles({
        color: primaryColor,
        transition: 'color 0.2s ease-in-out',
        selectors: {
            ':hover': {
                color: primaryColor
            }
        }
    });
    const searchFilterItems = mergeStyles({
        borderColor: primaryColor,
        selectors: {
            '&:focus-within': {
                borderColor: primaryColor,
            },
            ':hover': {
                borderColor: primaryColor,
            }
        }
    });

    return (
        <>
            <Icon
                id={id}
                iconName={isActive ? "FilterSolid" : "Filter"}
                onClick={() => setIsCalloutVisible(!isCalloutVisible)}
            />
            {isCalloutVisible && (
                <Callout
                    dir={getDirection()}
                    target={`#${id}`}
                    onDismiss={() => setIsCalloutVisible(false)}
                >
                    <div className="filter_callout">
                        <div className="filter_callout controls">
                            <IconButton
                                iconProps={{ iconName: "Accept" }}
                                onClick={() =>
                                    onApplyFilter(columnName, selectedValues, false, fieldType)
                                }
                                className={iconButtonClass}
                            />
                            <IconButton
                                iconProps={{ iconName: "Clear" }}
                                onClick={() => {
                                    onApplyFilter(
                                        columnName,
                                        [...selectedValues],
                                        true,
                                        fieldType
                                    );
                                    setSelectedValues([]);
                                }}
                                className={iconButtonClass}
                            />
                        </div>
                        <div className="filter_callout search">
                            <SearchBox
                                value={searchValue}
                                placeholder={getLocalizedString("SearchPlaceholderText")}
                                onChange={(_, newValue) =>
                                    setSearchValue(newValue as string)
                                }
                                className={searchFilterItems}
                            />
                        </div>
                        <div className="filter_callout list">
                            {searchedValues.map((value) => (
                                <div
                                    key={value}
                                    className="filter_callout item"
                                    style={{
                                        background: selectedValues.includes(
                                            value
                                        )
                                            ? "lightgray"
                                            : "transparent",
                                    }}
                                    onClick={() => {
                                        setSelectedValues((prev) =>
                                            prev.includes(value)
                                                ? prev.filter((v) => v !== value)
                                                : [...prev, value]
                                        );
                                    }}
                                >
                                    {value && fieldType === "DateTime" ? new Date(value as string).toLocaleDateString('en-GB') : value}
                                </div>
                            ))}
                        </div>
                    </div>
                </Callout>
            )}
        </>
    );
};
