import { Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@shared/components/ui'
import { useTheme } from '../providers/theme-provider'

export const DensityToggle = () => {
  const { density, toggleDensity } = useTheme()

  const label = density === 'compact' ? 'Compact mode' : 'Comfort mode'

  return (
    <Button
      variant="ghost"
      aria-label="Toggle layout density"
      aria-pressed={density === 'compact'}
      onClick={toggleDensity}
      title={label}
      style={{ minWidth: '40px', width: '40px', height: '40px', padding: 0 }}
    >
      {density === 'compact' ? <Maximize2 size={18} strokeWidth={1.5} /> : <Minimize2 size={18} strokeWidth={1.5} />}
    </Button>
  )
}
