'use client';

import { useState } from 'react';
import { Search, Send, MoreVertical, Image as ImageIcon, Paperclip } from 'lucide-react';

const mockChats = [
  {
    id: 1,
    brand: {
      name: 'Nike',
      logo: '/images/placeholder-40.svg',
      lastMessage: "Hi Sarah! We'd love to work with you on our new collection.",
      timestamp: '10:30 AM',
      unread: 2
    }
  },
  {
    id: 2,
    brand: {
      name: 'Adidas',
      logo: '/images/placeholder-40.svg',
      lastMessage: 'The campaign results look great! Let\'s discuss the next steps.',
      timestamp: 'Yesterday',
      unread: 0
    }
  },
  {
    id: 3,
    brand: {
      name: 'Puma',
      logo: '/images/placeholder-40.svg',
      lastMessage: 'Contract has been sent to your email.',
      timestamp: 'Jan 28',
      unread: 0
    }
  }
];

const mockMessages = [
  {
    id: 1,
    sender: 'Nike',
    content: "Hi Sarah! We'd love to work with you on our new collection. Your aesthetic perfectly matches our brand vision.",
    timestamp: '10:30 AM',
    isBrand: true
  },
  {
    id: 2,
    sender: 'Me',
    content: "Hi Nike! Thank you for reaching out. I'd love to hear more about the collection and collaboration opportunity.",
    timestamp: '10:35 AM',
    isBrand: false
  },
  {
    id: 3,
    sender: 'Nike',
    content: 'Great! We\'re launching a sustainable fashion line this spring, and we\'d like you to be one of our key influencers.',
    timestamp: '10:38 AM',
    isBrand: true
  },
  {
    id: 4,
    sender: 'Nike',
    content: 'The campaign would involve 3 Instagram posts and 2 Reels over a 2-month period.',
    timestamp: '10:38 AM',
    isBrand: true
  }
];

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState(mockChats[0]);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChats = mockChats.filter(chat =>
    chat.brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // Handle sending message
      setMessageInput('');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg h-[calc(100vh-12rem)]">
      <div className="flex h-full">
        {/* Chat List */}
        <div className="w-1/3 border-r border-gray-200">
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="overflow-y-auto h-[calc(100%-73px)]">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedChat.id === chat.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={chat.brand.logo}
                    alt={chat.brand.name}
                    className="h-10 w-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {chat.brand.name}
                      </h3>
                      <span className="text-xs text-gray-500">{chat.brand.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{chat.brand.lastMessage}</p>
                  </div>
                  {chat.brand.unread > 0 && (
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                      {chat.brand.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedChat.brand.logo}
                  alt={selectedChat.brand.name}
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {selectedChat.brand.name}
                  </h2>
                  <p className="text-sm text-gray-500">Active now</p>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <MoreVertical className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mockMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBrand ? '' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[70%] ${
                    message.isBrand
                      ? 'bg-gray-500 rounded-tr-lg'
                      : 'bg-blue-500 text-white rounded-tl-lg'
                  } p-3 rounded-b-lg`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.isBrand ? 'text-gray-500' : 'text-blue-100'}`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 text-gray-800">
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <ImageIcon className="h-5 w-5 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Paperclip className="h-5 w-5 text-gray-500" />
              </button>
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={handleSendMessage}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
