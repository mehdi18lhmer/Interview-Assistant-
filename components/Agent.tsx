"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Vapi from "@vapi-ai/web";

import { cn } from "@/lib/utils";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  profileImage,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<SavedMessage[]>([]);

  // Avatar Upload State
  const [avatarUrl, setAvatarUrl] = useState(profileImage || "/user-avatar.png");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vapi Instance
  const vapiRef = useRef<Vapi | null>(null);

  // Initialize Vapi
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    console.log("Initializing Vapi with public key:", publicKey ? "EXISTS" : "MISSING");
    
    if (publicKey) {
      vapiRef.current = new Vapi(publicKey);

      // Event listeners
      vapiRef.current.on("call-start", () => {
        console.log("Call started");
        setCallStatus(CallStatus.ACTIVE);
      });

      vapiRef.current.on("call-end", () => {
        console.log("Call ended");
        setCallStatus(CallStatus.FINISHED);
        setIsSpeaking(false);
        setIsListening(false);
      });

      vapiRef.current.on("speech-start", () => {
        console.log("AI is speaking");
        setIsSpeaking(true);
      });

      vapiRef.current.on("speech-end", () => {
        console.log("AI stopped speaking");
        setIsSpeaking(false);
      });

      // Capture messages for transcript
      vapiRef.current.on("message", (message: any) => {
        console.log("Message received:", message);
        
        if (message.type === "transcript" && message.transcriptType === "final") {
          const newMessage: SavedMessage = {
            role: message.role === "user" ? "user" : "assistant",
            content: message.transcript,
          };
          setTranscript((prev) => [...prev, newMessage]);
        }
      });

      vapiRef.current.on("volume-level", (level: number) => {
        // User is speaking when volume level > threshold
        if (level > 0.01) {
          setIsListening(true);
        } else {
          setIsListening(false);
        }
      });

      vapiRef.current.on("error", (error: any) => {
        console.error("Vapi error:", error);
      });
    }

    return () => {
      vapiRef.current?.stop();
    };
  }, []);

  // Handle Avatar Click - Redirect to profile
  const handleAvatarClick = () => {
    router.push("/profile");
  };

  const startInterview = () => {
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    
    if (!assistantId) {
      console.error("Vapi Assistant ID not configured");
      alert("Error: Vapi Assistant ID is missing. Please add NEXT_PUBLIC_VAPI_ASSISTANT_ID to your Vercel Environment Variables.");
      return;
    }

    if (!vapiRef.current) {
      console.error("Vapi not initialized (missing Public Key)");
      alert("Error: Vapi Public Key is missing. Please add NEXT_PUBLIC_VAPI_PUBLIC_KEY to your Vercel Environment Variables.");
      return;
    }

    // Start Vapi call with assistant ID and custom first message
    vapiRef.current?.start(
      assistantId,
      {
        // Override the first message
        firstMessage: "Hello I am assistant developed by elmahdi elahmer so how can i help you today",
      }
    );
  };

  const endInterview = async () => {
    vapiRef.current?.stop();
    setCallStatus(CallStatus.FINISHED);

    if (type === "generate") {
      router.push("/");
    } else {
      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: transcript,
        feedbackId,
      });

      if (success && id) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        router.push("/");
      }
    }
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
          {isSpeaking && <p className="text-sm text-primary-200 animate-pulse">Speaking...</p>}
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content relative group">
            {/* Clickable Avatar */}
            <div 
                className="relative cursor-pointer transition-transform hover:scale-105"
                onClick={handleAvatarClick}
            >
                <Image
                  src={avatarUrl}
                  alt="profile-image"
                  width={120}
                  height={120}
                  className="rounded-full object-cover size-[120px] border-4 border-transparent group-hover:border-primary-200"
                />
                
                {/* Upload Overlay Hint */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-white font-bold">Edit Profile</span>
                </div>
            </div>
            
            <h3 className="mt-4 text-xl font-bold text-center">{userName || "Candidate"}</h3>
            {isListening && <p className="text-sm text-success-100 animate-pulse">Listening...</p>}
          </div>
        </div>
      </div>

      {/* Transcript View */}
      <div className="transcript-border mt-5 h-48 overflow-y-auto">
        <div className="transcript flex flex-col gap-2 !items-start">
             {transcript.length === 0 && <p className="text-white/50 italic">Conversation will appear here...</p>}
             {transcript.slice(-2).map((m, i) => (
                 <p key={i} className={cn("text-left", m.role === 'user' ? "text-primary-200" : "text-white")}>
                     <strong>{m.role === 'user' ? 'You' : 'Sarah'}:</strong> {m.content}
                 </p>
             ))}
        </div>
      </div>

      <div className="w-full flex justify-center mt-8 gap-4">
        {callStatus === CallStatus.INACTIVE ? (
          <button className="btn-call" onClick={startInterview}>
            Start Interview
          </button>
        ) : callStatus === CallStatus.ACTIVE ? (
           <>
            <button className="btn-disconnect" onClick={endInterview}>
                End Interview
            </button>
           </>
        ) : (
            <p className="text-white">Interview Finished</p>
        )}
      </div>
    </>
  );
};

export default Agent;
