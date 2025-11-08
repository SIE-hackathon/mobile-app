/**
 * Group Service
 * Handles all group-related operations with Supabase
 */

import { supabase } from './supabase';
import { Group, GroupInsert, GroupUpdate, GroupMember, GroupMemberInsert, GroupMemberRole } from '../types/database.types';

export class GroupService {
  /**
   * Fetch all groups for the current user
   */
  static async fetchUserGroups(): Promise<Group[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_members!inner(user_id)
      `)
      .eq('group_members.user_id', user.id);

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch a single group by ID
   */
  static async fetchGroup(groupId: string): Promise<Group | null> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new group
   */
  static async createGroup(group: GroupInsert): Promise<Group> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');

    // Create group
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .insert({
        ...group,
        created_by: user.id,
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Add creator as owner
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: groupData.id,
        user_id: user.id,
        role: 'owner' as GroupMemberRole,
      });

    if (memberError) throw memberError;

    return groupData;
  }

  /**
   * Update a group
   */
  static async updateGroup(groupId: string, updates: GroupUpdate): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a group
   */
  static async deleteGroup(groupId: string): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;
  }

  /**
   * Fetch group members
   */
  static async fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Add member to group
   */
  static async addGroupMember(member: GroupMemberInsert): Promise<GroupMember> {
    const { data, error } = await supabase
      .from('group_members')
      .insert(member)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update member role
   */
  static async updateMemberRole(memberId: string, role: GroupMemberRole): Promise<GroupMember> {
    const { data, error } = await supabase
      .from('group_members')
      .update({ role })
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove member from group
   */
  static async removeGroupMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  }
}
