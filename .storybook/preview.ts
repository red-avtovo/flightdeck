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
    // Single global Router + FilterProvider for every story. Stories must NOT
    // wrap their own <MemoryRouter> — React Router throws "You cannot render a
    // <Router> inside another <Router>", which surfaces as an empty-message
    // StorybookTestRunnerError in CI. A story that needs a specific route sets
    // it via `parameters: { router: { initialEntries: ['/overview'] } }`.
    (Story, context) => React.createElement(
      MemoryRouter,
      {
        initialEntries: context.parameters.router?.initialEntries ?? ['/'],
        future: { v7_startTransition: true, v7_relativeSplatPath: true },
      },
      React.createElement(FilterProvider, null, React.createElement(Story)),
    ),
  ],
}

export default preview
