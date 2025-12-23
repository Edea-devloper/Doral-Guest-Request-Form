export const orderSelectedColumns = (
    expandedFields: { key: string; name: string }[],
    orderedColumns: { key: string; name: string }[]
): { key: string; name: string }[] => {
    const result: { key: string; name: string }[] = [];

    orderedColumns.forEach((column) => {
        const field = expandedFields.find((f) => f.key === column.key);

        if (field) {
            result.push(field);
        }
    });

    expandedFields.forEach((field) => {
        if (!result.find((r) => r.key === field.key)) {
            result.push(field);
        }
    });

    return result;
};
