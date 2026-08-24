import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingTask, setUpdatingTask] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/tasks/my');

      setTasks(response.data.tasks || []);
    } catch (err) {
      console.error('Get my tasks error:', err);

      setError(
        err.response?.data?.error ||
          'Failed to load your tasks'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const updateStatus = async (taskId, status) => {
    try {
      setUpdatingTask(taskId);
      setError('');
      setSuccess('');

      const response = await api.patch(
        `/tasks/${taskId}`,
        {
          status,
        }
      );

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                ...response.data.task,
                status,
              }
            : task
        )
      );

      setSuccess('Task status updated successfully.');

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Update task error:', err);

      setError(
        err.response?.data?.error ||
          'Failed to update task'
      );
    } finally {
      setUpdatingTask(null);
    }
  };

  const getStatusStyle = (status) => {
    if (status === 'COMPLETED') {
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    }

    if (status === 'IN_PROGRESS') {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }

    return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  };

  const getPriorityStyle = (priority) => {
    if (priority === 'HIGH') {
      return 'bg-red-500/10 text-red-400';
    }

    if (priority === 'LOW') {
      return 'bg-green-500/10 text-green-400';
    }

    return 'bg-yellow-500/10 text-yellow-400';
  };

  const formatDate = (date) => {
    if (!date) {
      return 'No due date';
    }

    return new Date(date).toLocaleString();
  };

  const startOfToday = () => {
    const date = new Date();

    date.setHours(0, 0, 0, 0);

    return date;
  };

  const startOfTomorrow = () => {
    const date = new Date();

    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 1);

    return date;
  };

  const startOfDayAfterTomorrow = () => {
    const date = new Date();

    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 2);

    return date;
  };

  const isDueToday = (task) => {
    if (!task.dueDate || task.status === 'COMPLETED') {
      return false;
    }

    const dueDate = new Date(task.dueDate);

    return (
      dueDate >= startOfToday() &&
      dueDate < startOfTomorrow()
    );
  };

  const isDueTomorrow = (task) => {
    if (!task.dueDate || task.status === 'COMPLETED') {
      return false;
    }

    const dueDate = new Date(task.dueDate);

    return (
      dueDate >= startOfTomorrow() &&
      dueDate < startOfDayAfterTomorrow()
    );
  };

  const isOverdue = (task) => {
    if (!task.dueDate || task.status === 'COMPLETED') {
      return false;
    }

    return new Date(task.dueDate) < new Date();
  };

  const getDueNotification = (task) => {
    if (isOverdue(task)) {
      return {
        text: 'Overdue',
        className:
          'border-red-500/30 bg-red-500/10 text-red-400',
        icon: '⚠️',
      };
    }

    if (isDueToday(task)) {
      return {
        text: 'Due Today',
        className:
          'border-red-500/30 bg-red-500/10 text-red-400',
        icon: '🔴',
      };
    }

    if (isDueTomorrow(task)) {
      return {
        text: 'Due Tomorrow',
        className:
          'border-orange-500/30 bg-orange-500/10 text-orange-400',
        icon: '🟠',
      };
    }

    return null;
  };

  const dueTodayTasks = tasks.filter(isDueToday);
  const dueTomorrowTasks = tasks.filter(isDueTomorrow);
  const overdueTasks = tasks.filter(isOverdue);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-dark-900 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h1 className="text-3xl font-bold text-white">
                My Tasks
              </h1>

              <p className="mt-2 text-dark-400">
                All tasks assigned to you.
              </p>
            </div>

            <div className="rounded-xl border border-dark-700 bg-dark-800 px-5 py-3">
              <p className="text-xs text-dark-500">
                Total Tasks
              </p>

              <p className="mt-1 text-xl font-bold text-white">
                {tasks.length}
              </p>
            </div>

          </div>
        </div>

        {!loading &&
          (overdueTasks.length > 0 ||
            dueTodayTasks.length > 0 ||
            dueTomorrowTasks.length > 0) && (
            <div className="mb-6 space-y-3">

              {overdueTasks.length > 0 && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-xl">⚠️</div>

                    <div>
                      <h3 className="font-semibold text-red-400">
                        Overdue Tasks
                      </h3>

                      <p className="mt-1 text-sm text-red-300/80">
                        You have {overdueTasks.length}{' '}
                        overdue task
                        {overdueTasks.length > 1 ? 's' : ''}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {dueTodayTasks.length > 0 && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-xl">🔴</div>

                    <div>
                      <h3 className="font-semibold text-red-400">
                        Tasks Due Today
                      </h3>

                      <p className="mt-1 text-sm text-red-300/80">
                        You have {dueTodayTasks.length}{' '}
                        task
                        {dueTodayTasks.length > 1 ? 's' : ''}{' '}
                        due today.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {dueTomorrowTasks.length > 0 && (
                <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-xl">🟠</div>

                    <div>
                      <h3 className="font-semibold text-orange-400">
                        Tasks Due Tomorrow
                      </h3>

                      <p className="mt-1 text-sm text-orange-300/80">
                        You have {dueTomorrowTasks.length}{' '}
                        task
                        {dueTomorrowTasks.length > 1 ? 's' : ''}{' '}
                        due tomorrow.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
            <p className="text-sm text-green-400">
              ✓ {success}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">
              {error}
            </p>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-dark-700 bg-dark-800 p-10 text-center">
            <div className="text-4xl">⏳</div>

            <p className="mt-3 text-dark-400">
              Loading your tasks...
            </p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-dark-600 bg-dark-800 p-12 text-center">
            <div className="text-5xl">📋</div>

            <h2 className="mt-4 text-xl font-semibold text-white">
              No tasks assigned
            </h2>

            <p className="mt-2 text-sm text-dark-500">
              You don't have any tasks assigned to you yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {tasks.map((task) => {
              const processing =
                updatingTask === task.id;

              const notification =
                getDueNotification(task);

              return (
                <div
                  key={task.id}
                  className="rounded-2xl border border-dark-700 bg-dark-800 p-5 shadow-lg transition hover:border-dark-600"
                >

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <h2 className="text-lg font-semibold text-white">
                          {task.title}
                        </h2>
                        {task.description && (
  <p className="mt-2 text-sm text-dark-300">
    {task.description}
  </p>
)}

{task.link && (
  <a
    href={task.link}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center mt-3 text-sm text-blue-400 hover:text-blue-300 hover:underline"
  >
    🔗 Open Link
  </a>
)}
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>

                        {notification && (
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${notification.className}`}
                          >
                            {notification.icon}{' '}
                            {notification.text}
                          </span>
                        )}

                      </div>

                     {task.description && (
  <p className="mt-2 text-sm leading-6 text-dark-400">
    {task.description}
  </p>
)}

{task.link && (
  <div className="mt-4">
    <a
      href={task.link}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-2.5 text-sm font-semibold text-primary-400 transition hover:bg-primary-500/20 hover:text-primary-300"
    >
      🔗 Open Task Link
    </a>

    <p className="mt-2 break-all text-xs text-dark-500">
      {task.link}
    </p>
  </div>
)}

                    </div>

                    <span
                      className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                        task.status
                      )}`}
                    >
                      {task.status?.replace('_', ' ')}
                    </span>

                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">

                    <div className="rounded-xl border border-dark-700 bg-dark-900 p-3">
                      <p className="text-xs text-dark-500">
                        Assigned By
                      </p>

                      <p className="mt-1 text-sm font-medium text-white">
                        {task.creator?.name ||
                          task.creator?.username ||
                          'Unknown'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-dark-700 bg-dark-900 p-3">
                      <p className="text-xs text-dark-500">
                        Group
                      </p>

                      <p className="mt-1 text-sm font-medium text-white">
                        {task.group?.name || 'Unknown Group'}
                      </p>
                    </div>

                    <div
                      className={`rounded-xl border p-3 ${
                        isOverdue(task)
                          ? 'border-red-500/20 bg-red-500/5'
                          : isDueToday(task)
                          ? 'border-red-500/20 bg-red-500/5'
                          : isDueTomorrow(task)
                          ? 'border-orange-500/20 bg-orange-500/5'
                          : 'border-dark-700 bg-dark-900'
                      }`}
                    >
                      <p className="text-xs text-dark-500">
                        Due Date
                      </p>

                      <p
                        className={`mt-1 text-sm font-medium ${
                          isOverdue(task) ||
                          isDueToday(task)
                            ? 'text-red-400'
                            : isDueTomorrow(task)
                            ? 'text-orange-400'
                            : 'text-white'
                        }`}
                      >
                        {isOverdue(task) && '⚠️ '}
                        {isDueToday(task) && '🔴 '}
                        {isDueTomorrow(task) && '🟠 '}
                        {formatDate(task.dueDate)}
                      </p>
                    </div>

                  </div>

                  <div className="mt-5 border-t border-dark-700 pt-5">

                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-dark-500">
                      Update Status
                    </p>

                    <div className="flex flex-col gap-2 sm:flex-row">

                      <button
                        type="button"
                        disabled={processing}
                        onClick={() =>
                          updateStatus(task.id, 'TODO')
                        }
                        className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                          task.status === 'TODO'
                            ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                            : 'border-dark-700 bg-dark-900 text-dark-400 hover:border-yellow-500/30 hover:text-yellow-400'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        📌 To Do
                      </button>

                      <button
                        type="button"
                        disabled={processing}
                        onClick={() =>
                          updateStatus(
                            task.id,
                            'IN_PROGRESS'
                          )
                        }
                        className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                          task.status === 'IN_PROGRESS'
                            ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                            : 'border-dark-700 bg-dark-900 text-dark-400 hover:border-blue-500/30 hover:text-blue-400'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        🔄 In Progress
                      </button>

                      <button
                        type="button"
                        disabled={processing}
                        onClick={() =>
                          updateStatus(
                            task.id,
                            'COMPLETED'
                          )
                        }
                        className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                          task.status === 'COMPLETED'
                            ? 'border-green-500/30 bg-green-500/10 text-green-400'
                            : 'border-dark-700 bg-dark-900 text-dark-400 hover:border-green-500/30 hover:text-green-400'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {processing
                          ? 'Updating...'
                          : '✓ Completed'}
                      </button>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}