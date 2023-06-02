import { Button, ButtonProps } from "@mantine/core";
import React from "react";
import { useNavigate } from "react-router-dom";
import ky from "ky";
import { Conversation } from "../model";

export default function StartConversation(props: ButtonProps) {
  const navigate = useNavigate();
  const startConversation = async () => {
    const conversation = await ky
      .post("/api/conversation", { json: { title: "New conversation" } })
      .json<Conversation>();
    navigate(`/conversation/${conversation.id}`);
  };
  return (
    <Button {...props} onClick={startConversation}>
      Start conversation
    </Button>
  );
}
