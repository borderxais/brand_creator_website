'use client';

import { useState } from 'react';
import { Search, Send, MessageCircle, PlusCircle } from 'lucide-react';

// Mock data - replace with actual API calls
const mockMessages = [
  {
    id: 1,
    creator: {
      name: "Sarah Chen",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
      platform: "Instagram",
      followers: "50K"
    },
    lastMessage: "Hi! I'm interested in your summer campaign...",
    timestamp: "2024-01-30T10:30:00",
    unread: true,
    campaign: "Summer Fashion Collection"
  },
  {
    id: 2,
    creator: {
      name: "Mike Johnson",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
      platform: "TikTok",
      followers: "100K"
    },
    lastMessage: "Thank you for considering my proposal",
    timestamp: "2024-01-29T15:45:00",
    unread: false,
    campaign: "Healthy Living Challenge"
  },
  {
    id: 3,
    creator: {
      name: "Emma Liu",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
      platform: "YouTube",
      followers: "75K"
    },
    lastMessage: "Here's my content proposal for the campaign",
    timestamp: "2024-01-28T09:15:00",
    unread: false,
    campaign: "Tech Review Series"
  }
];

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const filteredMessages = mockMessages.filter(message =>
    message.creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.campaign.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // TODO: Implement message sending
    console.log('Sending message:', newMessage);
    setNewMessage('');
  };

  return (
    <div className="p-6 h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Messages
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Connect and collaborate with creators
          </p>
        </div>
        <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center">
          <PlusCircle className="w-5 h-5 mr-2" />
          New Message
        </button>
      </div>

      {/* Messages Section */}
      <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-2xl backdrop-blur-xl bg-white/50 border border-white/20 shadow-lg">
        {/* Conversations List */}
        <div className="w-80 border-r border-white/20 flex flex-col">
          <div className="p-4 border-b border-white/20">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full rounded-xl border border-white/20 bg-white/50 backdrop-blur-xl py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  selectedChat === message.id
                    ? 'bg-white/80'
                    : 'hover:bg-white/60'
                }`}
                onClick={() => setSelectedChat(message.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={message.creator.image}
                      alt={message.creator.name}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                    {message.unread && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {message.creator.name}
                      </p>
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-purple-600 font-medium mt-0.5">
                      {message.campaign}
                    </p>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {message.lastMessage}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/20 backdrop-blur-xl bg-white/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={mockMessages.find(m => m.id === selectedChat)?.creator.image}
                      alt={mockMessages.find(m => m.id === selectedChat)?.creator.name}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {mockMessages.find(m => m.id === selectedChat)?.creator.name}
                      </h2>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {mockMessages.find(m => m.id === selectedChat)?.creator.platform}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-600">
                          {mockMessages.find(m => m.id === selectedChat)?.creator.followers} followers
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MessageCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <p className="text-gray-500 text-center text-sm">Start of conversation</p>
                {/* Add actual chat messages here */}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-white/20 backdrop-blur-xl bg-white/50">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      className="block w-full rounded-xl border border-white/20 bg-white/50 backdrop-blur-xl py-2 px-4 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
              <p className="text-sm text-gray-500">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
