import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const response = await axios.get('/notifications');

      if (response.data.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error(
        'Failed to fetch notifications:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await axios.patch(
        `/notifications/${id}/read`
      );

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );

      setUnreadCount((prev) =>
        prev > 0 ? prev - 1 : 0
      );
    } catch (error) {
      console.error(
        'Failed to mark notification as read:',
        error
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch(
        '/notifications/read-all'
      );

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        'Failed to mark all notifications:',
        error
      );
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(
        `/notifications/${id}`
      );

      setNotifications((prev) =>
        prev.filter(
          (notification) =>
            notification.id !== id
        )
      );

      const deletedNotification =
        notifications.find(
          (notification) =>
            notification.id === id
        );

      if (
        deletedNotification &&
        !deletedNotification.isRead
      ) {
        setUnreadCount((prev) =>
          prev > 0 ? prev - 1 : 0
        );
      }
    } catch (error) {
      console.error(
        'Failed to delete notification:',
        error
      );
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'OVERDUE':
        return '🚨';

      case 'DUE_TODAY':
        return '📅';

      case 'DUE_TOMORROW':
        return '⏰';

      default:
        return '🔔';
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'OVERDUE':
        return 'border-red-500/30 bg-red-500/10';

      case 'DUE_TODAY':
        return 'border-yellow-500/30 bg-yellow-500/10';

      case 'DUE_TOMORROW':
        return 'border-blue-500/30 bg-blue-500/10';

      default:
        return 'border-dark-700 bg-dark-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-dark-300">
          Loading notifications...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">

        <div>
          <h1 className="text-3xl font-bold text-white">
            Notifications
          </h1>

          <p className="text-dark-400 mt-1">
            Stay updated with your tasks.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-400 hover:bg-primary-500/20 transition-colors text-sm font-medium"
          >
            Mark all as read
          </button>
        )}

      </div>

      {/* Unread count */}
      {unreadCount > 0 && (
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm">
            🔔 {unreadCount} unread
          </span>
        </div>
      )}

      {/* Empty state */}
      {notifications.length === 0 ? (
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-12 text-center">

          <div className="text-5xl mb-4">
            🔔
          </div>

          <h2 className="text-xl font-semibold text-white mb-2">
            No notifications
          </h2>

          <p className="text-dark-400">
            You're all caught up!
          </p>

        </div>
      ) : (
        <div className="space-y-4">

          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`relative border rounded-2xl p-4 sm:p-5 transition-all ${
                getTypeStyle(notification.type)
              } ${
                !notification.isRead
                  ? 'ring-1 ring-primary-500/10'
                  : 'opacity-80'
              }`}
            >

              {/* Unread indicator */}
              {!notification.isRead && (
                <div className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full bg-primary-400" />
              )}

              <div className="flex gap-4">

                {/* Icon */}
                <div className="w-11 h-11 rounded-xl bg-dark-900/50 flex items-center justify-center text-xl shrink-0">
                  {getIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pr-5">

                    <h3 className="font-semibold text-white">
                      {notification.title}
                    </h3>

                    <span className="text-xs text-dark-500">
                      {new Date(
                        notification.createdAt
                      ).toLocaleString()}
                    </span>

                  </div>

                  <p className="text-sm text-dark-300 mt-2">
                    {notification.message}
                  </p>

                  {/* Task information */}
                  {notification.task && (
                    <div className="mt-4 p-3 rounded-lg bg-dark-900/40 border border-dark-700">

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">

                        <Link
                          to={`/groups/${notification.task.groupId}/tasks`}
                          className="text-sm font-medium text-primary-400 hover:text-primary-300"
                        >
                          📋 {notification.task.title}
                        </Link>

                        <span className="text-xs text-dark-400">
                          {notification.task.priority}
                        </span>

                      </div>

                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-4">

                    {!notification.isRead && (
                      <button
                        onClick={() =>
                          markAsRead(
                            notification.id
                          )
                        }
                        className="text-xs font-medium text-primary-400 hover:text-primary-300"
                      >
                        Mark as read
                      </button>
                    )}

                    <button
                      onClick={() =>
                        deleteNotification(
                          notification.id
                        )
                      }
                      className="text-xs font-medium text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}

export default Notifications;