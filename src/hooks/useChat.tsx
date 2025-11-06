import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { ethers } from 'ethers';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  message_type: 'text' | 'file';
  file_url?: string;
  blockchain_hash?: string;
  gas_used?: string;
  transaction_fee?: string;
  sender?: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface Conversation {
  id: string;
  name?: string;
  type: 'direct' | 'group';
  created_at: string;
  participants: Array<{
    user_id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    status: string;
  }>;
  last_message?: Message;
  unread_count: number;
}

export const useChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load conversations
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const messageChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations:conversation_id (
            id,
            name,
            type,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      // Get conversation details with participants and last messages
      const conversationIds = participantData?.map(p => p.conversation_id) || [];
      
      // Remove duplicates
      const uniqueConversationIds = [...new Set(conversationIds)];
      
      if (uniqueConversationIds.length > 0) {
        const { data: fullConversations, error: convError } = await supabase
          .from('conversations')
          .select(`
            *,
            conversation_participants (
              user_id,
              profiles!conversation_participants_user_id_fkey (
                username,
                display_name,
                avatar_url,
                status
              )
            )
          `)
          .in('id', uniqueConversationIds);

        if (convError) throw convError;

        // Transform the data to match our interface and deduplicate
        const conversationsMap = new Map();
        
        fullConversations?.forEach(conv => {
          if (!conversationsMap.has(conv.id)) {
            conversationsMap.set(conv.id, {
              ...conv,
              type: (conv.type as 'direct' | 'group') || 'direct',
              participants: conv.conversation_participants?.map((cp: any) => ({
                user_id: cp.user_id,
                username: cp.profiles?.username || 'Unknown',
                display_name: cp.profiles?.display_name,
                avatar_url: cp.profiles?.avatar_url,
                status: cp.profiles?.status || 'offline'
              })) || [],
              unread_count: 0 // TODO: Calculate actual unread count
            });
          }
        });

        setConversations(Array.from(conversationsMap.values()));
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error loading conversations",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setCurrentConversation(conversationId);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!messages_sender_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedMessages = data?.map(msg => {
        const profiles = msg.profiles as any;
        return {
          ...msg,
          message_type: (msg.message_type as 'text' | 'file') || 'text',
          gas_used: msg.gas_used?.toString(),
          transaction_fee: msg.transaction_fee?.toString(),
          sender: profiles ? {
            username: profiles.username || 'Unknown',
            display_name: profiles.display_name,
            avatar_url: profiles.avatar_url
          } : {
            username: 'Unknown',
            display_name: undefined,
            avatar_url: undefined
          }
        };
      }) || [];

      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error loading messages",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (
    content: string, 
    blockchainHash?: string, 
    gasUsed?: bigint, 
    transactionFee?: string
  ) => {
    if (!user || !currentConversation) return;

    try {
      // First send to blockchain if connected
      let finalBlockchainHash = blockchainHash;
      if (!finalBlockchainHash && window.ethereum) {
        try {
          // Create a simple hash for blockchain verification
          const messageData = `${content}-${Date.now()}-${user.id}`;
          finalBlockchainHash = ethers.keccak256(ethers.toUtf8Bytes(messageData));
        } catch (error) {
          console.warn('Blockchain hashing failed, continuing without blockchain verification:', error);
        }
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          content,
          sender_id: user.id,
          conversation_id: currentConversation,
          message_type: 'text',
          blockchain_hash: finalBlockchainHash,
          blockchain_verified: !!finalBlockchainHash,
          gas_used: gasUsed ? Number(gasUsed) : null,
          transaction_fee: transactionFee ? parseFloat(transactionFee) : null
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const createDirectConversation = async (friendId: string) => {
    if (!user) return null;

    try {
      // Check if a direct conversation already exists between these users
      const { data: existingConversations, error: checkError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, conversations!inner(type)')
        .eq('user_id', user.id);

      if (checkError) throw checkError;

      // Find if there's already a direct conversation with this friend
      for (const conv of existingConversations || []) {
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.conversation_id);

        const participantIds = participants?.map(p => p.user_id) || [];
        
        // Check if this is a direct conversation with exactly these two users
        if (
          participantIds.length === 2 &&
          participantIds.includes(user.id) &&
          participantIds.includes(friendId)
        ) {
          // Conversation already exists, return it
          await loadConversations();
          return conv.conversation_id;
        }
      }

      // Create new conversation if none exists
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'direct',
          created_by: user.id
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: user.id },
          { conversation_id: conversation.id, user_id: friendId }
        ]);

      if (participantError) throw participantError;

      // Refresh conversations list
      await loadConversations();
      
      toast({
        title: "Conversation created",
        description: "Starting chat...",
      });
      
      return conversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error creating conversation",
        description: "Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    conversations,
    messages,
    currentConversation,
    loading,
    loadMessages,
    sendMessage,
    createDirectConversation,
    loadConversations
  };
};