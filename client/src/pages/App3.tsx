import {
  Navbar,
  NavLink,
  ThemeIcon,
  Text,
  TextInput,
  ActionIcon,
  Button,
} from "@mantine/core";
import React, { MouseEventHandler, useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import AuthGuard from "../auth-guard";
import ky from "ky";
import { Conversation } from "../model";
import StartConversation from "../components/start-conversation";
import {
  Check,
  Edit,
  GitBranchDeleted,
  HomeCancel,
  Trash,
  X,
} from "tabler-icons-react";
import { useInputState } from "@mantine/hooks";
import { ButtonGroup } from "@mantine/core/lib/Button/ButtonGroup/ButtonGroup";

function ConversationItem(props: {
  conversation: Conversation;
  reloadConversations: () => void;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [edit, setEdit] = useState(false);
  const { conversation } = props;
  const [input, setInput] = useInputState(conversation.title);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (edit) {
      ref.current?.select();
    }
  }, [edit]);
  const startEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    setInput(conversation.title);
    setEdit(true);
  };

  const removeConversation = async (e: React.MouseEvent) => {
    e.preventDefault();
    await ky.delete(`/api/conversation/${conversation.id}`);
    props.reloadConversations();
  };

  const updateTitle = async (e: React.MouseEvent) => {
    e.preventDefault();
    await ky.put(`/api/conversation`, {
      json: { ...conversation, title: input },
    });
    props.reloadConversations();
    setEdit(false);
  };

  if (edit) {
    return (
      <NavLink
        h={44}
        label={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <TextInput
              variant={"unstyled"}
              ref={ref}
              value={input}
              onChange={setInput}
              style={{ margin: 0 }}
            ></TextInput>
            <div>
              <Button.Group>
                <ActionIcon onClick={updateTitle}>
                  <Check color={"green"} />
                </ActionIcon>
                <ActionIcon onClick={() => setEdit(false)}>
                  <X color={"red"}></X>
                </ActionIcon>
              </Button.Group>
            </div>
          </div>
        }
      ></NavLink>
    );
  }

  return (
    <NavLink
      h={44}
      label={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text>{conversation.title}</Text>
          <div>
            <Button.Group>
              <ActionIcon>
                <Edit onClick={startEdit} />
              </ActionIcon>
              <ActionIcon onClick={removeConversation}>
                <Trash />
              </ActionIcon>
            </Button.Group>
          </div>
        </div>
      }
      active={conversation.id === id}
      onClick={() => navigate(`/conversation/${conversation.id}`)}
    />
  );
}

export default function App3() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { id } = useParams();

  const reloadConversations = () => {
    ky.get("/api/conversation")
      .json<Conversation[]>()
      .then((response) => {
        setConversations(response);
      });
  };

  useEffect(() => {
    reloadConversations();
  }, [id]);
  return (
    <AuthGuard>
      <div style={{ display: "flex" }}>
        <Navbar width={{ base: 200 }}>
          <StartConversation />
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              reloadConversations={reloadConversations}
              conversation={conversation}
            />
          ))}
        </Navbar>
        <Outlet />
      </div>
    </AuthGuard>
  );
}
