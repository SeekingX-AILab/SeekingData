import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  Eye,
  EyeOff,
  Save,
  Settings as SettingsIcon,
} from 'lucide-react';

/**
 * Represents the shape of the config form state.
 *
 * Attributes:
 *   base_url (string): The LLM API base endpoint URL.
 *   api_key (string): The secret API key for the LLM
 *       provider.
 *   model (string): The model identifier string
 *       (e.g. "openai/deepseek-v3.2").
 *   suggestions_count (number): How many SFT suggestions
 *       to generate per request (1-10).
 */
interface ConfigForm {
  base_url: string;
  api_key: string;
  model: string;
  suggestions_count: number;
}

const API_BASE = import.meta.env.VITE_API_BASE || '';

/**
 * Settings page component.
 *
 * Provides a form to configure LLM provider settings
 * (API Base URL, API Key, Model, Suggestions Count).
 * On mount it fetches the current config from the
 * backend; on save it persists changes via POST.
 */
export function Settings() {
  const [form, setForm] = useState<ConfigForm>({
    base_url: 'https://api.openai.com/v1',
    api_key: '',
    model: '',
    suggestions_count: 3,
  });
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  /** Fetch current config from the backend on mount. */
  useEffect(() => {
    fetch(`${API_BASE}/api/sft/config`)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          base_url:
            data.base_url || 'https://api.openai.com/v1',
          api_key: data.api_key || '',
          model: data.model || '',
          suggestions_count:
            data.suggestions_count ?? 3,
        });
      })
      .catch(() => {
        /* keep defaults on network error */
      })
      .finally(() => setLoading(false));
  }, []);

  /**
   * Update a single field in the form state.
   *
   * Args:
   *   field: The config key to update.
   *   value: The new value for that key.
   */
  const handleChange = (
    field: keyof ConfigForm,
    value: string | number
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (status !== 'idle') setStatus('idle');
  };

  /**
   * Persist config to the backend via POST.
   * Shows success or error status below the button.
   */
  const handleSave = async () => {
    setStatus('saving');
    setErrorMsg('');
    try {
      const res = await fetch(
        `${API_BASE}/api/sft/config`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) {
        throw new Error(
          `Server responded with ${res.status}`
        );
      }
      setStatus('saved');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Failed to save configuration'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-on-surface/50">
          Loading configuration...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <SettingsIcon className="w-7 h-7 text-primary-600" />
        <h1 className="text-2xl font-semibold text-on-surface">
          Settings
        </h1>
      </div>

      <Card variant="outlined">
        <Card.Header
          title="LLM Provider Configuration"
          subtitle="Configure your language model API connection"
        />
        <Card.Content>
          <div className="space-y-5">
            {/* API Base URL */}
            <Input
              label="API Base URL"
              placeholder="https://api.openai.com/v1"
              value={form.base_url}
              onChange={(e) =>
                handleChange('base_url', e.target.value)
              }
            />

            {/* API Key with show/hide toggle */}
            <Input
              label="API Key"
              type={showKey ? 'text' : 'password'}
              placeholder="sk-..."
              value={form.api_key}
              onChange={(e) =>
                handleChange('api_key', e.target.value)
              }
              trailingIcon={
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="cursor-pointer hover:text-primary-500 transition-colors"
                  aria-label={
                    showKey
                      ? 'Hide API key'
                      : 'Show API key'
                  }
                >
                  {showKey ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              }
              helperText="Your key is masked when displayed"
            />

            {/* Model */}
            <Input
              label="Model"
              placeholder="qwen/qwen3.5-plus"
              value={form.model}
              onChange={(e) =>
                handleChange('model', e.target.value)
              }
              helperText="e.g. qwen/qwen3.5-plus, moonshot/kimi-k2.5"
            />

            {/* Suggestions Count */}
            <Input
              label="Suggestions Count"
              type="number"
              value={String(form.suggestions_count)}
              onChange={(e) => {
                const val = parseInt(
                  e.target.value, 10
                );
                if (!isNaN(val) && val >= 1 && val <= 10) {
                  handleChange(
                    'suggestions_count', val
                  );
                }
              }}
              helperText="Number of suggestions per request (1-10)"
            />
          </div>
        </Card.Content>

        <Card.Actions>
          <Button
            variant="filled"
            onClick={handleSave}
            disabled={status === 'saving'}
            icon={<Save className="w-4 h-4" />}
          >
            {status === 'saving'
              ? 'Saving...'
              : 'Save Configuration'}
          </Button>
        </Card.Actions>
      </Card>

      {/* Status message */}
      {status === 'saved' && (
        <p className="text-sm text-green-600 font-medium">
          Configuration saved successfully.
        </p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-600 font-medium">
          Error: {errorMsg}
        </p>
      )}
    </div>
  );
}
