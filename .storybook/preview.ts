import type { Preview } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import { FilterProvider } from '../src/context/FilterContext'
import '../src/index.css'
import React from 'react'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0f172a' }],
    },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name',    enabled: true },
          { id: 'image-alt',      enabled: true },
          { id: 'link-name',      enabled: true },
          { id: 'label',          enabled: true },
        ],
      },
    },
  },
  decorators: [
    Story => React.createElement(
      MemoryRouter,
      { future: { v7_startTransition: true, v7_relativeSplatPath: true } },
      React.createElement(FilterProvider, null, React.createElement(Story)),
    ),
  ],
}

export default preview
