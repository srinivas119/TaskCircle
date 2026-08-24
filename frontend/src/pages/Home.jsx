import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock3,
  ListTodo,
  Users,
  Bell,
  ArrowRight,
  Plus,
  CircleAlert,
  Activity,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [tasksResponse, groupsResponse, notificationResponse] =
        await Promise.allSettled([
          api.get('/tasks/my'),
          api.get('/groups'),
          api.get('/notifications'),
        ]);

      if (tasksResponse.status === 'fulfilled') {
        setTasks(tasksResponse.value.data?.tasks || []);
      }

      if (groupsResponse.status === 'fulfilled') {
        setGroups(groupsResponse.value.data?.groups || []);
      }

      if (notificationResponse.status === 'fulfilled') {
        setNotifications(
          notificationResponse.value.data?.notifications || []
        );
      }
    } catch (error) {
      console.error('Dashboard loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const completed = tasks.filter(
      (task) => task.status === 'COMPLETED'
    ).length;

    const inProgress = tasks.filter(
      (task) => task.status === 'IN_PROGRESS'
    ).length;

    const pending = tasks.filter(
      (task) => task.status === 'TODO'
    ).length;

    return {
      total: tasks.length,
      completed,
      inProgress,
      pending,
    };
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    return [...tasks]
      .filter(
        (task) =>
          task.status !== 'COMPLETED' &&
          task.dueDate
      )
      .sort(
        (a, b) =>
          new Date(a.dueDate) -
          new Date(b.dueDate)
      )
      .slice(0, 5);
  }, [tasks]);

  const recentNotifications = notifications.slice(0, 5);

  const formatDate = (date) => {
    if (!date) return 'No due date';

    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }
    );
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-400 bg-red-500/10 border-red-500/20';

      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';

      case 'LOW':
        return 'text-green-400 bg-green-500/10 border-green-500/20';

      default:
        return 'text-dark-300 bg-dark-700 border-dark-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'TODO':
        return 'To Do';

      case 'IN_PROGRESS':
        return 'In Progress';

      case 'COMPLETED':
        return 'Completed';

      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-dark-900 px-4 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-10 w-72 bg-dark-800 rounded-lg" />
            <div className="h-5 w-96 bg-dark-800 rounded-lg" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 bg-dark-800 rounded-2xl"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-dark-900 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Welcome */}
        <section className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-primary-400 text-sm font-semibold mb-2">
                DASHBOARD
              </p>

              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                Welcome back,{' '}
                <span className="text-primary-400">
                  {user?.name || 'User'}
                </span>{' '}
                👋
              </h1>

              <p className="text-dark-400 mt-2">
                Here&apos;s what&apos;s happening with your
                tasks and groups.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                to="/groups"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                bg-primary-500 hover:bg-primary-600 text-white font-semibold
                transition-all"
              >
                <Plus size={18} />
                Create / Join Group
              </Link>

              <Link
                to="/groups"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5
                rounded-xl border border-dark-700 bg-dark-800
                hover:bg-dark-700 text-dark-200 font-semibold transition-all"
              >
                <Users size={18} />
                My Groups
              </Link>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

          <StatCard
            title="Total Tasks"
            value={stats.total}
            icon={<ListTodo size={22} />}
            description="All assigned tasks"
          />

          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<Clock3 size={22} />}
            description="Tasks waiting to start"
          />

          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={<Activity size={22} />}
            description="Currently working"
          />

          <StatCard
            title="Completed"
            value={stats.completed}
            icon={<CheckCircle2 size={22} />}
            description="Successfully completed"
          />
        </section>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Upcoming Tasks */}
          <section className="lg:col-span-2 bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">

            <div className="flex items-center justify-between px-6 py-5 border-b border-dark-700">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Upcoming Tasks
                </h2>

                <p className="text-sm text-dark-400 mt-1">
                  Tasks that need your attention
                </p>
              </div>

              <Link
                to="/groups"
                className="text-sm text-primary-400 hover:text-primary-300
                flex items-center gap-1"
              >
                View all
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="divide-y divide-dark-700">
              {upcomingTasks.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={28} />}
                  title="No upcoming tasks"
                  description="You're all caught up!"
                />
              ) : (
                upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="px-6 py-5 hover:bg-dark-700/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">
                        <h3 className="text-white font-semibold truncate">
                          {task.title}
                        </h3>

                        {task.description && (
                          <p className="text-sm text-dark-400 mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mt-3">

                          <span className="text-xs px-2.5 py-1 rounded-lg
                            border border-dark-600 bg-dark-700 text-dark-300">
                            {getStatusText(task.status)}
                          </span>

                          <span
                            className={`text-xs px-2.5 py-1 rounded-lg border ${getPriorityClass(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>

                          <span className="text-xs text-dark-400 flex items-center gap-1">
                            <Clock3 size={13} />
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </div>

                      {task.status !== 'COMPLETED' && (
                        <CircleAlert
                          size={20}
                          className={
                            task.priority === 'HIGH'
                              ? 'text-red-400'
                              : 'text-dark-500'
                          }
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Groups */}
          <section className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">

            <div className="flex items-center justify-between px-6 py-5 border-b border-dark-700">
              <div>
                <h2 className="text-lg font-bold text-white">
                  My Groups
                </h2>

                <p className="text-sm text-dark-400 mt-1">
                  Your active groups
                </p>
              </div>

              <Link
                to="/groups"
                className="text-primary-400 hover:text-primary-300"
              >
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="p-4 space-y-2">
              {groups.length === 0 ? (
                <EmptyState
                  icon={<Users size={28} />}
                  title="No groups yet"
                  description="Join a group to collaborate."
                />
              ) : (
                groups.slice(0, 5).map((group) => (
                  <Link
                    key={group.id}
                    to={`/groups/${group.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl
                    hover:bg-dark-700 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary-500/15
                      border border-primary-500/20 flex items-center
                      justify-center text-primary-400 font-bold">
                      {group.name?.charAt(0)?.toUpperCase() || 'G'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">
                        {group.name}
                      </p>

                      <p className="text-xs text-dark-400 mt-1">
                        {group._count?.members ??
                          group.members?.length ??
                          0}{' '}
                        members
                      </p>
                    </div>

                    <ArrowRight
                      size={16}
                      className="text-dark-500"
                    />
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

          {/* Notifications */}
          <section className="lg:col-span-2 bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">

            <div className="flex items-center justify-between px-6 py-5 border-b border-dark-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10
                  flex items-center justify-center text-primary-400">
                  <Bell size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white">
                    Recent Notifications
                  </h2>

                  <p className="text-sm text-dark-400">
                    Latest updates about your tasks
                  </p>
                </div>
              </div>

              <Link
                to="/notifications"
                className="text-sm text-primary-400 hover:text-primary-300
                flex items-center gap-1"
              >
                View all
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="divide-y divide-dark-700">
              {recentNotifications.length === 0 ? (
                <EmptyState
                  icon={<Bell size={28} />}
                  title="No notifications"
                  description="You're up to date."
                />
              ) : (
                recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-6 py-4 ${
                      !notification.isRead
                        ? 'bg-primary-500/5'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-primary-400 shrink-0" />

                      <div>
                        <p className="text-white font-medium">
                          {notification.title}
                        </p>

                        <p className="text-sm text-dark-400 mt-1">
                          {notification.message}
                        </p>

                        <p className="text-xs text-dark-500 mt-2">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="bg-dark-800 border border-dark-700 rounded-2xl p-6">

            <h2 className="text-lg font-bold text-white">
              Quick Actions
            </h2>

            <p className="text-sm text-dark-400 mt-1 mb-5">
              Quickly access important areas
            </p>

            <div className="space-y-3">

              <QuickAction
                to="/groups"
                icon={<Users size={19} />}
                title="View Groups"
                description="Manage your groups"
              />

              <QuickAction
                to="/groups"
                icon={<Plus size={19} />}
                title="Create Group"
                description="Start collaborating"
              />

              <QuickAction
                to="/notifications"
                icon={<Bell size={19} />}
                title="Notifications"
                description="Check recent updates"
              />

              <QuickAction
                to="/profile"
                icon={<Users size={19} />}
                title="My Profile"
                description="Manage your account"
              />

            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
}) {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5
      hover:border-primary-500/30 transition-all">

      <div className="flex items-center justify-between">

        <div className="w-11 h-11 rounded-xl bg-primary-500/10
          text-primary-400 flex items-center justify-center">
          {icon}
        </div>

        <span className="text-3xl font-bold text-white">
          {value}
        </span>
      </div>

      <h3 className="text-white font-semibold mt-4">
        {title}
      </h3>

      <p className="text-xs text-dark-500 mt-1">
        {description}
      </p>
    </div>
  );
}

function QuickAction({
  to,
  icon,
  title,
  description,
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 rounded-xl
      border border-dark-700 hover:border-primary-500/30
      hover:bg-dark-700 transition-all"
    >
      <div className="w-9 h-9 rounded-lg bg-primary-500/10
        text-primary-400 flex items-center justify-center">
        {icon}
      </div>

      <div className="flex-1">
        <p className="text-sm text-white font-medium">
          {title}
        </p>

        <p className="text-xs text-dark-500">
          {description}
        </p>
      </div>

      <ArrowRight
        size={15}
        className="text-dark-500"
      />
    </Link>
  );
}

function EmptyState({
  icon,
  title,
  description,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-dark-700
        text-dark-400 flex items-center justify-center mb-4">
        {icon}
      </div>

      <h3 className="text-white font-semibold">
        {title}
      </h3>

      <p className="text-sm text-dark-500 mt-1">
        {description}
      </p>
    </div>
  );
}

export default Home;