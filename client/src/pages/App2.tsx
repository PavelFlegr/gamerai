import { Button, Container, TextInput, Text, Box, Textarea } from '@mantine/core';
import { useState } from 'react';
import { useId, useInputState } from '@mantine/hooks';
import { nanoid } from 'nanoid';
import ky from 'ky';

interface Resource {
  id: string
  type: string
  value: string
}
export default function App2() {
  const [resources, setResources] = useState<Resource[]>([])
  const [instruction, setInstruction] = useInputState<string>('')
  const [response, setResponse] = useState('')
  const addResource = (type: string) => {
    setResources([...resources, {type, id: nanoid(), value: ''}])
  }

  const handleResourceChange = (id: string, value: string) => {
    //@ts-ignore
    resources.find(r => r.id === id).value = value
    setResources([...resources])
  }

  const getAnswer = async () => {
    const response = await ky.post('/api/answer', {json: { instruction, resources }, timeout: false}).text()
    setResponse(response)
  }

  return (
      <Container mx="auto">
        <TextInput value={instruction} onChange={setInstruction} label="Instructions"/>
        <Text>Resources:</Text>
        <Button onClick={() => addResource('url')}>Add url</Button>
        <Button onClick={() => addResource('text')}>Add text</Button>
            {resources.map(resource => {
              switch (resource.type) {
                case "url":
                  return <TextInput label="Url" key={resource.id} value={resource.value} onChange={(e)=> handleResourceChange(resource.id, e.target.value)}/>
                case "text":
                  return <Textarea label="Text" key={resource.id} value={resource.value} onChange={(e)=> handleResourceChange(resource.id, e.target.value)}/>
              }
            })}

        <Button onClick={getAnswer}>Send</Button>
        <Text style={{whiteSpace: 'break-spaces'}}>{response}</Text>
      </Container>
  );
}