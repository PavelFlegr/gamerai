import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import App2 from './App2';
import App3 from './App3';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App3/>,
  },
  {
    path: "helper",
    element: <App2/>
  }
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={{ colorScheme: 'dark' }} withGlobalStyles withNormalizeCSS>
      <RouterProvider router={router}/>
    </MantineProvider>
  </React.StrictMode>,
)
