import { Container } from "@mantine/core";
import React from "react";
import StartConversation from "./start-conversation";

export default function Index() {
  return (
    <Container
      w={1000}
      mx="auto"
      style={{ display: "flex", justifyContent: "space-evenly" }}
    >
      <StartConversation />
    </Container>
  );
}
