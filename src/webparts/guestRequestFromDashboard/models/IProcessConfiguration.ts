export interface IProcessConfiguration {
    steps: IProcessStepConfiguration[];
    stepPendingStatus: string;
    stepCompletedStatus: string;
    processCompletedStatus: string;
}

export interface IProcessStepConfiguration {
    id: string;
    title: string;
    order: number;
    statusColumn: string;
    sharePointGroup: string;
}