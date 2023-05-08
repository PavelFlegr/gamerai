import React, { useState } from 'react';
import { Button, Space, Textarea } from '@mantine/core';
import { Settings } from '../model';

export default function SettingsComponent(props: { settings: Settings, saveSettings: (settings: Settings) => void }) {
  const [settings, setSettings] = useState(props.settings)

  return <>
    <Textarea onChange={e => setSettings({...settings, systemMsg: e.target.value})} label="System message" minRows={10} value={settings.systemMsg}></Textarea>
    <Space h="xs"/>
    <Textarea onChange={e => setSettings({...settings, context: e.target.value})} label="Context" minRows={10} value={settings.context}></Textarea>
    <Space h="xs"/>
    <Button onClick={() => props.saveSettings(settings)}>Save</Button>
  </>
}