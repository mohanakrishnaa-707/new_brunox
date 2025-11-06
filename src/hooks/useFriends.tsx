import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  friend_profile?: {
    username: string;
    display_name?: string;
    avatar_url?: string;
    status: string;
  };
}

interface SearchResult {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  status: string;
}

export const useFriends = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadFriends();
      loadFriendRequests();
    }
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*, friend_profile:profiles!friends_friend_id_fkey(username, display_name, avatar_url, status)')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedFriends = data?.map(friend => ({
        ...friend,
        status: (friend.status as 'pending' | 'accepted' | 'declined') || 'pending'
      })) || [];
      
      setFriends(transformedFriends);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadFriendRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedRequests = data?.map(request => ({
        ...request,
        status: (request.status as 'pending' | 'accepted' | 'declined') || 'pending'
      })) || [];
      
      setFriendRequests(transformedRequests);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const searchUsers = async (searchTerm: string): Promise<SearchResult[]> => {
    if (!searchTerm.trim() || !user) return [];

    try {
      const { data, error } = await supabase.rpc('search_users', {
        search_term: searchTerm,
        current_user_id: user.id
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  const sendFriendRequest = async (friendUserId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to send friend requests.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // First ensure both users have profiles
      await supabase.rpc('ensure_profile_exists', { current_user_id: user.id });
      await supabase.rpc('ensure_profile_exists', { current_user_id: friendUserId });

      // Check if request already exists
      const { data: existing } = await supabase
        .from('friends')
        .select('id')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendUserId}),and(user_id.eq.${friendUserId},friend_id.eq.${user.id})`);

      if (existing && existing.length > 0) {
        toast({
          title: "Friend request already exists",
          description: "You've already sent a request to this user.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: friendUserId,
          status: 'pending'
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      toast({
        title: "Friend request sent!",
        description: "Your friend request has been sent successfully.",
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error sending friend request",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const respondToFriendRequest = async (requestId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', requestId);

      if (error) throw error;

      if (accept) {
        // Create reciprocal friendship
        const request = friendRequests.find(r => r.id === requestId);
        if (request) {
          await supabase
            .from('friends')
            .insert({
              user_id: request.friend_id,
              friend_id: request.user_id,
              status: 'accepted'
            });
        }
      }

      toast({
        title: accept ? "Friend request accepted!" : "Friend request declined",
        description: accept ? "You are now friends!" : "The request has been declined.",
      });

      loadFriends();
      loadFriendRequests();
    } catch (error) {
      console.error('Error responding to friend request:', error);
      toast({
        title: "Error processing request",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return {
    friends,
    friendRequests,
    loading,
    searchUsers,
    sendFriendRequest,
    respondToFriendRequest,
    loadFriends,
    loadFriendRequests
  };
};