import React from 'react';
import styles from './NotificationDropdown.module.css';

interface Notification {
  id: number;
  message: string;
  time: string;
}

const notifications: Notification[] = [
  { id: 1, message: 'New form submission received', time: '5m ago' },
  { id: 2, message: 'Department report updated', time: '2h ago' },
  { id: 3, message: 'Issue #123 has been resolved', time: '1d ago' },
];

interface NotificationDropdownProps {
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  return (
    <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
      <div className={styles.dropdownHeader}>
        <h3>Notifications</h3>
        <button onClick={onClose}>Close</button>
      </div>
      <ul className={styles.notificationList}>
        {notifications.map((n) => (
          <li key={n.id} className={styles.notificationItem}>
            <p className={styles.message}>{n.message}</p>
            <span className={styles.time}>{n.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationDropdown;
