export function uniqueMembers(members = []) {
  const byId = new Map();

  members.forEach((member) => {
    if (!member) {
      return;
    }

    const key = member.id || member.userId || member.email || member.name;
    if (!key || byId.has(key)) {
      return;
    }

    byId.set(key, {
      id: member.id || member.userId || '',
      userId: member.userId || member.id || '',
      name: member.name || '',
      email: member.email || '',
      role: member.role || member.membershipRole || '',
      avatarUrl: member.avatarUrl || '',
      team: member.team || ''
    });
  });

  return [...byId.values()];
}

export function getProjectMembers(workgroups = [], projectId = '') {
  if (!projectId) {
    return [];
  }

  return uniqueMembers(
    workgroups
      .filter((group) => (group.projectIds || []).includes(projectId))
      .flatMap((group) => group.members || group.roster || [])
  );
}

export function getWorkspaceMembers(workgroups = [], currentUser = null, userDirectory = []) {
  const groupedMembers = uniqueMembers(workgroups.flatMap((group) => group.members || group.roster || []));
  if (groupedMembers.length) {
    return groupedMembers;
  }

  const directoryMembers = uniqueMembers(userDirectory);
  if (directoryMembers.length) {
    return directoryMembers;
  }

  if (!currentUser) {
    return [];
  }

  return uniqueMembers([
    {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      avatarUrl: currentUser.avatarUrl,
      team: currentUser.team
    }
  ]);
}
