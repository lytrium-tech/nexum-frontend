import ChatInterface from './ChatInterface';

export const metadata = {
  title: 'Nexum - Asistente',
};

export default function ChatPage() {
  return (
    <div className="flex-1 flex flex-col h-full absolute inset-0">
      <ChatInterface />
    </div>
  );
}
