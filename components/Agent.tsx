"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "ai/react";

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
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Avatar Upload State
  const [avatarUrl, setAvatarUrl] = useState("/user-avatar.png");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use Vercel AI SDK for chat state management
  const { messages, append, setMessages } = useChat({
    api: "/api/chat",
    onFinish: (message) => {
      // When AI finishes generating text, speak it
      speak(message.content);
    },
  });

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Stop after one sentence/pause
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            // Send user speech to Gemini
            append({ role: "user", content: transcript });
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, [append]);

  // Handle Avatar Upload
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  // Continuous Conversation Logic
  useEffect(() => {
    if (callStatus === CallStatus.ACTIVE && !isSpeaking && !isListening) {
      const timeoutId = setTimeout(() => {
          if (recognitionRef.current) {
            try {
               recognitionRef.current.start();
            } catch (e) {
               // Ignore errors if already started
            }
          }
      }, 500); // Short delay to prevent self-hearing if using speakers
      return () => clearTimeout(timeoutId);
    }
  }, [isSpeaking, callStatus, isListening]);

  // Text to Speech Function
  const speak = (text: string) => {
    if (typeof window !== "undefined") {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Attempt to select a "Luxe" female voice (often Google UK Female or similar)
      const voices = synth.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes("Google UK English Female") || 
        v.name.includes("Martha") || 
        v.name.includes("Female")
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      synth.speak(utterance);
    }
  };

  const startInterview = () => {
    setCallStatus(CallStatus.ACTIVE);
    
    // Initial greeting based on context
    const initialMessage = `Hello ${userName}. I'm Sarah, your interviewer today. We'll be focusing on ${type} questions. Are you ready to begin?`;
    
    // Add to chat history without triggering a new API call yet
    setMessages([
        { id: '1', role: 'assistant', content: initialMessage }
    ]);
    
    speak(initialMessage);
  };

  const handleMicClick = () => {
    if (recognitionRef.current && !isListening && !isSpeaking) {
      recognitionRef.current.start();
    } else if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }
  };

  const endInterview = async () => {
    setCallStatus(CallStatus.FINISHED);
    window.speechSynthesis.cancel();

    // Map AI SDK messages to our storage format
    const formattedMessages: SavedMessage[] = messages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
    }));

    if (type === "generate") {
      router.push("/");
    } else {
      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: formattedMessages,
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
            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
            />
            
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
                    <span className="text-xs text-white font-bold">Change</span>
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
             {messages.length === 0 && <p className="text-white/50 italic">Conversation will appear here...</p>}
             {messages.slice(-2).map((m, i) => (
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
            <button 
                className={cn("btn-call !min-w-16", isListening ? "bg-red-500 hover:bg-red-600" : "bg-primary-200 hover:bg-primary-200/80")} 
                onClick={handleMicClick}
            >
                {isListening ? "Listening..." : isSpeaking ? "Stop Speaking" : "Tap to Speak"}
            </button>
            
            <button className="btn-disconnect" onClick={endInterview}>
                End
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
