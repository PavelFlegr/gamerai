import { Button, ButtonProps } from "@mantine/core";
import React from "react";
import { useNavigate } from "react-router-dom";
import ky from "ky";
import { Collaboration } from "../model";

export default function StartCollaboration(props: ButtonProps) {
  const navigate = useNavigate();
  const startCollaboration = async () => {
    const collaboration = await ky
      .post("/api/collaboration", { json: { title: "New collaboration" } })
      .json<Collaboration>();
    navigate(`/collaboration/${collaboration.id}`);
  };
  return (
    <Button {...props} onClick={startCollaboration}>
      Start collaboration
    </Button>
  );
}
