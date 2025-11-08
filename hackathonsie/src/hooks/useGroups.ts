/**
 * useGroups Hook
 * Custom hook for managing groups
 */

import { useState, useEffect, useCallback } from 'react';
import { Group, GroupInsert, GroupUpdate, GroupMember } from '../types/database.types';
import { GroupService } from '../services/group.service';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const data = await GroupService.fetchUserGroups();
      setGroups(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = useCallback(async (group: GroupInsert) => {
    try {
      const newGroup = await GroupService.createGroup(group);
      setGroups((prev) => [newGroup, ...prev]);
      return newGroup;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateGroup = useCallback(async (groupId: string, updates: GroupUpdate) => {
    try {
      const updatedGroup = await GroupService.updateGroup(groupId, updates);
      setGroups((prev) => prev.map((g) => (g.id === groupId ? updatedGroup : g)));
      return updatedGroup;
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteGroup = useCallback(async (groupId: string) => {
    try {
      await GroupService.deleteGroup(groupId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    groups,
    loading,
    error,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
  };
}
