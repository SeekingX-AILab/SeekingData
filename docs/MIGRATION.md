# Migration Guide

This guide helps you migrate from the original SeekingData React app to the new Electron desktop application.

## Overview

The new SeekingData is a complete rewrite with:
- **Desktop App**: Electron + Vite + React
- **Backend**: FastAPI + Python
- **UI**: Material Design 3
- **Packaging**: Pre-installed dependencies

## Migration Steps

### 1. Component Migration

Original React components can be migrated with minimal changes:

**Before (Original):**
```javascript
// src/components/BatchProcessor.js
import { useState } from 'react';

function BatchProcessor({ config, generateAIResponse }) {
  const [urls, setUrls] = useState('');

  return (
    <div className="batch-processor">
      {/* JSX */}
    </div>
  );
}
```

**After (New):**
```typescript
// src/components/sft/BatchProcessor.tsx
import { useState } from 'react';
import { useConfigStore } from '@/lib/stores';
import { Card, Button, Input } from '@/components/ui';

export function BatchProcessor() {
  const [urls, setUrls] = useState('');
  const { config } = useConfigStore();

  return (
    <Card>
      {/* JSX with Material Design 3 */}
    </Card>
  );
}
```

### 2. State Management Migration

**Before (Local State):**
```javascript
const [config, setConfig] = useState({
  baseUrl: '...',
  apiKey: '...',
  model: 'gpt-4'
});
```

**After (Zustand Store):**
```typescript
// Use global store
import { useAppStore } from '@/lib/stores';

const { config, setConfig } = useAppStore();
```

### 3. API Call Migration

**Before (Direct OpenAI Call):**
```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: model,
    messages: [...]
  })
});
```

**After (Backend API):**
```typescript
import api from '@/lib/api';

const response = await api.post('/api/sft/generate', {
  content: inputContent,
  config: {
    apiKey,
    baseUrl,
    model
  }
});
```

### 4. Styling Migration

**Before (Plain CSS):**
```javascript
<div className="batch-processor">
  <button className="btn-primary">Submit</button>
</div>
```

**After (TailwindCSS + Material Design):**
```typescript
<Card>
  <Button variant="filled">Submit</Button>
</Card>
```

### 5. File Structure Migration

| Original | New |
|----------|-----|
| `src/components/BatchProcessor.js` | `src/components/sft/BatchProcessor.tsx` |
| `src/components/CotGenerator.js` | `src/components/sft/CotGenerator.tsx` |
| `src/utils/api.js` | `src/lib/api.ts` |
| `src/App.js` | `src/App.tsx` |
| `package.json` (dependencies) | `package.json` (root) |
| - | `backend/` (FastAPI) |
| - | `electron/` (Electron) |

## Feature Mapping

### SFT Features (Preserved)

- ✅ Single Processing
- ✅ Batch Processing
- ✅ Format Conversion
- ✅ CoT Generator
- ✅ Image Dataset
- ✅ Video Dataset
- ✅ Dataset Sharing

### New Features

- ✅ GitHub Task Generator
- ✅ Visual Task Builder
- ✅ Task Manager
- ✅ Desktop App (Electron)
- ✅ Offline Capable

## Data Migration

### LocalStorage Data

The new app uses Zustand with persist middleware, which stores data in LocalStorage.

**Migration Script (if needed):**
```javascript
// Run in browser console
const oldData = localStorage.getItem('your-old-key');
if (oldData) {
  const parsed = JSON.parse(oldData);
  localStorage.setItem('seeking-data-storage', JSON.stringify({
    state: {
      config: parsed.config,
      dataList: parsed.dataList
    }
  }));
}
```

## Environment Variables

**Before:**
```
REACT_APP_OPENAI_API_KEY=...
REACT_APP_API_URL=...
```

**After:**
```
OPENAI_API_KEY=...
OPENAI_BASE_URL=...
GITHUB_TOKEN=...
```

## Troubleshooting

### Common Issues

**1. "Module not found" errors**
- Ensure all imports use `@/` alias
- Check file extensions (`.tsx` vs `.ts`)

**2. State not persisting**
- Check Zustand store configuration
- Verify LocalStorage permissions

**3. API calls failing**
- Ensure backend is running (`uv run uvicorn main:app`)
- Check CORS configuration

**4. Electron not starting**
- Verify Node.js version (>= 18.0.0)
- Check Electron installation

### Getting Help

- Check the [Architecture Guide](./ARCHITECTURE.md)
- Review the [API Documentation](./API.md)
- Open an issue on GitHub

## Rollback Plan

If migration fails, you can:

1. Keep the original app running
2. Export all data from the new app
3. Import data into the original app
4. Continue using the original app

## Timeline

- **Week 1-2**: Migrate SFT components
- **Week 3**: Test and verify all features
- **Week 4**: Deploy and user training

## Next Steps

After migration:

1. Test all SFT features thoroughly
2. Update user documentation
3. Train users on new interface
4. Collect feedback for improvements
