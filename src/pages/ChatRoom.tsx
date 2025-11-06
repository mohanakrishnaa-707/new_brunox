import { useParams, useNavigate } from 'react-router-dom';
import { BlockchainChatRoom } from '@/components/BlockchainChatRoom';

const ChatRoom = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  if (!conversationId) {
    navigate('/chat');
    return null;
  }

  return (
    <div className="h-screen bg-background">
      <BlockchainChatRoom 
        conversationId={conversationId}
        onBack={() => navigate('/chat')}
      />
    </div>
  );
};

export default ChatRoom;