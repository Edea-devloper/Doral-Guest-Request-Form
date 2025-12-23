import * as React from "react";

export const usePagination = (): {
    page: number;
    pageSize: number;
    changePage: (newPage: number) => void;
    changePageSize: (newPageSize: number) => void;
} => {
    const [page, setPage] = React.useState<number>(1);
    const [pageSize, setPageSize] = React.useState<number>(10);

    const changePage = (newPage: number): void => {
        setPage(newPage);
    };

    const changePageSize = (newPageSize: number): void => {
        setPage(1);
        setPageSize(newPageSize);
    };

    return { page, pageSize, changePage, changePageSize };
};
