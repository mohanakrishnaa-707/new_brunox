import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, ArrowLeft, Shield, Zap, Clock, Wallet } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useGanache } from '@/hooks/useGanache';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface BlockchainChatRoomProps {
  conversationId: string;
  onBack: () => void;
}

export const BlockchainChatRoom = ({ conversationId, onBack }: BlockchainChatRoomProps) => {
  const { user } = useAuth();
  const { messages, sendMessage, loadMessages } = useChat();
  const { isConnected, sendMessage: sendBlockchainMessage, balance, refreshBalance } = useGanache();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const hasEnoughBalance = parseFloat(balance) > 0;

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    // Check balance before sending if blockchain is connected
    if (isConnected && !hasEnoughBalance) {
      return;
    }

    setIsSending(true);
    try {
      let blockchainHash: string | undefined;
      let gasUsed: bigint | undefined;
      let transactionFee: string | undefined;
      
      // Try to send to blockchain first if connected
      if (isConnected && hasEnoughBalance) {
        try {
          const recipientAddress = '0x0000000000000000000000000000000000000000'; // Mock recipient
          const result = await sendBlockchainMessage(recipientAddress, newMessage);
          blockchainHash = result.hash;
          gasUsed = result.gasUsed;
          transactionFee = result.gasFee;
          console.log('Message sent to blockchain:', { blockchainHash, gasUsed, transactionFee });
          
          // Refresh balance after transaction
          await refreshBalance();
        } catch (error) {
          console.warn('Blockchain send failed, continuing with regular message:', error);
        }
      }

      // Send to Supabase database with gas information
      await sendMessage(newMessage, blockchainHash, gasUsed, transactionFee);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const getMessageStatus = (message: any) => {
    if (message.blockchain_verified && message.blockchain_hash) {
      return (
        <div title="Blockchain Verified">
          <Shield className="w-3 h-3 text-green-500" />
        </div>
      );
    } else if (message.blockchain_hash) {
      return (
        <div title="Blockchain Pending">
          <Zap className="w-3 h-3 text-yellow-500" />
        </div>
      );
    }
    return (
      <div title="Database Only">
        <Clock className="w-3 h-3 text-gray-400" />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0">
        <Card className="p-2 md:p-4 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="hover:bg-muted"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h2 className="text-base md:text-lg font-semibold">Blockchain Chat</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isConnected ? (
                    <>
                      <Badge variant="default" className="text-xs gradient-ocean text-white">
                        <Shield className="w-3 h-3 mr-1" />
                        Blockchain Enabled
                      </Badge>
                      <Badge 
                        variant={hasEnoughBalance ? "default" : "destructive"} 
                        className="text-xs"
                      >
                        <Wallet className="w-3 h-3 mr-1" />
                        {parseFloat(balance).toFixed(4)} ETH
                      </Badge>
                    </>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Database Only
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] md:max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                  {!isOwnMessage && (
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={message.sender?.avatar_url} />
                        <AvatarFallback className="gradient-ocean text-white text-xs">
                          {message.sender?.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">
                        {message.sender?.display_name || message.sender?.username}
                      </span>
                    </div>
                  )}
                  
                  <Card className={`p-3 ${
                    isOwnMessage 
                      ? 'bg-primary text-primary-foreground gradient-ocean text-white' 
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm break-words">{message.content}</p>
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20">
                      <div className="flex items-center gap-2">
                        {getMessageStatus(message)}
                        <span className="text-xs opacity-70">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {message.transaction_fee && (
                          <Badge 
                            variant="outline" 
                            className="text-xs border-white/30 text-current"
                            title={`Gas Used: ${message.gas_used || 'N/A'}`}
                          >
                            ⛽ {parseFloat(message.transaction_fee).toFixed(6)} ETH
                          </Badge>
                        )}
                        {message.blockchain_hash && (
                          <Badge 
                            variant="outline" 
                            className="text-xs border-white/30 text-current"
                            title={`Blockchain Hash: ${message.blockchain_hash}`}
                          >
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Fixed */}
      <div className="flex-shrink-0">
        <Card className="p-2 md:p-4 border-t border-border">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              type="text"
              placeholder={isConnected ? "Send a blockchain-verified message..." : "Send a message..."}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 transition-smooth focus:shadow-glow"
              disabled={isSending || (isConnected && !hasEnoughBalance)}
            />
            <Button 
              type="submit"
              disabled={!newMessage.trim() || isSending || (isConnected && !hasEnoughBalance)}
              className="gradient-ocean text-white"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          
          {isConnected && hasEnoughBalance && (
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Shield className="w-3 h-3 text-green-500" />
              Messages are being stored on the blockchain for maximum security
            </div>
          )}
          
          {isConnected && !hasEnoughBalance && (
            <div className="flex items-center gap-2 mt-2 text-xs text-destructive">
              <Wallet className="w-3 h-3" />
              Insufficient ETH balance. Please add funds to your wallet to send messages.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};