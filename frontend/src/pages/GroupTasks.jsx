import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';

export default function GroupTasks() {
  const { groupId } = useParams();

  const [tasks, setTasks] = useState([]);
  const [group, setGroup] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filter, setFilter] = useState('ALL');
  const [updatingTask, setUpdatingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

  const [editingTask, setEditingTask] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('MEDIUM');
  const [editStatus, setEditStatus] = useState('TODO');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');

  const isManager =
    currentUserRole === 'ADMIN' ||
    currentUserRole === 'MODERATOR';

  /*
  |--------------------------------------------------------------------------
  | FETCH GROUP
  |--------------------------------------------------------------------------
  */

  const fetchGroup = async () => {
    try {
      const response = await api.get(`/groups/${groupId}`);

      setGroup(response.data.group);
      setCurrentUserRole(response.data.currentUserRole);
    } catch (err) {
      console.error('Get group error:', err);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FETCH TASKS
  |--------------------------------------------------------------------------
  */

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(
        `/groups/${groupId}/tasks`
      );

      setTasks(response.data.tasks || []);
    } catch (err) {
      console.error('Get tasks error:', err);

      setError(
        err.response?.data?.error ||
          'Failed to load tasks'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchGroup();
    fetchTasks();
  }, [groupId]);

  /*
  |--------------------------------------------------------------------------
  | OPEN EDIT MODAL
  |--------------------------------------------------------------------------
  */

  const openEditModal = (task) => {
    setEditingTask(task);

    setEditTitle(task.title || '');
    setEditDescription(task.description || '');
    setEditPriority(task.priority || 'MEDIUM');
    setEditStatus(task.status || 'TODO');
    setEditAssignedTo(task.assignedTo || '');

    if (task.dueDate) {
      const date = new Date(task.dueDate);

      const localDate = new Date(
        date.getTime() -
          date.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);

      setEditDueDate(localDate);
    } else {
      setEditDueDate('');
    }

    setEditError('');
  };

  /*
  |--------------------------------------------------------------------------
  | CLOSE EDIT MODAL
  |--------------------------------------------------------------------------
  */

  const closeEditModal = () => {
    if (editLoading) return;

    setEditingTask(null);
    setEditError('');
  };

  /*
  |--------------------------------------------------------------------------
  | UPDATE TASK
  |--------------------------------------------------------------------------
  */

  const updateTask = async () => {
    if (!editTitle.trim()) {
      setEditError('Task title is required');
      return;
    }

    if (!editAssignedTo) {
      setEditError('Please select a member');
      return;
    }

    try {
      setEditLoading(true);
      setEditError('');

      const response = await api.patch(
        `/tasks/${editingTask.id}`,
        {
          title: editTitle.trim(),
          description:
            editDescription.trim() || null,
          priority: editPriority,
          status: editStatus,
          dueDate: editDueDate || null,
          assignedTo: editAssignedTo,
        }
      );

      setTasks((prev) =>
        prev.map((task) =>
          task.id === editingTask.id
            ? response.data.task
            : task
        )
      );

      closeEditModal();
    } catch (err) {
      console.error('Update task error:', err);

      setEditError(
        err.response?.data?.error ||
          'Failed to update task'
      );
    } finally {
      setEditLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | UPDATE STATUS
  |--------------------------------------------------------------------------
  */

  const updateStatus = async (taskId, status) => {
    try {
      setUpdatingTask(taskId);

      const response = await api.patch(
        `/tasks/${taskId}`,
        {
          status,
        }
      );

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? response.data.task
            : task
        )
      );
    } catch (err) {
      console.error('Update status error:', err);

      alert(
        err.response?.data?.error ||
          'Failed to update task'
      );
    } finally {
      setUpdatingTask(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE TASK
  |--------------------------------------------------------------------------
  */

  const deleteTask = async (taskId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this task?'
    );

    if (!confirmed) return;

    try {
      setDeletingTask(taskId);

      await api.delete(`/tasks/${taskId}`);

      setTasks((prev) =>
        prev.filter(
          (task) => task.id !== taskId
        )
      );
    } catch (err) {
      console.error('Delete task error:', err);

      alert(
        err.response?.data?.error ||
          'Failed to delete task'
      );
    } finally {
      setDeletingTask(null);
    }
  };
{/* =========================================================
    GROUP PROGRESS
========================================================= */}

<div className="mt-8">
  <div className="mb-4">
    <h2 className="text-xl font-bold text-white">
      Group Progress
    </h2>

    <p className="text-dark-500 text-sm mt-1">
      Track the progress of every group member.
    </p>
  </div>

  <div className="grid gap-4 md:grid-cols-2">
    {memberProgress.map((member) => (
      <div
        key={member.userId}
        className="bg-dark-800 border border-dark-700 rounded-2xl p-5"
      >
        {/* Member */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {member.user?.profileImage ? (
              <img
                src={member.user.profileImage}
                alt={member.user.name || 'User'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                {(member.user?.name || 'U')
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <div>
              <p className="text-white font-semibold">
                {member.user?.name ||
                  member.user?.username ||
                  'Unknown User'}
              </p>

              <p className="text-dark-500 text-xs">
                {member.role}
              </p>
            </div>
          </div>

          <span className="text-primary-400 font-bold text-lg">
            {member.progress}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{
              width: `${member.progress}%`,
            }}
          />
        </div>

        {/* Task Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="text-center">
            <p className="text-green-400 font-bold">
              {member.completed}
            </p>

            <p className="text-dark-500 text-xs">
              Completed
            </p>
          </div>

          <div className="text-center">
            <p className="text-blue-400 font-bold">
              {member.inProgress}
            </p>

            <p className="text-dark-500 text-xs">
              In Progress
            </p>
          </div>

          <div className="text-center">
            <p className="text-yellow-400 font-bold">
              {member.todo}
            </p>

            <p className="text-dark-500 text-xs">
              To Do
            </p>
          </div>
        </div>

        <p className="text-dark-500 text-xs text-center mt-4">
          {member.completed} of {member.total} tasks completed
        </p>
      </div>
    ))}
  </div>
</div>
{/* =========================================================
    TASK PROGRESS BY MEMBER
========================================================= */}

<div className="mt-8">
  <div className="mb-4">
    <h2 className="text-xl font-bold text-white">
      Member Task Progress
    </h2>

    <p className="text-dark-500 text-sm mt-1">
      See which tasks are completed by each member.
    </p>
  </div>

  {activeMembers.map((member) => {
  const memberId =
    member.userId || member.user?.id;

  const memberTasks = tasks.filter(
    (task) => task.assignee?.id === memberId
  );

  if (memberTasks.length === 0) {
    return (
      <div
        key={memberId}
        className="p-4 bg-dark-800 border border-dark-700 rounded-xl"
      >
        <p className="text-white font-semibold">
          {member.user?.name || 'Unknown User'}
        </p>

        <p className="text-dark-500 text-sm mt-1">
          No tasks assigned
        </p>
      </div>
    );
  }

  return (
    <div
      key={memberId}
      className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden"
    >
      {/* your existing member/task UI */}
    </div>
  );
})}
</div>
{(group?.currentUserRole === 'ADMIN' ||
  group?.currentUserRole === 'MODERATOR') && (
  <div className="mt-6 flex justify-end">
    <button
      type="button"
      onClick={handleDownloadTaskReport}
      disabled={actionLoading}
      className="px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold disabled:opacity-50"
    >
      {actionLoading
        ? 'Preparing Report...'
        : '📊 Download Tasks CSV'}
    </button>
  </div>
)}
{/* FILTER */}
  /*
  |--------------------------------------------------------------------------
  | FILTER
  |--------------------------------------------------------------------------
  */

  const filteredTasks =
    filter === 'ALL'
      ? tasks
      : tasks.filter(
          (task) => task.status === filter
        );

  /*
  |--------------------------------------------------------------------------
  | STATUS STYLE
  |--------------------------------------------------------------------------
  */

  const getStatusStyle = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/10 text-green-400 border-green-500/20';

      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';

      default:
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PRIORITY STYLE
  |--------------------------------------------------------------------------
  */

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-500/10 text-red-400';

      case 'LOW':
        return 'bg-green-500/10 text-green-400';

      default:
        return 'bg-yellow-500/10 text-yellow-400';
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DATE
  |--------------------------------------------------------------------------
  */

  const formatDate = (date) => {
    if (!date) {
      return 'No due date';
    }

    return new Date(date).toLocaleString();
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-dark-900 px-4 py-10">
        <div className="mx-auto max-w-6xl text-center">

          <div className="text-4xl">
            ⏳
          </div>

          <p className="mt-3 text-dark-400">
            Loading tasks...
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-dark-900 px-4 py-10 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl">

        {/* BACK */}

        <Link
          to={`/groups/${groupId}`}
          className="inline-flex items-center gap-2 text-sm text-dark-400 transition hover:text-primary-400"
        >
          ← Back to Group
        </Link>

        {/* HEADER */}

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <div className="flex flex-wrap items-center gap-3">

              <h1 className="text-3xl font-bold text-white">
                Group Tasks
              </h1>

              {currentUserRole && (
                <span className="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-400">
                  {currentUserRole}
                </span>
              )}

            </div>

            {group && (
              <p className="mt-2 text-dark-400">
                {group.name}
              </p>
            )}

          </div>

          <Link
            to={`/groups/${groupId}`}
            className="rounded-xl bg-primary-500 px-5 py-3 text-center font-semibold text-white transition hover:bg-primary-600"
          >
            ＋ Assign Task
          </Link>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* STATS */}

        <div className="mt-8 grid gap-4 sm:grid-cols-4">

          <div className="rounded-2xl border border-dark-700 bg-dark-800 p-5">
            <p className="text-sm text-dark-500">
              Total Tasks
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {tasks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-dark-700 bg-dark-800 p-5">
            <p className="text-sm text-dark-500">
              To Do
            </p>

            <p className="mt-2 text-2xl font-bold text-yellow-400">
              {
                tasks.filter(
                  (task) => task.status === 'TODO'
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-dark-700 bg-dark-800 p-5">
            <p className="text-sm text-dark-500">
              In Progress
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-400">
              {
                tasks.filter(
                  (task) =>
                    task.status === 'IN_PROGRESS'
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-dark-700 bg-dark-800 p-5">
            <p className="text-sm text-dark-500">
              Completed
            </p>

            <p className="mt-2 text-2xl font-bold text-green-400">
              {
                tasks.filter(
                  (task) =>
                    task.status === 'COMPLETED'
                ).length
              }
            </p>
          </div>

        </div>

        {/* FILTER */}

        <div className="mt-8 flex flex-wrap gap-2">

          {[
            ['ALL', 'All Tasks'],
            ['TODO', 'To Do'],
            ['IN_PROGRESS', 'In Progress'],
            ['COMPLETED', 'Completed'],
          ].map(([value, label]) => (

            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                filter === value
                  ? 'bg-primary-500 text-white'
                  : 'border border-dark-700 bg-dark-800 text-dark-400 hover:text-white'
              }`}
            >
              {label}
            </button>

          ))}

        </div>

        {/* TASK LIST */}

        <div className="mt-6">

          {filteredTasks.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-dark-600 bg-dark-800 p-12 text-center">

              <div className="text-5xl">
                📋
              </div>

              <h2 className="mt-4 text-lg font-semibold text-white">
                No tasks found
              </h2>

              <p className="mt-2 text-sm text-dark-500">
                {filter === 'ALL'
                  ? 'No tasks have been assigned yet.'
                  : 'There are no tasks with this status.'}
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {filteredTasks.map((task) => {

                const isUpdating =
                  updatingTask === task.id;

                const isDeleting =
                  deletingTask === task.id;

                return (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-dark-700 bg-dark-800 p-5 shadow-lg"
                  >

                    {/* TOP */}

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <h2 className="text-lg font-semibold text-white">
                            {task.title}
                          </h2>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                              task.status
                            )}`}
                          >
                            {task.status.replace(
                              '_',
                              ' '
                            )}
                          </span>

                        </div>

                        {task.description && (
                          <p className="mt-3 text-sm leading-6 text-dark-400">
                            {task.description}
                          </p>
                        )}

                      </div>

                      {/* MANAGER ACTIONS */}

                      {isManager && (
                        <div className="flex gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(task)
                            }
                            className="rounded-lg bg-primary-500/10 px-4 py-2 text-sm font-semibold text-primary-400 transition hover:bg-primary-500/20"
                          >
                            ✏ Edit
                          </button>

                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() =>
                              deleteTask(task.id)
                            }
                            className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                          >
                            {isDeleting
                              ? 'Deleting...'
                              : '🗑 Delete'}
                          </button>

                        </div>
                      )}

                    </div>

                    {/* DETAILS */}

                    <div className="mt-5 grid gap-3 border-t border-dark-700 pt-5 sm:grid-cols-2 lg:grid-cols-4">

                      {/* ASSIGNEE */}

                      <div>

                        <p className="text-xs text-dark-500">
                          Assigned To
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          {task.assignee?.profileImage ? (

                            <img
                              src={
                                task.assignee.profileImage
                              }
                              alt={
                                task.assignee.name ||
                                'User'
                              }
                              className="h-8 w-8 rounded-full object-cover"
                            />

                          ) : (

                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/10 text-sm font-semibold text-primary-400">
                              {(
                                task.assignee?.name ||
                                task.assignee?.username ||
                                'U'
                              )[0].toUpperCase()}
                            </div>

                          )}

                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-white">
                              {task.assignee?.name ||
                                task.assignee?.username ||
                                'Unknown'}
                            </p>

                            {task.assignee?.username && (
                              <p className="truncate text-xs text-dark-500">
                                @{task.assignee.username}
                              </p>
                            )}

                          </div>

                        </div>

                      </div>

                      {/* DUE DATE */}

                      <div>

                        <p className="text-xs text-dark-500">
                          Due Date
                        </p>

                        <p className="mt-2 text-sm font-medium text-dark-300">
                          📅 {formatDate(task.dueDate)}
                        </p>

                      </div>

                      {/* CREATED BY */}

                      <div>

                        <p className="text-xs text-dark-500">
                          Created By
                        </p>

                        <p className="mt-2 text-sm font-medium text-dark-300">
                          {task.creator?.name ||
                            task.creator?.username ||
                            'Unknown'}
                        </p>

                      </div>

                      {/* CREATED */}

                      <div>

                        <p className="text-xs text-dark-500">
                          Created
                        </p>

                        <p className="mt-2 text-sm font-medium text-dark-300">
                          {formatDate(
                            task.createdAt
                          )}
                        </p>

                      </div>

                    </div>

                    {/* STATUS */}

                    <div className="mt-5 flex flex-col gap-3 border-t border-dark-700 pt-5 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        <p className="text-xs text-dark-500">
                          Update Status
                        </p>

                      </div>

                      <div className="flex flex-wrap gap-2">

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            updateStatus(
                              task.id,
                              'TODO'
                            )
                          }
                          className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                            task.status === 'TODO'
                              ? 'bg-yellow-500 text-black'
                              : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                          } disabled:opacity-50`}
                        >
                          To Do
                        </button>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            updateStatus(
                              task.id,
                              'IN_PROGRESS'
                            )
                          }
                          className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                            task.status ===
                            'IN_PROGRESS'
                              ? 'bg-blue-500 text-white'
                              : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                          } disabled:opacity-50`}
                        >
                          In Progress
                        </button>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            updateStatus(
                              task.id,
                              'COMPLETED'
                            )
                          }
                          className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                            task.status ===
                            'COMPLETED'
                              ? 'bg-green-500 text-white'
                              : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                          } disabled:opacity-50`}
                        >
                          {isUpdating
                            ? 'Updating...'
                            : 'Completed'}
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

      {/* ================================================================
          EDIT TASK MODAL
      ================================================================ */}

      {editingTask && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-dark-700 bg-dark-800 shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-dark-700 p-6">

              <div>

                <h2 className="text-xl font-bold text-white">
                  Edit Task
                </h2>

                <p className="mt-1 text-sm text-dark-500">
                  Update task details and assignment.
                </p>

              </div>

              <button
                type="button"
                disabled={editLoading}
                onClick={closeEditModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-dark-700 text-dark-300 transition hover:text-white disabled:opacity-50"
              >
                ✕
              </button>

            </div>

            {/* MODAL BODY */}

            <div className="space-y-5 p-6">

              {/* ERROR */}

              {editError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                  <p className="text-sm text-red-400">
                    {editError}
                  </p>
                </div>
              )}

              {/* TITLE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-dark-300">
                  Task Title
                </label>

                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) =>
                    setEditTitle(e.target.value)
                  }
                  className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white outline-none placeholder:text-dark-500 focus:border-primary-500"
                  placeholder="Task title"
                />

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="mb-2 block text-sm font-medium text-dark-300">
                  Description
                </label>

                <textarea
                  value={editDescription}
                  onChange={(e) =>
                    setEditDescription(
                      e.target.value
                    )
                  }
                  rows="4"
                  className="w-full resize-none rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white outline-none placeholder:text-dark-500 focus:border-primary-500"
                  placeholder="Task description"
                />

              </div>

              {/* PRIORITY + STATUS */}

              <div className="grid gap-5 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium text-dark-300">
                    Priority
                  </label>

                  <select
                    value={editPriority}
                    onChange={(e) =>
                      setEditPriority(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white outline-none focus:border-primary-500"
                  >
                    <option value="LOW">
                      Low
                    </option>

                    <option value="MEDIUM">
                      Medium
                    </option>

                    <option value="HIGH">
                      High
                    </option>
                  </select>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-dark-300">
                    Status
                  </label>

                  <select
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white outline-none focus:border-primary-500"
                  >
                    <option value="TODO">
                      To Do
                    </option>

                    <option value="IN_PROGRESS">
                      In Progress
                    </option>

                    <option value="COMPLETED">
                      Completed
                    </option>
                  </select>

                </div>

              </div>

              {/* DUE DATE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-dark-300">
                  Due Date
                </label>

                <input
                  type="datetime-local"
                  value={editDueDate}
                  onChange={(e) =>
                    setEditDueDate(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white outline-none focus:border-primary-500"
                />

              </div>

              {/* ASSIGNED MEMBER */}

              <div>

                <label className="mb-2 block text-sm font-medium text-dark-300">
                  Assign To
                </label>

                <select
                  value={editAssignedTo}
                  onChange={(e) =>
                    setEditAssignedTo(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white outline-none focus:border-primary-500"
                >

                  <option value="">
                    Select member
                  </option>

                  {group?.members
                    ?.filter(
                      (member) =>
                        member.status === 'ACTIVE'
                    )
                    .map((member) => (

                      <option
                        key={member.userId}
                        value={member.userId}
                      >
                        {member.user?.name ||
                          member.user?.username ||
                          'Unknown User'}

                        {member.role === 'ADMIN'
                          ? ' (Admin)'
                          : member.role ===
                            'MODERATOR'
                          ? ' (Moderator)'
                          : ''}
                      </option>

                    ))}

                </select>

              </div>

            </div>

            {/* MODAL FOOTER */}

            <div className="flex flex-col-reverse gap-3 border-t border-dark-700 p-6 sm:flex-row sm:justify-end">

              <button
                type="button"
                disabled={editLoading}
                onClick={closeEditModal}
                className="rounded-xl border border-dark-700 bg-dark-900 px-5 py-3 font-semibold text-dark-300 transition hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={editLoading}
                onClick={updateTask}
                className="rounded-xl bg-primary-500 px-5 py-3 font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editLoading
                  ? 'Saving...'
                  : '✓ Save Changes'}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}