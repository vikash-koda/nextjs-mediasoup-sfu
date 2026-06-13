import { useState, useRef } from "react";
import { Send, Paperclip, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  onFileUpload: (file: File) => Promise<void>;
}

export function ChatInput({ onSend, onFileUpload }: ChatInputProps) {
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text);
      setText("");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert("File size exceeds 20MB limit");
      return;
    }

    try {
      setIsUploading(true);
      await onFileUpload(file);
    } catch (error) {
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="p-2 text-gray-400 hover:text-white transition disabled:opacity-50"
        title="Attach File"
      >
        {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
      </button>

      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground"
      />
      <button 
        type="submit"
        disabled={!text.trim() || isUploading}
        className="p-2 bg-primary hover:bg-blue-600 rounded-lg text-white disabled:opacity-50 transition"
      >
        <Send size={18} />
      </button>
    </form>
  );
}
