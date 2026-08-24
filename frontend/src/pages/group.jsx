import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Groups() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('PRIVATE');

  const [groupCode, setGroupCode] = useState('');

  const [message, setMessage] = useState('');
  const [joinMessage, setJoinMessage] = useState('');

  const [createdGroup, setCreatedGroup] = useState(null);

  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | GET MY GROUPS
  |--------------------------------------------------------------------------
  */
  const fetchGroups = async () => {
    try {
      setGroupsLoading(true);

      const response = await api.get('/groups');

      setGroups(response.data.groups || []);
    } catch (error) {
      console.error('Get groups error:', error);

      setGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOAD GROUPS
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    fetchGroups();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CREATE GROUP
  |--------------------------------------------------------------------------
  */
  const createGroup = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setMessage('Group name is required');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      setCreatedGroup(null);

      const response = await api.post('/groups', {
        name: name.trim(),
        description: description.trim(),
        privacy,
      });

      const group = response.data.group;

      setCreatedGroup(group);
      setMessage('Group created successfully!');

      setName('');
      setDescription('');
      setPrivacy('PRIVATE');

      await fetchGroups();
    } catch (error) {
      console.error('Create group error:', error);

      setMessage(
        error.response?.data?.error ||
          'Failed to create group'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | JOIN / REQUEST GROUP
  |--------------------------------------------------------------------------
  |
  | We first check the group using its code.
  |
  | PUBLIC:
  |     POST /groups/join
  |
  | PRIVATE:
  |     POST /groups/request
  |
  |--------------------------------------------------------------------------
  */
  const joinGroup = async (e) => {
    e.preventDefault();

    if (!groupCode.trim()) {
      setJoinMessage('Group code is required');
      return;
    }

    try {
      setJoining(true);
      setJoinMessage('');

      const code = groupCode.trim().toUpperCase();

      /*
      |--------------------------------------------------------------------------
      | First find the group using the user's code
      |--------------------------------------------------------------------------
      */
      const groupsResponse = await api.get('/groups');

      /*
      |--------------------------------------------------------------------------
      | We cannot use /groups to search all groups because it only
      | returns groups that the current user already belongs to.
      |
      | So try PUBLIC join first.
      |--------------------------------------------------------------------------
      */
      try {
        const response = await api.post('/groups/join', {
          groupCode: code,
        });

        setJoinMessage(
          response.data.message ||
            'Joined group successfully!'
        );

        setGroupCode('');

        await fetchGroups();

        return;
      } catch (joinError) {
        /*
        |--------------------------------------------------------------------------
        | If the group is PRIVATE, backend returns 403.
        | In that case send a join request.
        |--------------------------------------------------------------------------
        */

        if (joinError.response?.status === 403) {
          const requestResponse = await api.post(
            '/groups/request',
            {
              groupCode: code,
            }
          );

          setJoinMessage(
            requestResponse.data.message ||
              'Join request sent successfully!'
          );

          setGroupCode('');

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | For other errors, show the backend error.
        |--------------------------------------------------------------------------
        */
        throw joinError;
      }
    } catch (error) {
      console.error('Join group error:', error);

      setJoinMessage(
        error.response?.data?.error ||
          'Failed to join group'
      );
    } finally {
      setJoining(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN GROUP DETAILS
  |--------------------------------------------------------------------------
  */
  const openGroup = (groupId) => {
    navigate(`/groups/${groupId}`);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-dark-900 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* ================================================================ */}
        {/* PAGE HEADER */}
        {/* ================================================================ */}

        <div className="mb-8">

          <Link
            to="/"
            className="mb-5 inline-flex items-center gap-2 text-sm text-dark-400 transition hover:text-primary-400"
          >
            ← Back to Dashboard
          </Link>

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10 text-2xl">
              👥
            </div>

            <div>

              <h1 className="text-3xl font-bold text-white">
                Groups
              </h1>

              <p className="mt-1 text-dark-400">
                Create, join and manage your TaskCircle groups.
              </p>

            </div>

          </div>

        </div>

        {/* ================================================================ */}
        {/* JOIN GROUP */}
        {/* ================================================================ */}

        <div className="mb-8 rounded-2xl border border-dark-700 bg-dark-800 shadow-xl">

          <div className="border-b border-dark-700 px-6 py-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-xl">
                🔗
              </div>

              <div>

                <h2 className="text-xl font-semibold text-white">
                  Join a Group
                </h2>

                <p className="mt-1 text-sm text-dark-400">
                  Enter the group code shared with you.
                </p>

              </div>

            </div>

          </div>

          <div className="p-6">

            <form
              onSubmit={joinGroup}
              className="flex flex-col gap-3 sm:flex-row"
            >

              <input
                type="text"
                value={groupCode}
                onChange={(e) =>
                  setGroupCode(e.target.value.toUpperCase())
                }
                placeholder="Example: GRP-A7K29X"
                className="flex-1 rounded-xl border border-dark-600 bg-dark-900 px-4 py-3 font-mono text-white placeholder-dark-500 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />

              <button
                type="submit"
                disabled={joining}
                className="rounded-xl bg-primary-500 px-7 py-3 font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {joining ? 'Processing...' : 'Join Group'}
              </button>

            </form>

            {joinMessage && (
              <div className="mt-4 rounded-xl border border-primary-500/20 bg-primary-500/10 p-3 text-sm text-primary-300">
                {joinMessage}
              </div>
            )}

            <p className="mt-3 text-xs text-dark-500">
              Public groups are joined immediately. Private groups
              require admin approval.
            </p>

          </div>

        </div>

        {/* ================================================================ */}
        {/* CREATE + MY GROUPS */}
        {/* ================================================================ */}

        <div className="grid gap-8 lg:grid-cols-2">

          {/* ============================================================ */}
          {/* CREATE GROUP */}
          {/* ============================================================ */}

          <div className="rounded-2xl border border-dark-700 bg-dark-800 shadow-xl">

            <div className="border-b border-dark-700 px-6 py-5">

              <h2 className="text-xl font-semibold text-white">
                Create a Group
              </h2>

              <p className="mt-1 text-sm text-dark-400">
                Start collaborating with your team.
              </p>

            </div>

            <form
              onSubmit={createGroup}
              className="space-y-6 p-6"
            >

              {/* GROUP NAME */}

              <div>

                <label className="mb-2 block text-sm font-medium text-dark-200">
                  Group Name
                  <span className="ml-1 text-red-400">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Example: DSA Practice"
                  className="w-full rounded-xl border border-dark-600 bg-dark-900 px-4 py-3 text-white placeholder-dark-500 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="mb-2 block text-sm font-medium text-dark-200">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="What is this group about?"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-dark-600 bg-dark-900 px-4 py-3 text-white placeholder-dark-500 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />

              </div>

              {/* PRIVACY */}

              <div>

                <label className="mb-3 block text-sm font-medium text-dark-200">
                  Group Privacy
                </label>

                <div className="grid grid-cols-2 gap-3">

                  {/* PRIVATE */}

                  <button
                    type="button"
                    onClick={() =>
                      setPrivacy('PRIVATE')
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      privacy === 'PRIVATE'
                        ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30'
                        : 'border-dark-600 bg-dark-900 hover:border-dark-500'
                    }`}
                  >

                    <div className="flex items-center justify-between">

                      <span className="text-xl">
                        🔒
                      </span>

                      {privacy === 'PRIVATE' && (
                        <span className="text-xs font-medium text-primary-400">
                          Selected
                        </span>
                      )}

                    </div>

                    <div className="mt-2 font-semibold text-white">
                      Private
                    </div>

                    <div className="mt-1 text-xs text-dark-400">
                      Requires admin approval
                    </div>

                  </button>

                  {/* PUBLIC */}

                  <button
                    type="button"
                    onClick={() =>
                      setPrivacy('PUBLIC')
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      privacy === 'PUBLIC'
                        ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30'
                        : 'border-dark-600 bg-dark-900 hover:border-dark-500'
                    }`}
                  >

                    <div className="flex items-center justify-between">

                      <span className="text-xl">
                        🌎
                      </span>

                      {privacy === 'PUBLIC' && (
                        <span className="text-xs font-medium text-primary-400">
                          Selected
                        </span>
                      )}

                    </div>

                    <div className="mt-2 font-semibold text-white">
                      Public
                    </div>

                    <div className="mt-1 text-xs text-dark-400">
                      Anyone can join
                    </div>

                  </button>

                </div>

              </div>

              {/* CREATE MESSAGE */}

              {message && (
                <div
                  className={`rounded-xl border p-4 text-sm ${
                    createdGroup
                      ? 'border-green-500/30 bg-green-500/10 text-green-400'
                      : 'border-red-500/30 bg-red-500/10 text-red-400'
                  }`}
                >
                  {message}
                </div>
              )}

              {/* CREATED GROUP */}

              {createdGroup && (
                <div className="rounded-xl border border-primary-500/30 bg-primary-500/10 p-5">

                  <div className="flex items-center gap-2">

                    <span className="text-xl">
                      🎉
                    </span>

                    <p className="font-semibold text-white">
                      Group created!
                    </p>

                  </div>

                  <p className="mt-3 text-sm text-dark-400">
                    Share this code with people you want to invite.
                  </p>

                  <div className="mt-3 rounded-xl border border-dark-600 bg-dark-900 px-4 py-3">

                    <p className="text-xs uppercase tracking-wider text-dark-500">
                      Group Code
                    </p>

                    <p className="mt-1 font-mono text-xl font-bold tracking-widest text-primary-400">
                      {createdGroup.groupCode}
                    </p>

                  </div>

                </div>
              )}

              {/* CREATE BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary-500 py-3 font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? 'Creating Group...'
                  : 'Create Group'}
              </button>

            </form>

          </div>

          {/* ============================================================ */}
          {/* MY GROUPS */}
          {/* ============================================================ */}

          <div className="rounded-2xl border border-dark-700 bg-dark-800 shadow-xl">

            <div className="flex items-center justify-between border-b border-dark-700 px-6 py-5">

              <div>

                <h2 className="text-xl font-semibold text-white">
                  My Groups
                </h2>

                <p className="mt-1 text-sm text-dark-400">
                  Groups you belong to.
                </p>

              </div>

              <span className="rounded-full bg-primary-500/10 px-3 py-1 text-sm font-semibold text-primary-400">
                {groups.length}
              </span>

            </div>

            <div className="p-6">

              {/* LOADING */}

              {groupsLoading ? (

                <div className="py-10 text-center">

                  <div className="text-3xl">
                    ⏳
                  </div>

                  <p className="mt-3 text-sm text-dark-400">
                    Loading groups...
                  </p>

                </div>

              ) : groups.length === 0 ? (

                /* EMPTY */

                <div className="rounded-xl border border-dashed border-dark-600 bg-dark-900/50 p-8 text-center">

                  <div className="text-4xl">
                    👥
                  </div>

                  <h3 className="mt-3 font-semibold text-white">
                    No groups yet
                  </h3>

                  <p className="mt-1 text-sm text-dark-500">
                    Create or join a group to get started.
                  </p>

                </div>

              ) : (

                /* GROUP LIST */

                <div className="space-y-4">

                  {groups.map((group) => (

                    <div
                      key={group.id}
                      className="rounded-xl border border-dark-600 bg-dark-900 p-4 transition hover:border-primary-500/50"
                    >

                      {/* GROUP HEADER */}

                      <div className="flex items-start justify-between gap-4">

                        <div className="flex gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-lg">
                            👥
                          </div>

                          <div>

                            <h3 className="font-semibold text-white">
                              {group.name}
                            </h3>

                            {group.description && (
                              <p className="mt-1 text-sm text-dark-400">
                                {group.description}
                              </p>
                            )}

                          </div>

                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            group.privacy === 'PUBLIC'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-yellow-500/10 text-yellow-400'
                          }`}
                        >
                          {group.privacy}
                        </span>

                      </div>

                      {/* GROUP DETAILS */}

                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-dark-700 pt-4">

                        <div className="rounded-lg bg-dark-800 p-3">

                          <p className="text-xs text-dark-500">
                            Group Code
                          </p>

                          <p className="mt-1 font-mono text-sm font-bold tracking-wider text-primary-400">
                            {group.groupCode}
                          </p>

                        </div>

                        <div className="rounded-lg bg-dark-800 p-3">

                          <p className="text-xs text-dark-500">
                            Members
                          </p>

                          <p className="mt-1 text-sm font-semibold text-dark-200">
                            {group.members?.length || 0}
                          </p>

                        </div>

                      </div>
                      
                      {/* VIEW GROUP BUTTON */}

                      <button
                        type="button"
                        onClick={() =>
                          openGroup(group.id)
                        }
                        className="mt-4 w-full rounded-xl border border-dark-600 bg-dark-800 py-2.5 text-sm font-semibold text-dark-200 transition hover:border-primary-500 hover:bg-primary-500/10 hover:text-primary-400"
                      >
                        View Group →
                      </button>

                    </div>

                  ))}

                </div>

              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}