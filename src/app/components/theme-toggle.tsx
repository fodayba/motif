import { Sun, Moon } from 'lucide-react'
import { Button } from '@shared/components/ui'
import { useTheme } from '../providers/theme-provider'

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  const label = theme === 'dark' ? 'Dark mode' : 'Light mode'

  return (
    <Button
      variant="ghost"
      aria-label="Toggle color theme"
      aria-pressed={theme === 'dark'}
      onClick={toggleTheme}
      title={label}
      style={{ minWidth: '40px', width: '40px', height: '40px', padding: 0 }}
    >
      {theme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
    </Button>
  )
}
