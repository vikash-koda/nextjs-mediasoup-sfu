import { format } from "date-fns";
import { Download, FileText, Image as ImageIcon } from "lucide-react";

export interface IMessage {
  _id: string;
  sessionId: string;
  senderRole: "agent" | "customer" | "system";
  senderName: string;
  message?: string;
  timestamp: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileUrl?: string;
}

export function ChatMessage({ message, isMe }: { message: IMessage, isMe: boolean }) {
  const isSystem = message.senderRole === "system";
  const isFile = !!message.fileUrl;
  const isImage = message.fileType?.startsWith("image/");
  const isPdf = message.fileType === "application/pdf";

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="bg-secondary/50 text-gray-400 text-xs px-3 py-1 rounded-full text-center">
          {message.message}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
      <span className="text-xs text-gray-500 mb-1 px-1">
        {isMe ? "You" : message.senderName} ({message.senderRole}) • {format(new Date(message.timestamp), "h:mm a")}
      </span>
      
      {isFile ? (
        <div className={`p-1 rounded-lg max-w-[85%] border shadow-md ${
          isMe ? "bg-primary/10 border-primary/20 rounded-br-none" : "bg-secondary border-border rounded-bl-none"
        }`}>
          {isImage ? (
            <a href={message.fileUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md cursor-zoom-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={message.fileUrl} alt={message.fileName} className="max-h-48 object-cover hover:opacity-90 transition" />
            </a>
          ) : (
            <div className="flex items-center gap-3 p-3">
              <div className="p-2 bg-background rounded-md text-accent">
                {isPdf ? <FileText size={24} /> : <Download size={24} />}
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-medium text-foreground truncate" title={message.fileName}>{message.fileName}</p>
                <p className="text-xs text-gray-400">{(message.fileSize! / 1024).toFixed(1)} KB</p>
              </div>
              <a href={message.fileUrl} target="_blank" rel="noreferrer" className="p-2 rounded-full hover:bg-background text-gray-400 hover:text-white transition" title="Download">
                <Download size={18} />
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className={`px-4 py-2 rounded-lg max-w-[85%] text-sm ${
          isMe ? "bg-primary text-white rounded-br-none" : "bg-secondary text-gray-200 rounded-bl-none"
        }`}>
          {message.message}
        </div>
      )}
    </div>
  );
}
