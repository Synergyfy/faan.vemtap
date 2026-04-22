import React from 'react';
import { X, AlertTriangle, Trash2, Info, LayoutTemplate, Shield, MapPin, FileStack, QrCode, AlertCircle, Users } from 'lucide-react';
import styles from './DeleteConfirmationModal.module.css';

export type DeletableItemType = 'location' | 'department' | 'form' | 'touchpoint' | 'report' | 'template' | 'issue' | 'user';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName: string;
  itemType: DeletableItemType;
  isGroup?: boolean;
  instanceCount?: number;
  isPending?: boolean;
  affectedItems?: string[];
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType,
  isGroup = false,
  instanceCount = 0,
  isPending = false,
  affectedItems = [],
}) => {
  if (!isOpen) return null;

  const getDependencies = () => {
    switch (itemType) {
      case 'location':
        return 'All departments, touchpoints, and staff associated with this airport will be permanently removed from the system.';
      case 'department':
        return 'All touchpoints and staff assigned to this department will be disconnected. This may affect reporting and operational tracking.';
      case 'form':
        return 'CRITICAL: All touchpoints linked to this form will also be permanently deleted, as they cannot exist without a form configuration.';
      case 'touchpoint':
        return 'Interaction history and QR code access for this point will be lost. Active QR codes in physical locations will stop working.';
      case 'template':
        return 'No new reports can be created using this template. Existing reports will be preserved but disconnected from the template definition.';
      case 'report':
        return 'This specific report and all its submitted data will be permanently removed from management records.';
      case 'issue':
        return 'This issue will be archived. While data is preserved for audit, it will no longer appear in active boards or operational lists.';
      case 'user':
        return 'This user will lose all access to the system. Any active sessions will be terminated and their profile will be permanently removed.';
      default:
        return 'This item and all its associated data will be permanently removed.';
    }
  };

  const getIcon = () => {
    switch (itemType) {
      case 'location': return <MapPin size={20} />;
      case 'department': return <Shield size={20} />;
      case 'form': return <FileStack size={20} />;
      case 'touchpoint': return <QrCode size={20} />;
      case 'template': return <LayoutTemplate size={20} />;
      case 'issue': return <AlertCircle size={20} />;
      case 'user': return <Users size={20} />;
      default: return <AlertTriangle size={20} />;
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.warningIconWrapper}>
            <AlertTriangle size={24} />
          </div>
          <div className={styles.headerText}>
            <h3 className={styles.title}>{title || `Delete ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`}</h3>
            <p className={styles.subtitle}>Confirming permanent removal</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.itemPreview}>
            <div className={styles.itemIcon}>{getIcon()}</div>
            <div className={styles.itemDetails}>
              <span className={styles.itemLabel}>{isGroup ? `Grouped ${itemType}s` : itemName}</span>
              <span className={styles.itemName}>{isGroup ? itemName : `Single Instance`}</span>
            </div>
          </div>

          <p className={styles.warningText}>
            You are about to delete <strong>{isGroup ? `${instanceCount} instances of ` : ''}{itemName}</strong>. 
            This action is <strong>permanent</strong> and cannot be undone.
          </p>

          <div className={styles.noticeCard}>
            <div className={styles.noticeHeader}>
              <Info size={16} />
              <span>Impact Notice</span>
            </div>
            <p className={styles.noticeContent}>{getDependencies()}</p>
          </div>

          {isGroup && (
            <div className={styles.groupAlert}>
              <div className={styles.alertBullet} />
              <span>This deletion will affect <strong>{instanceCount}</strong> instances across the network.</span>
            </div>
          )}

          {isGroup && affectedItems.length > 0 && (
            <div className={styles.affectedList}>
              <p className={styles.affectedTitle}>Affected {itemType === 'location' ? 'Entities' : 'Locations/Contexts'}:</p>
              <div className={styles.affectedItemsScroll}>
                {affectedItems.map((item, index) => (
                  <div key={index} className={styles.affectedItem}>
                    <div className={styles.itemDot} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isPending}>
            Keep {itemType}
          </button>
          <button 
            className={styles.confirmBtn} 
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <span className={styles.loader} />
            ) : (
              <>
                <Trash2 size={18} />
                <span>Confirm Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
