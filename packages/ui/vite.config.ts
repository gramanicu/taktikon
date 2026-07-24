import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Used by Storybook's react-vite builder; wires Tailwind v4 so stories render styled.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
