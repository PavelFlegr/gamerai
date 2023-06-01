import React, { useState } from "react";
import { Button, NumberInput, Space, Textarea } from "@mantine/core";
import { Conversation } from "../model";

export default function SettingsComponent(props: {
  settings: Conversation;
  saveSettings: (settings: Conversation) => void;
}) {
  const [settings, setSettings] = useState(props.settings);

  return (
    <>
      <Textarea
        onChange={(e) => setSettings({ ...settings, context: e.target.value })}
        label="Context"
        minRows={10}
        value={settings.context}
      ></Textarea>
      <NumberInput
        value={settings.blockCount}
        onChange={(e) => setSettings({ ...settings, blockCount: +e })}
        min={1}
        max={100}
        step={1}
        label={"Block count"}
      ></NumberInput>
      <NumberInput
        value={settings.blockSize}
        onChange={(e) => setSettings({ ...settings, blockSize: +e })}
        min={100}
        max={10000}
        step={1}
        label={"Block size"}
      ></NumberInput>
      <Textarea
        onChange={(e) =>
          setSettings({ ...settings, systemMsg: e.target.value })
        }
        label="System message"
        minRows={10}
        value={settings.systemMsg}
      ></Textarea>
      <Space h="xs" />
      <Button onClick={() => props.saveSettings(settings)}>Save</Button>
    </>
  );
}
