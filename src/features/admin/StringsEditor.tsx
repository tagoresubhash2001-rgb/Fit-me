import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, CardHeader, Skeleton, toast } from '../../components/ui';
import { SUPPORTED_LANGUAGES } from '../../domain/locale';
import type { StringOverrides } from '../../domain/appConfig';
import en from '../../locales/en.json';
import { act, errorCode, useAction } from './api';
import { inputCls } from './ui';

type Tree = { [k: string]: string | Tree };
const flat = (d: Tree, p = ''): Array<[string, string]> => Object.entries(d).flatMap(([k, v]) => (k === '_meta' ? [] : typeof v === 'string' ? [[p + k, v] as [string, string]] : flat(v, `${p}${k}.`)));
const ALL = flat(en as Tree).filter(([k]) => !k.startsWith('admin.'));

/**
 * Every text of the member app, per language. An override replaces the built-in text at once on every device
 * (no release needed); clearing it brings the built-in text back. Placeholders like {{count}} must be kept.
 */
export default function StringsEditor() {
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState('en');
  const [q, setQ] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const o = useAction<StringOverrides>('strings.get', {});
  const overrides = o.data?.strings[lang] ?? {};
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    const list = n ? ALL.filter(([k, v]) => k.toLowerCase().includes(n) || v.toLowerCase().includes(n) || (overrides[k] ?? '').toLowerCase().includes(n)) : ALL.filter(([k]) => k in overrides);
    return list.slice(0, 60);
  }, [q, overrides]);
  const builtIn = (key: string) => {
    const v = i18n.getResource(lang, 'translation', key);
    return typeof v === 'string' ? v : (ALL.find(([k]) => k === key)?.[1] ?? '');
  };
  const save = async (key: string, value: string | null) => {
    const vars = (s: string) => [...s.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort().join(',');
    if (value && vars(value) !== vars(builtIn(key))) return toast(t('admin.strings.placeholders'), 'error');
    setBusy(key);
    try {
      await act('strings.set', { lang, key, value });
      toast(t('admin.saved'), 'success');
      o.reload();
    } catch (e) {
      toast(errorCode(e), 'error');
    } finally {
      setBusy(null);
    }
  };
  return (
    <Card className="flex flex-col gap-4" id="admin-strings">
      <CardHeader title={t('admin.strings.title')} subtitle={t('admin.strings.body')} />
      <div className="flex flex-wrap gap-2">
        <select aria-label={t('admin.content.language')} className={`${inputCls} w-auto`} value={lang} onChange={(e) => setLang(e.target.value)}>
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <input id="strings-search" className={`${inputCls} min-w-0 flex-1`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.strings.search')} />
      </div>
      {!o.data ? (
        <Skeleton className="h-40" />
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {rows.length === 0 && <li className="py-3 text-small text-muted">{q ? t('admin.strings.noMatch') : t('admin.strings.noOverrides')}</li>}
          {rows.map(([key]) => {
            const value = drafts[key] ?? overrides[key] ?? '';
            return (
              <li key={key} className="flex flex-col gap-1.5 py-3">
                <p className="text-caption text-muted">{key}</p>
                <p className="text-small text-ink">{builtIn(key)}</p>
                <textarea rows={2} className="w-full rounded-input border border-line bg-surface px-3 py-2 text-body text-ink" value={value} onChange={(e) => setDrafts({ ...drafts, [key]: e.target.value })} placeholder={t('admin.strings.overridePlaceholder')} aria-label={t('admin.strings.override', { key })} />
                <div className="flex gap-2">
                  <Button size="sm" loading={busy === key} disabled={!value.trim() || value === overrides[key]} onClick={() => void save(key, value.trim())}>
                    {t('admin.save')}
                  </Button>
                  {key in overrides && (
                    <Button size="sm" variant="ghost" onClick={() => void save(key, null)}>
                      {t('admin.strings.reset')}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
