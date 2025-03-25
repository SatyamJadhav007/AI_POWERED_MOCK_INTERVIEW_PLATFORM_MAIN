"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
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
  // Call State??
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  // Gather the messages to use later for the feedback
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  // are you speaking or not?
  const [isSpeaking, setIsSpeaking] = useState(false);
  // What was the last Messges ?(To add to the messages array)
  const [lastMessage, setLastMessage] = useState<string>("");

  useEffect(() => {
    // ACTIVE
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };
    // FINISHED
    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };
    // Push the transcript message to the messages array
    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    // BOOLLL!!!
    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    // NAKO BOOLLLUUU!!!
    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    // Something went wrong
    const onError = (error: Error) => {
      console.log("Error:", error);
    };

    vapi.on("call-start", onCallStart); //callStart ==> page ...
    vapi.on("call-end", onCallEnd); //callEnd ==> end
    vapi.on("message", onMessage); //onMessage ==>transcript data
    vapi.on("speech-start", onSpeechStart); //onSpeechStart ==> setSpeakingtrue
    vapi.on("speech-end", onSpeechEnd); //onSpeechEnd ==> setSpeakingfalse
    vapi.on("error", onError); //The fetch any problems

    return () => {
      // cleaning up the event listners
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    // If the messages array has content then update the last message ==> which is displayed on the page !!
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("handleGenerateFeedback");

      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
      });
      // if success and the feedbackId exists then push the user to the feedback page
      if (success && id) {
        router.push(`/interview/${interviewId}/feedback`);
        // Else push the user to the home page with error message
      } else {
        console.log("Error saving feedback");
        router.push("/");
      }
    };
    // if the callStatus is Finished and the type is generate the push the user to the home page
    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/");
      } else {
        // Recursive call
        handleGenerateFeedback(messages);
      }
    } // these are the dependencies that are responsible for the calling of this useEffect
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  const handleCall = async () => {
    // Start the call ....
    setCallStatus(CallStatus.CONNECTING);

    // use the assitant if the type is generate
    if (type === "generate") {
      await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
        variableValues: {
          username: userName,
          userid: userId,
        },
      });
    } else {
      let formattedQuestions = "";
      if (questions) {
        formattedQuestions = questions
          .map((question) => `- ${question}`)
          .join("\n");
      }

      await vapi.start(interviewer, {
        variableValues: {
          questions: formattedQuestions,
        },
      });
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
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
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>
      {/* If there is data in the messages array then show it on the page  */}
      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button className="relative btn-call" onClick={() => handleCall()}>
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
