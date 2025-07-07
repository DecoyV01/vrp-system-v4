# Optimization Quick Reference

## Overview

Quick reference guide for common optimization techniques in VRP System v4.

## Frontend Optimizations

### React Performance
```typescript
// ✅ Memoize expensive components
const VehicleList = React.memo(({ vehicles }) => {
  // Component logic
})

// ✅ Use callback for event handlers
const handleClick = useCallback((id) => {
  // Handle click
}, [dependencies])

// ✅ Optimize state updates
setState(prev => ({ ...prev, field: value }))

// ✅ Use proper keys in lists
{items.map(item => <Item key={item.id} {...item} />)}
```

### Bundle Size
```bash
# Analyze bundle
npm run build -- --analyze

# Check bundle size
npm run build && ls -lh dist/assets/
```

### Lazy Loading
```typescript
// ✅ Route-based splitting
const TableEditor = lazy(() => import('./TableEditor'))

// ✅ Component-based splitting
const HeavyComponent = lazy(() => 
  import(/* webpackChunkName: "heavy" */ './HeavyComponent')
)
```

## Backend Optimizations

### Convex Queries
```typescript
// ✅ Use indexes
.withIndex("by_project", q => q.eq("projectId", id))

// ✅ Limit results
.take(100)

// ✅ Select fields
.map(doc => ({ id: doc._id, name: doc.name }))
```

### Batch Operations
```typescript
// ✅ Batch inserts
const ids = await Promise.all(
  items.map(item => ctx.db.insert("table", item))
)

// ✅ Batch updates
await ctx.runMutation(internal.batch.updateMany, { updates })
```

## Database Optimizations

### Index Usage
```typescript
// Schema indexes
.index("by_project", ["projectId"])
.index("by_status", ["status", "createdAt"])
.index("compound", ["projectId", "datasetId"])
```

### Query Patterns
```typescript
// ✅ Filter early
query("vehicles")
  .withIndex("by_project", q => q.eq("projectId", id))
  .filter(q => q.eq(q.field("status"), "active"))

// ❌ Filter late
query("vehicles")
  .collect()
  .then(all => all.filter(v => v.projectId === id))
```

## Network Optimizations

### API Calls
```typescript
// ✅ Parallel requests
const [projects, stats] = await Promise.all([
  getProjects(),
  getStats()
])

// ✅ Debounced updates
const debouncedSave = debounce(save, 300)
```

### Caching
```typescript
// ✅ SWR pattern
const { data, error } = useSWR(key, fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 5000
})

// ✅ Local caching
const cache = new Map()
const getCached = (key) => {
  if (!cache.has(key)) {
    cache.set(key, fetchData(key))
  }
  return cache.get(key)
}
```

## Memory Optimizations

### Data Structures
```typescript
// ✅ Use Map for lookups
const vehicleMap = new Map(vehicles.map(v => [v.id, v]))

// ✅ Use Set for uniqueness
const uniqueIds = new Set(items.map(i => i.id))

// ❌ Avoid array lookups
vehicles.find(v => v.id === id) // O(n)
```

### Cleanup
```typescript
// ✅ Cleanup subscriptions
useEffect(() => {
  const sub = subscribe()
  return () => sub.unsubscribe()
}, [])

// ✅ Clear references
componentWillUnmount() {
  this.largeData = null
}
```

## Common Performance Fixes

### Problem: Slow List Rendering
```typescript
// Solution: Virtualization
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={50}
>
  {Row}
</FixedSizeList>
```

### Problem: Excessive Re-renders
```typescript
// Solution: Proper dependencies
const value = useMemo(() => 
  computeExpensive(data), 
  [data.id] // Only recompute when ID changes
)
```

### Problem: Large Bundle
```bash
# Solution: Analyze and split
npm install -D webpack-bundle-analyzer
npm run build -- --analyze

# Dynamic imports for large libraries
const moment = () => import('moment')
```

### Problem: Slow API Response
```typescript
// Solution: Pagination
export const listWithPagination = query({
  args: { 
    limit: v.number(),
    cursor: v.optional(v.string())
  },
  handler: async (ctx, { limit, cursor }) => {
    const query = ctx.db.query("items")
    if (cursor) {
      query.filter(q => q.gt(q.field("_id"), cursor))
    }
    const items = await query.take(limit + 1)
    const hasMore = items.length > limit
    return {
      items: items.slice(0, limit),
      nextCursor: hasMore ? items[limit]._id : null
    }
  }
})
```

## Performance Checklist

### Before Deployment
- [ ] Run production build
- [ ] Check bundle size < 500KB
- [ ] Test with throttled network
- [ ] Profile with React DevTools
- [ ] Check for memory leaks
- [ ] Validate lazy loading works
- [ ] Test on low-end devices

### Monitoring
- [ ] Core Web Vitals tracking
- [ ] Error rate monitoring
- [ ] API response times
- [ ] Real user monitoring
- [ ] Performance budgets

## Quick Commands

```bash
# Build and analyze
npm run build -- --analyze

# Profile bundle
npx source-map-explorer dist/assets/*.js

# Lighthouse audit
npx lighthouse http://localhost:3000

# Check dependencies size
npx bundlephobia-cli react convex

# Find large modules
npm ls --depth=0 | awk '{print $2}' | xargs -I {} sh -c 'echo -n "{}: "; npm ls {} | wc -l'
```

## Performance Tools

### Development
- React DevTools Profiler
- Chrome DevTools Performance
- Lighthouse CI
- WebPageTest

### Production
- Sentry Performance
- DataDog RUM
- New Relic Browser
- Google Analytics

---

*Last Updated: July 2025*
*Version: 1.0.0*