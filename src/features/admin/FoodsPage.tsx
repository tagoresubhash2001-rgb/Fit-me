import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader, Sheet, Skeleton, Tabs, toast } from '../../components/ui';
import { db } from '../../lib/firebase';
import { searchFoodsPage } from '../../data/foods';
import type { FoodItem } from '../../domain/nutrition';
import { call, errorCode, fmtDate } from './api';
import { Field, Table, Td, inputCls } from './ui';

interface Draft {
  id?: string;
  name: string;
  aliases: string;
  category: string;
  cuisine: string;
  countries: string;
  calories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  fiberG: string;
  servingLabel: string;
  servingGrams: string;
  status: 'active' | 'hidden';
}
interface Suggestion {
  id: string;
  name: string;
  servingLabel: string | null;
  grams: number | null;
  nutrients: { calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number } | null;
  status: string;
  createdAt?: { toMillis(): number };
}

const empty: Draft = { name: '', aliases: '', category: 'Other', cuisine: '', countries: '', calories: '', proteinG: '', carbsG: '', fatG: '', fiberG: '', servingLabel: '', servingGrams: '', status: 'active' };
const fromFood = (f: FoodItem): Draft => ({
  id: f.id,
  name: f.name,
  aliases: (f.aliases ?? []).join(', '),
  category: f.category ?? 'Other',
  cuisine: f.cuisine ?? '',
  countries: (f.countries ?? []).join(', '),
  calories: String(f.per100g.calories),
  proteinG: String(f.per100g.proteinG),
  carbsG: String(f.per100g.carbsG),
  fatG: String(f.per100g.fatG),
  fiberG: String(f.per100g.fiberG),
  servingLabel: f.servings[0]?.label ?? '',
  servingGrams: f.servings[0] ? String(f.servings[0].grams) : '',
  status: 'active',
});
const fromSuggestion = (s: Suggestion): Draft => {
  const g = s.grams && s.grams > 0 ? s.grams : 100;
  const k = 100 / g;
  const n = s.nutrients ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
  const r = (v: number) => String(Math.round(v * k * 10) / 10);
  return { ...empty, name: s.name, calories: r(n.calories), proteinG: r(n.proteinG), carbsG: r(n.carbsG), fatG: r(n.fatG), fiberG: r(n.fiberG), servingLabel: s.servingLabel ?? '', servingGrams: s.grams ? String(s.grams) : '' };
};
function toPayload(d: Draft) {
  const list = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean);
  return {
    ...(d.id ? { id: d.id } : {}),
    name: d.name.trim(),
    aliases: list(d.aliases),
    category: d.category.trim() || 'Other',
    ...(d.cuisine.trim() ? { cuisine: d.cuisine.trim() } : {}),
    countries: list(d.countries).map((c) => c.toUpperCase()),
    per100g: { calories: Number(d.calories), proteinG: Number(d.proteinG), carbsG: Number(d.carbsG), fatG: Number(d.fatG), fiberG: Number(d.fiberG) },
    servings: d.servingLabel.trim() && Number(d.servingGrams) > 0 ? [{ label: d.servingLabel.trim(), grams: Number(d.servingGrams) }] : [],
    status: d.status,
  };
}

function FoodForm({ draft, title, onSave, onClose }: { draft: Draft; title: string; onSave: (p: ReturnType<typeof toPayload>) => Promise<void>; onClose: () => void }) {
  const { t } = useTranslation();
  const [d, setD] = useState(draft);
  const [busy, setBusy] = useState(false);
  const up = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setD({ ...d, [k]: e.target.value });
  const nums = ['calories', 'proteinG', 'carbsG', 'fatG', 'fiberG'] as const;
  const valid = d.name.trim().length >= 2 && nums.every((k) => d[k] !== '' && Number(d[k]) >= 0);
  return (
    <Sheet mobileFull size="lg" className="admin-touch" open onClose={onClose} closeLabel={t('common.close')} title={title}>
      <div className="flex flex-col gap-3" id="admin-food-form">
        <Field label={t('food.foodName')}>
          <input className={inputCls} value={d.name} maxLength={120} onChange={up('name')} />
        </Field>
        <Field label={t('admin.foods.aliases')} hint={t('admin.foods.commaHint')}>
          <input className={inputCls} value={d.aliases} onChange={up('aliases')} />
        </Field>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label={t('admin.foods.category')}>
            <input className={inputCls} value={d.category} maxLength={60} onChange={up('category')} />
          </Field>
          <Field label={t('admin.foods.cuisine')}>
            <input className={inputCls} value={d.cuisine} maxLength={60} onChange={up('cuisine')} />
          </Field>
          <Field label={t('admin.foods.countries')} hint={t('admin.foods.commaHint')}>
            <input className={inputCls} value={d.countries} onChange={up('countries')} />
          </Field>
        </div>
        <p className="text-small font-medium text-ink">{t('admin.foods.per100g')}</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {nums.map((k) => (
            <Field key={k} label={t(`admin.foods.n.${k}`)}>
              <input className={inputCls} inputMode="decimal" value={d[k]} onChange={up(k)} />
            </Field>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('food.servingLabel')}>
            <input className={inputCls} value={d.servingLabel} maxLength={60} onChange={up('servingLabel')} />
          </Field>
          <Field label={t('admin.foods.servingGrams')}>
            <input className={inputCls} inputMode="decimal" value={d.servingGrams} onChange={up('servingGrams')} />
          </Field>
        </div>
        <Field label={t('admin.foods.visibility')}>
          <select className={inputCls} value={d.status} onChange={up('status')}>
            <option value="active">{t('admin.foods.shown')}</option>
            <option value="hidden">{t('admin.foods.hidden')}</option>
          </select>
        </Field>
        <Button
          id="admin-food-save"
          loading={busy}
          disabled={!valid}
          onClick={async () => {
            setBusy(true);
            try {
              await onSave(toPayload(d));
              onClose();
            } catch (e) {
              toast(errorCode(e), 'error');
            } finally {
              setBusy(false);
            }
          }}
        >
          {t('admin.save')}
        </Button>
      </div>
    </Sheet>
  );
}

function SearchFoods() {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<FoodItem[] | null>(null);
  const [edit, setEdit] = useState<Draft | null>(null);
  useEffect(() => {
    if (q.trim().length < 2) return setRows(null);
    const id = setTimeout(() => {
      searchFoodsPage(q)
        .then((r) => setRows(r.items))
        .catch(() => setRows([]));
    }, 300);
    return () => clearTimeout(id);
  }, [q]);
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 md:flex-row">
        <input type="search" aria-label={t('common.search')} placeholder={t('admin.foods.search')} className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} id="admin-food-search" />
        <Button variant="secondary" onClick={() => setEdit({ ...empty, name: q })}>
          {t('admin.foods.add')}
        </Button>
      </div>
      {rows === null ? (
        <p className="text-small text-muted">{t('admin.foods.searchHint')}</p>
      ) : !rows.length ? (
        <EmptyState title={t('admin.foods.none')} />
      ) : (
        <Table label={t('admin.nav.foods')} head={[t('food.foodName'), t('admin.foods.source'), t('admin.foods.kcal100'), '']}>
          {rows.map((f) => (
            <tr key={f.id}>
              <Td>
                <span className="block font-medium">{f.name}</span>
                {!!f.aliases?.length && <span className="block truncate text-caption text-muted">{f.aliases.slice(0, 4).join(', ')}</span>}
              </Td>
              <Td className="text-muted">{f.dataset ?? f.source}</Td>
              <Td className="tabular-nums">{Math.round(f.per100g.calories)}</Td>
              <Td>
                <Button size="sm" variant="secondary" onClick={() => setEdit(fromFood(f))}>
                  {t('admin.edit')}
                </Button>
              </Td>
            </tr>
          ))}
        </Table>
      )}
      {edit && (
        <FoodForm
          draft={edit}
          title={edit.id ? t('admin.foods.editTitle') : t('admin.foods.add')}
          onClose={() => setEdit(null)}
          onSave={async (p) => {
            await call('adminSaveFood', p);
            toast(t('admin.foods.saved'), 'success');
          }}
        />
      )}
    </Card>
  );
}

function Suggestions() {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState<Suggestion[] | null>(null);
  const [review, setReview] = useState<Suggestion | null>(null);
  useEffect(() => {
    return onSnapshot(
        query(collection(db(), 'foodSuggestions'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'), limit(100)),
        (s) => setRows(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Suggestion, 'id'>) }))),
        () => setRows([]),
      );
  }, []);
  if (!rows) return <Skeleton className="h-32" />;
  return (
    <Card className="flex flex-col gap-3">
      <CardHeader title={t('admin.foods.suggestions')} subtitle={t('admin.foods.suggestionsHint')} />
      {!rows.length ? (
        <EmptyState title={t('admin.foods.noSuggestions')} />
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {rows.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-ink">{s.name}</span>
                <span className="block text-caption text-muted">
                  {s.servingLabel ?? '—'} · {s.nutrients ? `${Math.round(s.nutrients.calories)} kcal` : '—'} · {fmtDate(s.createdAt?.toMillis?.() ?? null, i18n.language)}
                </span>
              </span>
              <Badge tone="accent">{t('food.sources.ai')}</Badge>
              <Button size="sm" variant="secondary" onClick={() => setReview(s)}>
                {t('admin.testimonials.review')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  call('adminReviewFoodSuggestion', { id: s.id, decision: 'reject' })
                    .then(() => toast(t('admin.foods.rejected')))
                    .catch((e) => toast(errorCode(e), 'error'))
                }
              >
                {t('admin.testimonials.reject')}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {review && (
        <FoodForm
          draft={fromSuggestion(review)}
          title={t('admin.foods.approveTitle')}
          onClose={() => setReview(null)}
          onSave={async (p) => {
            await call('adminReviewFoodSuggestion', { id: review.id, decision: 'approve', food: p });
            toast(t('admin.foods.approved'), 'success');
          }}
        />
      )}
    </Card>
  );
}

export default function FoodsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'search' | 'suggestions'>('search');
  return (
    <div className="flex flex-col gap-4" id="admin-foods">
      <PageHeader title={t('admin.nav.foods')} />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'search', label: t('admin.foods.tabFoods') },
          { id: 'suggestions', label: t('admin.foods.suggestions') },
        ]}
      />
      {tab === 'search' ? <SearchFoods /> : <Suggestions />}
    </div>
  );
}
