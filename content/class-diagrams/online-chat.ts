import type { ClassDiagram } from './types.ts'

const d: ClassDiagram = {
  oodId: 'online-chat',
  associations: [
    { from: 'UserService', attr: 'users_by_id', to: 'User', many: true },
    { from: 'User', attr: 'friend_ids_to_private_chats', to: 'PrivateChat', many: true },
    { from: 'User', attr: 'group_chats_by_id', to: 'GroupChat', many: true },
    { from: 'User', attr: 'received_friend_requests_by_friend_id', to: 'AddRequest', many: true },
    { from: 'Chat', attr: 'messages', to: 'Message', many: true },
    { from: 'AddRequest', attr: 'request_status', to: 'RequestStatus' },
  ],
  notes: [
    'PrivateChat calls super(PrivateChat, self).__init__() without the chat_id that Chat.__init__ takes. The .py module has the same code.',
    'User.friends_by_id (User → User) and Chat.users (Chat → User) are not drawn, to keep the diagram readable.',
  ],
}
export default d
