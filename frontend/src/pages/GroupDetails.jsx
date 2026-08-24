import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function GroupDetails() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [actionLoading, setActionLoading] = useState(false);

  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const [showCreateTask, setShowCreateTask] = useState(false);

 const [taskForm, setTaskForm] = useState({
  title: '',
  description: '',
  priority: 'MEDIUM',
  dueDate: '',
  assignedTo: '',
  link: '',
  assignToAll: false,
});

  const [taskError, setTaskError] = useState('');

  /*
  |--------------------------------------------------------------------------
  | LOAD GROUP
  |--------------------------------------------------------------------------
  */
const handleDeleteTask = async (taskId) => {
  const confirmed = window.confirm(
    'Are you sure you want to delete this task?'
  );

  if (!confirmed) return;

  try {
    setActionLoading(true);

    await api.delete(`/tasks/${taskId}`);

    // Immediately remove the task from group.tasks
    setGroup((prevGroup) => ({
      ...prevGroup,
      tasks: (prevGroup.tasks || []).filter(
        (task) => task.id !== taskId
      ),
    }));

  } catch (error) {
    console.error(
      'Delete task error:',
      error.response?.data || error
    );

    alert(
      error.response?.data?.error ||
      'Failed to delete task'
    );
  } finally {
    setActionLoading(false);
  }
};
// const handleDownloadTaskReport = async () => {
//   const confirmed = window.confirm(
//     'Download the task report? Completed tasks will be removed after the report is generated.'
//   );

//   if (!confirmed) return;

//   try {
//     setActionLoading(true);
//     setTaskError('');

//     const response = await api.get(
//       `/groups/${groupId}/tasks/report`,
//       {
//         responseType: 'blob',
//       }
//     );

//     const blob = new Blob(
//       [response.data],
//       {
//         type: 'text/csv;charset=utf-8;',
//       }
//     );

//     const url =
//       window.URL.createObjectURL(blob);

//     const link =
//       document.createElement('a');

//     link.href = url;

//     link.download =
//       `group-${groupId}-tasks-report.csv`;

//     document.body.appendChild(link);

//     link.click();

//     link.remove();

//     window.URL.revokeObjectURL(url);

//     // Reload group so completed tasks disappear
//     await fetchGroup();

//   } catch (error) {
//     console.error(
//       'Download task report error:',
//       error
//     );

//     setTaskError(
//       error.response?.data?.error ||
//       'Failed to download task report'
//     );
//   } finally {
//     setActionLoading(false);
//   }
// };
 const handleDeleteGroup = async () => {
  const confirmed = window.confirm(
    'Are you sure you want to delete this group? All tasks and memberships will also be deleted.'
  );

  if (!confirmed) return;

  try {
    await api.delete(`/groups/${group.id}`);

    navigate('/groups');
  } catch (error) {
    console.error('Delete group error:', error);

    setError(
      error.response?.data?.error || 'Failed to delete group'
    );
  }
};
  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`/groups/${groupId}`);

      if (response.data?.success) {
        setGroup(response.data.group);
      } else {
        setError(
          response.data?.error || 'Failed to load group'
        );
      }
    } catch (err) {
      console.error('Get group details error:', err);

      setError(
        err.response?.data?.error ||
          'Failed to load group details'
      );
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  /*
  |--------------------------------------------------------------------------
  | LOAD JOIN REQUESTS
  |--------------------------------------------------------------------------
  */
  const fetchJoinRequests = useCallback(async () => {
    if (!group) return;

    const canManageRequests =
      group.currentUserRole === 'ADMIN' ||
      group.currentUserRole === 'MODERATOR';

    if (!canManageRequests) return;

    try {
      setRequestsLoading(true);

      const response = await api.get(
        `/groups/${groupId}/join-requests`
      );

      if (response.data?.success) {
        setRequests(response.data.requests || []);
      }
    } catch (err) {
      console.error('Get join requests error:', err);
    } finally {
      setRequestsLoading(false);
    }
  }, [
    group,
    groupId,
  ]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  useEffect(() => {
    if (group) {
      fetchJoinRequests();
    }
  }, [group, fetchJoinRequests]);

  /*
  |--------------------------------------------------------------------------
  | PERMISSION
  |--------------------------------------------------------------------------
  */
  const canAssignTasks =
    group?.currentUserRole === 'ADMIN' ||
    group?.currentUserCanAssignTasks === true;

  const isAdmin =
    group?.currentUserRole === 'ADMIN';

  const canManageRequests =
    group?.currentUserRole === 'ADMIN' ||
    group?.currentUserRole === 'MODERATOR';

  /*
  |--------------------------------------------------------------------------
  | UPDATE MEMBER TASK PERMISSION
  |--------------------------------------------------------------------------
  */
  const updateTaskPermission = async (
    memberId,
    currentPermission
  ) => {
    try {
      setActionLoading(true);

      const response = await api.patch(
        `/groups/${groupId}/members/${memberId}/task-permission`,
        {
          canAssignTasks: !currentPermission,
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.error ||
            'Failed to update permission'
        );
      }

      await fetchGroup();
    } catch (err) {
      console.error(
        'Update task permission error:',
        err
      );

      alert(
        err.response?.data?.error ||
          err.message ||
          'Failed to update permission'
      );
    } finally {
      setActionLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | APPROVE REQUEST
  |--------------------------------------------------------------------------
  */
  const approveRequest = async (requestId) => {
    try {
      setActionLoading(true);

      const response = await api.patch(
        `/groups/${groupId}/join-requests/${requestId}/approve`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.error ||
            'Failed to approve request'
        );
      }

      await fetchJoinRequests();
      await fetchGroup();
    } catch (err) {
      console.error('Approve request error:', err);

      alert(
        err.response?.data?.error ||
          err.message ||
          'Failed to approve request'
      );
    } finally {
      setActionLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REJECT REQUEST
  |--------------------------------------------------------------------------
  */
  const rejectRequest = async (requestId) => {
    try {
      setActionLoading(true);

      const response = await api.patch(
        `/groups/${groupId}/join-requests/${requestId}/reject`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.error ||
            'Failed to reject request'
        );
      }

      await fetchJoinRequests();
    } catch (err) {
      console.error('Reject request error:', err);

      alert(
        err.response?.data?.error ||
          err.message ||
          'Failed to reject request'
      );
    } finally {
      setActionLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CREATE TASK
  |--------------------------------------------------------------------------
  */
const createTask = async (e) => {
  e.preventDefault();

  console.log('🔥 CREATE TASK CALLED');

  if (actionLoading) {
    console.log('⛔ DUPLICATE BLOCKED');
    return;
  }

  setTaskError('');

  if (!taskForm.title.trim()) {
    setTaskError('Task title is required');
    return;
  }

  if (!taskForm.assignToAll && !taskForm.assignedTo) {
    setTaskError(
      'Please select a member or choose "Assign to everyone"'
    );
    return;
  }

  try {
    setActionLoading(true);

    console.log('🚀 SENDING ONE POST /tasks');

    let response;

    if (taskForm.assignToAll) {
      response = await api.post('/tasks', {
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || null,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate || null,
        groupId: group.id,
        assignedTo: null,
        assignToAll: true,
        link: taskForm.link.trim() || null,
      });
    } else {
      response = await api.post('/tasks', {
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || null,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate || null,
        groupId: group.id,
        assignedTo: taskForm.assignedTo,
        assignToAll: false,
        link: taskForm.link.trim() || null,
      });
    }

    console.log('✅ TASK RESPONSE:', response.data);

    setShowCreateTask(false);

    await fetchGroup();

  } catch (err) {
    console.error('❌ CREATE TASK ERROR:', err);

    setTaskError(
      err.response?.data?.error ||
      err.message ||
      'Failed to create task'
    );
  } finally {
    setActionLoading(false);
  }
};
const handleDownloadTaskReport = async () => {
  const confirmed = window.confirm(
    'Download the task report? Completed tasks will be removed after the report is generated.'
  );

  if (!confirmed) return;

  try {
    setActionLoading(true);
    setTaskError('');

    const response = await api.get(
      `/groups/${groupId}/tasks/report`,
      {
        responseType: 'blob',
      }
    );

    const blob = new Blob([response.data], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;
    link.download = `group-${groupId}-tasks-report.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);

    await fetchGroup();

  } catch (err) {
    console.error(
      'Download task report error:',
      err
    );

    setTaskError(
      err.response?.data?.error ||
      'Failed to download task report'
    );
  } finally {
    setActionLoading(false);
  }
};
  /*
  |--------------------------------------------------------------------------
  | ASSIGN TASK TO EVERYONE
  |--------------------------------------------------------------------------
  */
  const assignTaskToEveryone = async (taskId) => {
    if (!canAssignTasks) return;

    const confirmed = window.confirm(
      'Assign this task to every active group member?'
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      const response = await api.post(
        `/tasks/${taskId}/assign-all`,
        {
          groupId,
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.error ||
            'Failed to assign task to everyone'
        );
      }

      alert(
        response.data?.message ||
          'Task assigned to everyone'
      );

      await fetchGroup();
    } catch (err) {
      console.error(
        'Assign task to everyone error:',
        err
      );

      alert(
        err.response?.data?.error ||
          err.message ||
          'Failed to assign task to everyone'
      );
    } finally {
      setActionLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LEAVE GROUP
  |--------------------------------------------------------------------------
  */
 const deleteGroup = async () => {
  const confirmed = window.confirm(
    'Are you sure you want to delete this group permanently?'
  );

  if (!confirmed) return;

  try {
    setActionLoading(true);

    const response = await api.delete(
      `/groups/${groupId}`
    );

    if (!response.data?.success) {
      throw new Error(
        response.data?.error || 'Failed to delete group'
      );
    }

    navigate('/groups');
  } catch (err) {
    console.error('Delete group error:', err);

    alert(
      err.response?.data?.error ||
        err.message ||
        'Failed to delete group'
    );
  } finally {
    setActionLoading(false);
  }
};
  const leaveGroup = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to leave this group?'
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      const response = await api.delete(
        `/groups/${groupId}/leave`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.error ||
            'Failed to leave group'
        );
      }

      navigate('/groups');
    } catch (err) {
      console.error('Leave group error:', err);

      alert(
        err.response?.data?.error ||
          err.message ||
          'Failed to leave group'
      );
    } finally {
      setActionLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | HELPERS
  |--------------------------------------------------------------------------
  */
  const formatDate = (date) => {
    if (!date) return 'No due date';

    return new Date(date).toLocaleDateString(
      undefined,
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/10 text-green-400';

      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-400';

      case 'TODO':
      default:
        return 'bg-yellow-500/10 text-yellow-400';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-500/10 text-red-400';

      case 'LOW':
        return 'bg-green-500/10 text-green-400';

      case 'MEDIUM':
      default:
        return 'bg-yellow-500/10 text-yellow-400';
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto" />

          <p className="text-dark-400 mt-4">
            Loading group...
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */
  if (error || !group) {
    return (
      <div className="min-h-screen bg-dark-900 px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-red-400">
              Unable to load group
            </h2>

            <p className="text-dark-300 mt-2">
              {error || 'Group not found'}
            </p>

            <div className="flex gap-3 mt-5">
              <button
                onClick={fetchGroup}
                className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold"
              >
                Try Again
              </button>

              <Link
                to="/groups"
                className="px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-white text-sm font-semibold"
              >
                Back to Groups
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeMembers =
    group.members?.filter(
      (member) => member.status === 'ACTIVE'
    ) || [];

  

const tasks = group.tasks || [];

const memberProgress = activeMembers.map((member) => {
  const memberTasks = tasks.filter(
    (task) => task.assignedTo === member.userId
  );

  const completed = memberTasks.filter(
    (task) => task.status === 'COMPLETED'
  ).length;

  const inProgress = memberTasks.filter(
    (task) => task.status === 'IN_PROGRESS'
  ).length;

  const todo = memberTasks.filter(
    (task) => task.status === 'TODO'
  ).length;

  const total = memberTasks.length;

  return {
    ...member,
    total,
    completed,
    inProgress,
    todo,
    progress:
      total > 0
        ? Math.round((completed / total) * 100)
        : 0,
  };
});

// ADD THESE
const completedTasks = tasks.filter(
  (task) => task.status === 'COMPLETED'
).length;

const inProgressTasks = tasks.filter(
  (task) => task.status === 'IN_PROGRESS'
).length;

const todoTasks = tasks.filter(
  (task) => task.status === 'TODO'
).length;
  return (
    <div className="min-h-screen bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* =========================================================
            HEADER
        ========================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                to="/groups"
                className="text-dark-400 hover:text-white"
              >
                ← Groups
              </Link>

              <span className="text-dark-600">
                /
              </span>

              <span className="text-dark-400">
                Group Details
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">
                {group.name}
              </h1>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  group.privacy === 'PUBLIC'
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-purple-500/10 text-purple-400'
                }`}
              >
                {group.privacy}
              </span>
            </div>

            {group.description && (
              <p className="text-dark-400 mt-2 max-w-2xl">
                {group.description}
              </p>
            )}

            <p className="text-dark-500 text-sm mt-2">
              Group Code:{' '}
              <span className="text-primary-400 font-semibold">
                {group.groupCode}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            {canAssignTasks && (
              <button
                onClick={() =>
                  setShowCreateTask(true)
                }
                className="px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm"
              >
                + Create Task
              </button>
            )}

              {isAdmin ? (
         <button
           onClick={deleteGroup}
           disabled={actionLoading}
             className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-50"
              >
              Delete Group
         </button>
) : (
  <button
    onClick={leaveGroup}
    disabled={actionLoading}
    className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold text-sm disabled:opacity-50"
  >
    Leave Group
  </button>
)}
          </div>
        </div>

        {/* =========================================================
            STATISTICS
        ========================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5">
            <p className="text-dark-400 text-sm">
              Members
            </p>

            <p className="text-2xl font-bold text-white mt-2">
              {activeMembers.length}
            </p>
          </div>

          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5">
            <p className="text-dark-400 text-sm">
              Total Tasks
            </p>

            <p className="text-2xl font-bold text-white mt-2">
              {tasks.length}
            </p>
          </div>

          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5">
            <p className="text-dark-400 text-sm">
              Completed
            </p>

            <p className="text-2xl font-bold text-green-400 mt-2">
              {completedTasks}
            </p>
          </div>

          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5">
            <p className="text-dark-400 text-sm">
              Pending
            </p>

            <p className="text-2xl font-bold text-yellow-400 mt-2">
              {todoTasks + inProgressTasks}
            </p>
          </div>
        </div>

        {/* =========================================================
            MAIN GRID
        ========================================================= */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* =======================================================
              TASKS
          ======================================================= */}
          <div className="xl:col-span-2">

            <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">

              <div className="p-5 border-b border-dark-700 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Group Tasks
                  </h2>

                  <p className="text-dark-500 text-sm mt-1">
                    {tasks.length} task
                    {tasks.length !== 1
                      ? 's'
                      : ''}
                  </p>
                </div>

                {canAssignTasks && (
                  <button
                    onClick={() =>
                      setShowCreateTask(true)
                    }
                    className="text-primary-400 hover:text-primary-300 text-sm font-semibold"
                  >
                    + Add Task
                  </button>
                )}
              </div>
                
              {tasks.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="text-4xl mb-3">
                    📋
                  </div>

                  <h3 className="text-white font-semibold">
                    No tasks yet
                  </h3>

                  <p className="text-dark-500 text-sm mt-1">
                    Create the first task for this
                    group.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-dark-700">

                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-5 hover:bg-dark-700/30 transition-colors"
                    >

                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="text-white font-semibold">
                              {task.title}
                            </h3>

                            <span
                              className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusClass(
                                task.status
                              )}`}
                            >
                              {task.status.replace(
                                '_',
                                ' '
                              )}
                            </span>

                            <span
                              className={`px-2 py-1 rounded-md text-xs font-medium ${getPriorityClass(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-dark-400 text-sm mt-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-xs text-dark-500">

                            <span>
                              👤{' '}
                              {task.assignee?.name ||
                                task.assignee?.username ||
                                'Unknown'}
                            </span>

                            <span>
                              📅{' '}
                              {formatDate(
                                task.dueDate
                              )}
                            </span>
                          </div>

                          {task.link && (
                            <a
                              href={task.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 mt-3 text-sm text-primary-400 hover:text-primary-300"
                            >
                              🔗 Open Link
                            </a>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">

  <div className="flex flex-wrap items-center gap-2 shrink-0">

  {canAssignTasks && (
    <button
      onClick={() =>
        assignTaskToEveryone(task.id)
      }
      disabled={actionLoading}
      className="px-3 py-2 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/20 text-primary-400 text-xs font-semibold disabled:opacity-50"
    >
      👥 Assign to Everyone
    </button>
  )}

  {(isAdmin || group?.currentUserRole === 'MODERATOR') && (
    <button
      onClick={() => handleDeleteTask(task.id)}
      disabled={actionLoading}
      className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold disabled:opacity-50"
    >
      🗑️ Delete
    </button>
  )}

</div>

                   

                     </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* =======================================================
              MEMBERS
          ======================================================= */}
          <div>

            <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">

              <div className="p-5 border-b border-dark-700">
                <h2 className="text-lg font-bold text-white">
                  Members
                </h2>

                <p className="text-dark-500 text-sm mt-1">
                  {activeMembers.length} active
                  member
                  {activeMembers.length !== 1
                    ? 's'
                    : ''}
                </p>
              </div>

              <div className="divide-y divide-dark-700">

                {activeMembers.map((member) => {
                  const memberCanAssign =
                    member.role === 'ADMIN' ||
                    member.canAssignTasks === true;

                  return (
                    <div
                      key={member.id}
                      className="p-4"
                    >

                      <div className="flex items-center gap-3">

                        {member.user?.profileImage ? (
                          <img
                            src={
                              member.user
                                .profileImage
                            }
                            alt={
                              member.user.name ||
                              'User'
                            }
                            className="w-10 h-10 rounded-full object-cover border border-dark-600"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                            {(
                              member.user?.name ||
                              member.user
                                ?.username ||
                              'U'
                            )[0].toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">

                          <p className="text-white font-medium truncate">
                            {member.user?.name ||
                              member.user
                                ?.username ||
                              'Unknown User'}
                          </p>

                          <div className="flex flex-wrap gap-2 mt-1">

                            <span className="text-xs text-dark-500">
                              @{member.user?.username ||
                                'user'}
                            </span>

                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                member.role ===
                                'ADMIN'
                                  ? 'bg-red-500/10 text-red-400'
                                  : member.role ===
                                    'MODERATOR'
                                  ? 'bg-blue-500/10 text-blue-400'
                                  : 'bg-dark-700 text-dark-400'
                              }`}
                            >
                              {member.role}
                            </span>

                          </div>
                        </div>
                      </div>

                      {/* Permission */}
                      {isAdmin &&
                        member.user?.id !==
                          user?.id &&
                        member.role !==
                          'ADMIN' && (
                          <div className="mt-3 flex items-center justify-between gap-3">

                            <div>
                              <p className="text-xs text-dark-300">
                                Task assignment
                              </p>

                              <p className="text-xs text-dark-500 mt-0.5">
                                {memberCanAssign
                                  ? 'Can assign tasks'
                                  : 'Cannot assign tasks'}
                              </p>
                            </div>

                            <button
                              onClick={() =>
                                updateTaskPermission(
                                  member.user.id,
                                  memberCanAssign
                                )
                              }
                              disabled={
                                actionLoading
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 ${
                                memberCanAssign
                                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                  : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                              }`}
                            >
                              {memberCanAssign
                                ? 'Revoke'
                                : 'Allow'}
                            </button>
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            JOIN REQUESTS
        ========================================================= */}
        {canManageRequests && (
          <div className="mt-6 bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">

            <div className="p-5 border-b border-dark-700 flex items-center justify-between">

              <div>
                <h2 className="text-lg font-bold text-white">
                  Join Requests
                </h2>

                <p className="text-dark-500 text-sm mt-1">
                  Approve or reject people waiting
                  to join.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-semibold">
                {requests.length} pending
              </span>
            </div>

            {requestsLoading ? (
              <div className="p-6 text-center text-dark-500">
                Loading requests...
              </div>
            ) : requests.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-dark-500 text-sm">
                  No pending join requests.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-dark-700">

                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >

                    <div className="flex items-center gap-3">

                      {request.user?.profileImage ? (
                        <img
                          src={
                            request.user
                              .profileImage
                          }
                          alt={
                            request.user.name ||
                            'User'
                          }
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                          {(
                            request.user?.name ||
                            request.user
                              ?.username ||
                            'U'
                          )[0].toUpperCase()}
                        </div>
                      )}

                      <div>
                        <p className="text-white font-medium">
                          {request.user?.name ||
                            request.user
                              ?.username ||
                            'Unknown User'}
                        </p>

                        <p className="text-dark-500 text-xs mt-1">
                          @{request.user?.username ||
                            'user'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">

                      <button
                        onClick={() =>
                          approveRequest(
                            request.id
                          )
                        }
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm font-semibold disabled:opacity-50"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() =>
                          rejectRequest(
                            request.id
                          )
                        }
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            CREATE TASK MODAL
        ========================================================= */}
        {showCreateTask && (
  <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">

    <div className="w-full max-w-2xl max-h-[90vh] bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="shrink-0 p-5 border-b border-dark-700 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            Create Task
          </h2>

          <p className="text-dark-500 text-sm mt-1">
            Add a task to {group.name}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateTask(false);
            setTaskError('');
          }}
          className="text-dark-400 hover:text-white text-2xl"
        >
          ×
        </button>
      </div>

      {/* FORM */}
      <form
        onSubmit={createTask}
        className="flex flex-col min-h-0 flex-1"
      >

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {taskError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              {taskError}
            </div>
          )}

          {/* TITLE */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Task Title *
            </label>

            <input
              type="text"
              value={taskForm.title}
              onChange={(e) =>
                setTaskForm({
                  ...taskForm,
                  title: e.target.value,
                })
              }
              placeholder="Enter task title"
              required
              className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Description
            </label>

            <textarea
              value={taskForm.description}
              onChange={(e) =>
                setTaskForm({
                  ...taskForm,
                  description: e.target.value,
                })
              }
              rows={4}
              placeholder="Optional description"
              className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 resize-none"
            />
          </div>

          {/* ASSIGNMENT */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-3">
              Assign To *
            </label>

            {/* ASSIGN TO EVERYONE */}
            <label className="flex items-center gap-3 p-4 rounded-xl bg-dark-900 border border-dark-700 cursor-pointer hover:border-primary-500 transition">
              <input
                type="checkbox"
                checked={taskForm.assignToAll}
                onChange={(e) =>
                  setTaskForm({
                    ...taskForm,
                    assignToAll: e.target.checked,
                    assignedTo: e.target.checked
                      ? ''
                      : taskForm.assignedTo,
                  })
                }
                className="w-5 h-5 accent-primary-500"
              />

              <div>
                <p className="text-white font-semibold">
                  Assign to everyone
                </p>

                <p className="text-xs text-dark-500 mt-1">
                  Create this task for all active group members
                </p>
              </div>
            </label>

            {/* MEMBER SELECT */}
            {!taskForm.assignToAll && (
              <div className="mt-3">
                <select
                  value={taskForm.assignedTo}
                  onChange={(e) =>
                    setTaskForm({
                      ...taskForm,
                      assignedTo: e.target.value,
                    })
                  }
                  required={!taskForm.assignToAll}
                  className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">
                    Select a member
                  </option>

                  {activeMembers.map((member) => (
                    <option
                      key={member.user.id}
                      value={member.user.id}
                    >
                      {member.user?.name ||
                        member.user?.username ||
                        'User'}

                      {member.role === 'ADMIN'
                        ? ' (Admin)'
                        : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* PRIORITY */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Priority
            </label>

            <select
              value={taskForm.priority}
              onChange={(e) =>
                setTaskForm({
                  ...taskForm,
                  priority: e.target.value,
                })
              }
              className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl text-white focus:outline-none focus:border-primary-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          {/* DUE DATE */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Due Date
            </label>

            <input
              type="date"
              value={taskForm.dueDate}
              onChange={(e) =>
                setTaskForm({
                  ...taskForm,
                  dueDate: e.target.value,
                })
              }
              className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl text-white focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* LINK */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Task Link
              <span className="text-dark-500 ml-1">
                (optional)
              </span>
            </label>

            <input
              type="url"
              value={taskForm.link}
              onChange={(e) =>
                setTaskForm({
                  ...taskForm,
                  link: e.target.value,
                })
              }
              placeholder="https://leetcode.com/"
              className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
            />

            <p className="text-xs text-dark-500 mt-2">
              Add a job, LeetCode, documentation, or any useful link.
            </p>
          </div>

        </div>

        {/* FOOTER */}
        <div className="shrink-0 p-5 border-t border-dark-700 bg-dark-800 flex flex-col sm:flex-row gap-3">

          <button
            type="button"
            onClick={() => {
              setShowCreateTask(false);
              setTaskError('');
            }}
            disabled={actionLoading}
            className="flex-1 px-5 py-3 rounded-xl bg-dark-700 hover:bg-dark-600 text-white font-semibold disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={actionLoading}
            className="flex-1 px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold disabled:opacity-50"
          >
            {actionLoading
              ? 'Creating...'
              : taskForm.assignToAll
              ? '👥 Assign to Everyone'
              : '✓ Assign Task'}
          </button>

        </div>

      </form>
    </div>
  </div>
)}
      </div>
    </div>
  );
}

export default GroupDetails;