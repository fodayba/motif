import { Button } from '@shared/components/ui'
import { useTheme } from '../providers/theme-provider'

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button variant="ghost" aria-label="Toggle theme" onClick={toggleTheme}>
      {theme === 'light' ? 'Light' : 'Dark'}
    </Button>
  )
}
