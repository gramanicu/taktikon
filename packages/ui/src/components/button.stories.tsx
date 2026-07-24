import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '#components/button'

const meta: Meta<typeof Button> = {
  title: 'Button',
  component: Button,
}

export default meta

type Story = StoryObj<typeof Button>

export const Default: Story = { args: { children: 'Click me' } }
export const Outline: Story = { args: { children: 'Outline', variant: 'outline' } }
