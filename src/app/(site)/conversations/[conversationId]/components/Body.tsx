"use client";
import useConversation from "@/app/hooks/useConversation";
import { FullMessageType } from "@/app/types";
import { FunctionComponent, useEffect, useRef, useState } from "react";
import MessageBox from "./MessageBox";
import axios from "axios";
import { pusherClient } from "@/app/lib/pusher";
import { find } from "lodash";

interface BodyProps {
  initialMessages: FullMessageType[];
}

const Body: FunctionComponent<BodyProps> = ({ initialMessages }) => {
  const [messages, setMessages] = useState(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { conversationId } = useConversation();
  useEffect(() => {
    async function makeSeen() {
      try {
        await axios.post(`/api/conversations/${conversationId}/seen`);
      } catch (error) {}
    }
    makeSeen();
  }, [conversationId, messages]);

  useEffect(() => {
    pusherClient.subscribe(conversationId);
    bottomRef?.current?.scrollIntoView();

    const updateMessageHandler = (newMessage: FullMessageType) => {
      setMessages((current) =>
        current.map((message) => {
          if (message.id === newMessage.id) {
            return newMessage;
          }
          return message;
        })
      );
    };
    const messageHandler = (message: FullMessageType) => {
      setMessages((current) => {
        if (find(current, { id: message.id })) {
          return current;
        }
        return [...current, message];
      });
      bottomRef?.current?.scrollIntoView();
    };
    pusherClient.bind("messages:new", messageHandler);
    pusherClient.bind("message:update", updateMessageHandler);

    return () => {
      pusherClient.unsubscribe(conversationId);
      pusherClient.unbind("messages:new", messageHandler);
      pusherClient.unbind("message:update", updateMessageHandler);
    };
  }, [conversationId]);

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.map((message, index) => {
        return (
          <MessageBox
            isLast={index == messages.length - 1}
            key={message.id}
            data={message}
          />
        );
      })}
      <div className="pt-20" ref={bottomRef}></div>
    </div>
  );
};

export default Body;
