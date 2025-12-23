import * as React from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import styles from './GuestRequestForm.module.scss';

export interface IApprovalProcessProps {
  ApprovalConfigData: any[];
  currentStepOrder?: number;
}

const ApprovalProcess: React.FC<IApprovalProcessProps> = ({
  ApprovalConfigData,
  currentStepOrder,
}) => {
  const [localConfig, setLocalConfig] = React.useState<any[]>([]);

  // ✅ When ApprovalConfigData changes, update local state to trigger re-render
  React.useEffect(() => {
    if (ApprovalConfigData && ApprovalConfigData.length > 0) {
      setLocalConfig([...ApprovalConfigData]);
    } else {
      setLocalConfig([]);
    }
  }, [JSON.stringify(ApprovalConfigData)]); // Compare deeply so even nested changes re-render

  const getStatusElement = (status: string) => {
    const normalized = (status || '').trim();

    switch (normalized) {
      case 'ממתין לאישור':
      case 'In Progress':
        return (
          <span className={styles.statusCurrent}>
            <i className="fas fa-circle"></i> מתמלא כעת
          </span>
        );

      case 'בוצע':
      case 'הושלם':
      case 'Completed':
        return (
          <span className={styles.statusCompleted}>
            <i className="fas fa-check-circle"></i> הושלם
          </span>
        );

      case 'נדחה':
      case 'Rejected':
        return (
          <span className={styles.statusRejected}>
            <i className="fas fa-times-circle"></i> נדחה
          </span>
        );

      case 'ממתין':
      case 'Pending':
      default:
        return (
          <span className={styles.statusPending}>
            <i className="fas fa-clock"></i> ממתין
          </span>
        );
    }
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>תהליך אישורים</h2>

      <div className={styles.approvalTableContainer}>
        <table className={styles.approvalTable}>
          <thead>
            <tr>
              <th>שלב</th>
              <th>גורם מאשר</th>
              <th>סטטוס</th>
              <th>תאריך</th>
              <th>הערות</th>
            </tr>
          </thead>
          <tbody>
            {localConfig?.length > 0 ? (
              localConfig.map((item: any, index: number) => {
                const isCurrent =
                  currentStepOrder &&
                  item.StepOrder === currentStepOrder &&
                  (!item.status ||
                    item.status === 'מתמלא כעת' ||
                    item.status === 'In Progress');

                return (
                  <tr key={index}>
                    <td>{item.stage || item.StepOrder || index + 1}</td>
                    <td>{item.confirmingFactor || '-'}</td>
                    <td>
                      {isCurrent
                        ? getStatusElement('מתמלא כעת')
                        : getStatusElement(item.status)}
                    </td>
                    <td style={{direction:'rtl'}}>{item.date || '-'}</td>
                    <td
                      dangerouslySetInnerHTML={{
                        __html: item.notes || '-',
                      }}
                    ></td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>
                  אין שלבי אישור זמינים
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApprovalProcess;
