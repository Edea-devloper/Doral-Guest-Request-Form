import * as React from "react";

import { IOrder } from "../models/IOrder";

export const useOrderBy = (initialOrder: IOrder | undefined): {
    orderBy: IOrder | undefined;
    onChageOrderBy: (newOrderBy: IOrder) => void;
} => {
    const [orderBy, setOrderBy] = React.useState<IOrder | undefined>(initialOrder);

    const onChageOrderBy = (newOrderBy: IOrder): void => {
        setOrderBy(newOrderBy);
    };

    return {
        orderBy,
        onChageOrderBy,
    };
};
