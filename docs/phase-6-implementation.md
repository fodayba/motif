# Phase 6: Cross-Cutting & Mobile Support - Implementation Guide

## Overview
Phase 6 focuses on creating a mobile-first, responsive experience with comprehensive data visualization components and touch-friendly interactions.

## ✅ Completed Features

### 1. Theming System
- **Light/Dark Mode**: Full theme switching with CSS custom properties
- **Compact Mode**: Density control for information-dense layouts
- **Theme Provider**: React context for theme management
- **Persistent Settings**: LocalStorage-based theme persistence
- **System Preference Detection**: Automatic dark mode detection

**Files:**
- `src/app/providers/theme-provider.tsx`
- `src/app/components/theme-toggle.tsx`
- `src/app/components/density-toggle.tsx`

### 2. Data Visualization Components

#### Basic Components (Pre-existing)
- **Sparkline**: Compact line charts for trends
- **RadialGauge**: Circular progress indicators
- **TrendBadge**: Directional indicators with colors
- **PlaceholderChart**: Loading/empty states

#### Advanced Components (New)
- **BarChart**: Vertical/horizontal bar charts with grid
- **LineChart**: Multi-series line charts with legends
- **DataTable**: Sortable, responsive data tables

**Files:**
- `src/shared/components/data-viz/bar-chart.tsx`
- `src/shared/components/data-viz/line-chart.tsx`
- `src/shared/components/data-viz/data-table.tsx`

**Usage Example:**
```tsx
import { BarChart, LineChart, DataTable } from '@shared/components/data-viz'

// Bar Chart
<BarChart
  data={[
    { label: 'Q1', value: 1200 },
    { label: 'Q2', value: 1800 },
    { label: 'Q3', value: 1500 },
  ]}
  title="Quarterly Revenue"
  showValues
  orientation="vertical"
/>

// Line Chart
<LineChart
  series={[
    { id: 's1', label: 'Series 1', data: [10, 20, 15, 30] },
    { id: 's2', label: 'Series 2', data: [15, 25, 20, 35] },
  ]}
  labels={['Jan', 'Feb', 'Mar', 'Apr']}
  showPoints
  showLegend
/>

// Data Table
<DataTable
  columns={[
    { id: 'name', label: 'Name', accessor: (row) => row.name, sortable: true },
    { id: 'value', label: 'Value', accessor: (row) => row.value, align: 'right' },
  ]}
  data={items}
  keyExtractor={(row) => row.id}
/>
```

### 3. Responsive Utilities & Hooks

#### Breakpoint Detection
```tsx
import { useBreakpoint, useMediaQuery, useIsMobile } from '@shared/hooks'

const breakpoint = useBreakpoint() // 'mobile' | 'tablet' | 'desktop' | 'wide'
const isTablet = useMediaQuery('tablet') // true if >= 768px
const isMobile = useIsMobile() // true if touch-enabled
```

#### Viewport & Orientation
```tsx
import { useViewportSize, useOrientation } from '@shared/hooks'

const { width, height } = useViewportSize()
const orientation = useOrientation() // 'portrait' | 'landscape'
```

**Files:**
- `src/shared/hooks/use-responsive.ts`

### 4. Touch Gesture Hooks

#### Swipe Gestures
```tsx
import { useSwipe } from '@shared/hooks'

const elementRef = useSwipe({
  onSwipeLeft: () => console.log('Swiped left'),
  onSwipeRight: () => console.log('Swiped right'),
}, { threshold: 50 })

<div ref={elementRef}>Swipeable content</div>
```

#### Long Press
```tsx
import { useLongPress } from '@shared/hooks'

const longPressHandlers = useLongPress(() => {
  console.log('Long pressed!')
}, { delay: 500 })

<button {...longPressHandlers}>Press and hold</button>
```

#### Pinch Zoom
```tsx
import { usePinchZoom } from '@shared/hooks'

const elementRef = usePinchZoom((scale) => {
  console.log('Pinch scale:', scale)
})

<div ref={elementRef}>Zoomable content</div>
```

**Files:**
- `src/shared/hooks/use-touch.ts`

### 5. Responsive Layout Components

#### ResponsiveGrid
```tsx
import { ResponsiveGrid } from '@shared/components/ui'

<ResponsiveGrid
  columns={{ mobile: 1, tablet: 2, desktop: 3, wide: 4 }}
  gap="md"
>
  {items.map(item => <Card key={item.id} {...item} />)}
</ResponsiveGrid>
```

#### Stack
```tsx
import { Stack } from '@shared/components/ui'

<Stack direction="vertical" align="start" gap="lg" responsive>
  <Header />
  <Content />
  <Footer />
</Stack>
```

#### Container
```tsx
import { Container } from '@shared/components/ui'

<Container size="lg" padded>
  <Content />
</Container>
```

**Files:**
- `src/shared/components/ui/responsive-grid.tsx`
- `src/shared/components/ui/stack.tsx`
- `src/shared/components/ui/container.tsx`

### 6. Mobile-Specific Components

#### MobileDrawer
```tsx
import { MobileDrawer, useMobileDrawer } from '@shared/components/ui'

const drawer = useMobileDrawer()

<>
  <button onClick={drawer.open}>Open Menu</button>
  <MobileDrawer
    isOpen={drawer.isOpen}
    onClose={drawer.close}
    title="Navigation"
    position="left"
  >
    <Navigation />
  </MobileDrawer>
</>
```

#### PullToRefresh
```tsx
import { PullToRefresh } from '@shared/components/ui'

<PullToRefresh
  onRefresh={async () => {
    await fetchData()
  }}
  threshold={80}
>
  <Content />
</PullToRefresh>
```

**Files:**
- `src/shared/components/ui/mobile-drawer.tsx`
- `src/shared/components/ui/pull-to-refresh.tsx`

### 7. Mobile-First CSS Utilities

Comprehensive utility classes for mobile optimization:

- **Touch Targets**: `.touch-target`, `.touch-target-lg`
- **Visibility**: `.hide-mobile`, `.show-mobile`, `.hide-tablet`, etc.
- **Responsive Text**: `.text-responsive`, `.heading-responsive`
- **Scroll Containers**: `.scroll-container` with momentum scrolling
- **Card Grids**: `.card-grid` with responsive columns
- **Safe Areas**: `.safe-area-top`, `.safe-area-bottom`, etc.
- **Bottom Navigation**: `.bottom-nav` for mobile app-style navigation

**File:**
- `src/shared/styles/mobile.css`

### 8. Enhanced App Shell Responsiveness

The main application shell has been enhanced with:
- Collapsible navigation on tablet/mobile
- Touch-friendly tap targets (min 44px)
- Responsive topbar with flexible layout
- Mobile-optimized spacing and typography
- Smooth transitions between breakpoints

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: 1024px - 1439px
- Wide: >= 1440px

## Implementation Patterns

### Mobile-First Approach
All components follow mobile-first design:
1. Base styles target mobile devices
2. Media queries progressively enhance for larger screens
3. Touch targets meet WCAG 2.1 AA standards (44x44px minimum)

### Performance Optimization
- CSS custom properties for theming (no JS recalculation)
- `will-change` for animated properties
- `-webkit-overflow-scrolling: touch` for smooth scrolling
- Passive event listeners where appropriate

### Accessibility
- Proper ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators visible in all themes
- Screen reader friendly data visualizations

## Testing Recommendations

### Responsive Testing
1. Test on actual devices (iOS Safari, Android Chrome)
2. Use Chrome DevTools device emulation
3. Verify touch gestures work correctly
4. Check safe area insets on notched devices

### Visual Testing
1. Verify all components in light/dark mode
2. Test compact density mode
3. Ensure proper rendering at all breakpoints
4. Check data visualization readability

### Performance Testing
1. Measure paint times on mobile devices
2. Test scroll performance with large datasets
3. Verify gesture responsiveness
4. Check animation frame rates

## Next Steps

To fully complete Phase 6, consider:

1. **Performance Monitoring**: Add performance metrics for mobile
2. **Offline Indicators**: Visual feedback for offline state
3. **Progressive Web App**: Add manifest and service worker
4. **Advanced Charts**: Consider integrating Chart.js or Recharts for complex visualizations
5. **Mobile-Specific Features**: Add haptic feedback, share API, etc.

## Integration Example

Here's a complete example of a mobile-responsive dashboard:

```tsx
import { Container, ResponsiveGrid, Stack } from '@shared/components/ui'
import { BarChart, LineChart, DataTable, RadialGauge } from '@shared/components/data-viz'
import { useBreakpoint, useIsMobile } from '@shared/hooks'

export const Dashboard = () => {
  const breakpoint = useBreakpoint()
  const isMobile = useIsMobile()

  return (
    <Container size="xl" padded>
      <Stack direction="vertical" gap="lg">
        <ResponsiveGrid
          columns={{ mobile: 1, tablet: 2, desktop: 4 }}
          gap="md"
        >
          <RadialGauge value={75} label="Completion" />
          <RadialGauge value={92} label="Quality" tone="success" />
          <RadialGauge value={58} label="Budget" tone="warning" />
          <RadialGauge value={34} label="Risk" tone="danger" />
        </ResponsiveGrid>

        <ResponsiveGrid
          columns={{ mobile: 1, tablet: 1, desktop: 2 }}
          gap="lg"
        >
          <BarChart
            data={monthlyData}
            title="Monthly Revenue"
            orientation={isMobile ? 'horizontal' : 'vertical'}
          />
          <LineChart
            series={trendSeries}
            labels={months}
            title="Trends"
            showPoints={!isMobile}
          />
        </ResponsiveGrid>

        <DataTable
          columns={columns}
          data={tableData}
          title="Recent Activity"
        />
      </Stack>
    </Container>
  )
}
```

## Notes

- All components are fully typed with TypeScript
- CSS follows the existing design token system
- Components work seamlessly with existing theme system
- No external dependencies added (pure React + CSS)
