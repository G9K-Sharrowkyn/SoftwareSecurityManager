import { useState } from "react";

interface Props {
  gameId: number;
  onSendMessage: (msg: string) => void;
}

export default function ChatWindow({ onSendMessage }: Props) {
  const [message, setMessage] = useState("");

  return (
    <div className="fixed bottom-4 right-4 w-64 bg-cosmic-800/80 border border-cosmic-600 rounded p-2 text-sm">
      <div className="flex">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 bg-transparent border border-cosmic-600 rounded px-1 mr-1"
        />
        <button
          className="px-2 bg-cosmic-gold text-cosmic-900 rounded"
          onClick={() => {
            if (message.trim()) {
              onSendMessage(message);
              setMessage("");
            }
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
