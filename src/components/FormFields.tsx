import type { FieldDef } from '../config/adminResources';
import { useLookupData } from '../hooks/useLookupData';
import { assetUrl } from '../utils/apiData';

type Props = {
  fields: FieldDef[];
  form: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isEdit?: boolean;
  imageFile?: File | null;
  setImageFile?: (file: File | null) => void;
};

export function FormFields({ fields, form, setForm, isEdit, imageFile, setImageFile }: Props) {
  const {
    websites,
    loading,
    categoriesForWebsite,
    parentCategoriesForWebsite,
    parentById,
  } = useLookupData();

  const websiteId = form.website_id
    ? Number(form.website_id)
    : form.website_filter
      ? Number(form.website_filter)
      : '';
  const filteredParents = parentCategoriesForWebsite(websiteId);
  const filteredCategories = categoriesForWebsite(websiteId, form.parent_category_id);

  const set = (name: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === 'category_id' && value) {
        const cat = categoriesForWebsite(websiteId).find((c) => String(c.id) === value);
        if (cat?.parent_id) {
          next.parent_category_id = String(cat.parent_id);
        }
      }

      if (name === 'parent_category_id' || name === 'parent_id') {
        const pid = value ? Number(value) : null;
        if (next.category_id) {
          const cat = categoriesForWebsite(websiteId).find(
            (c) => String(c.id) === next.category_id
          );
          if (cat && pid !== null && cat.parent_id !== pid) {
            next.category_id = '';
          }
        }
      }

      if (name === 'website_id' || name === 'website_filter') {
        next.category_id = '';
        if (!isEdit || prev[name] !== value) {
          next.parent_category_id = '';
          next.parent_id = '';
        }
      }

      return next;
    });
  };

  return (
    <>
      {fields.map((f) => {
        if (f.showOn === 'create' && isEdit) return null;
        if (f.showOn === 'edit' && !isEdit) return null;
        if (isEdit && f.name === 'password' && f.optionalOnEdit) {
          // still show but not required
        }

        const label = (
          <label className="form-label" htmlFor={f.name}>
            {f.label}
            {f.required && !isEdit && <span className="text-danger"> *</span>}
            {isEdit && f.name === 'password' && (
              <span className="text-secondary small"> (leave blank to keep)</span>
            )}
          </label>
        );

        if (f.type === 'website' || f.type === 'website_filter') {
          const key = f.type === 'website_filter' ? 'website_filter' : 'website_id';
          return (
            <div className="mb-3" key={f.name}>
              {label}
              <select
                id={f.name}
                className="form-select"
                value={form[key] ?? ''}
                onChange={(e) => set(key, e.target.value)}
                disabled={loading}
                required={f.required && !isEdit}
              >
                <option value="">Select website…</option>
                {websites.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (f.type === 'parent_category') {
          const options = filteredParents;
          const siteName = (wid: number) =>
            websites.find((w) => w.id === wid)?.name ?? `Site ${wid}`;
          const needsWebsite = f.name === 'parent_category_id';
          return (
            <div className="mb-3" key={f.name}>
              {label}
              <select
                id={f.name}
                className="form-select"
                value={form[f.name] ?? ''}
                onChange={(e) => set(f.name, e.target.value)}
                disabled={loading || (needsWebsite && !websiteId)}
              >
                <option value="">Select parent category…</option>
                {options.map((p) => (
                  <option key={p.id} value={p.id}>
                    {needsWebsite ? p.name : `${p.name} (${siteName(p.website_id)})`}
                  </option>
                ))}
              </select>
              {needsWebsite && websiteId && filteredParents.length === 0 && (
                <small className="text-secondary">No parent categories for this website yet.</small>
              )}
            </div>
          );
        }

        if (f.type === 'category') {
          return (
            <div className="mb-3" key={f.name}>
              {label}
              <select
                id={f.name}
                className="form-select"
                value={form.category_id ?? ''}
                onChange={(e) => set('category_id', e.target.value)}
                disabled={loading || !websiteId}
              >
                <option value="">Select category…</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {websiteId && filteredCategories.length === 0 && (
                <small className="text-secondary">
                  {form.parent_category_id
                    ? 'No categories under this parent category yet.'
                    : 'No categories for this website yet.'}
                </small>
              )}
            </div>
          );
        }

        if (f.type === 'parent_category_readonly') {
          const pid = form.parent_category_id;
          const pname = pid ? parentById(Number(pid))?.name : null;
          return (
            <div className="mb-3" key={f.name}>
              {label}
              <input
                className="form-control"
                readOnly
                value={pname ?? (pid ? `Parent #${pid}` : '—')}
                placeholder="Auto-set from category"
              />
              <input type="hidden" name={f.name} value={form.parent_category_id ?? ''} />
            </div>
          );
        }

        if (f.type === 'image') {
          const previewUrl = imageFile
            ? URL.createObjectURL(imageFile)
            : form.image
              ? assetUrl(form.image)
              : '';

          return (
            <div className="mb-3" key={f.name}>
              {label}
              <input
                id={f.name}
                type="file"
                className="form-control"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setImageFile?.(e.target.files?.[0] ?? null)}
              />
              <small className="text-secondary d-block mt-1">
                JPG, PNG, or WebP. Max 5MB.
                {isEdit && form.image && !imageFile && ' Leave empty to keep the current image.'}
              </small>
              {previewUrl && (
                <div className="mt-2">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="img-fluid rounded border"
                    style={{ maxHeight: 160, objectFit: 'contain' }}
                  />
                </div>
              )}
            </div>
          );
        }

        if (f.type === 'status' || f.type === 'status_product') {
          const opts =
            f.type === 'status_product'
              ? ['active', 'draft', 'inactive']
              : ['active', 'inactive'];
          return (
            <div className="mb-3" key={f.name}>
              {label}
              <select
                id={f.name}
                className="form-select"
                value={form[f.name] ?? (f.type === 'status_product' ? 'active' : 'active')}
                onChange={(e) => set(f.name, e.target.value)}
              >
                {opts.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (f.type === 'textarea') {
          return (
            <div className="mb-3" key={f.name}>
              {label}
              <textarea
                id={f.name}
                className="form-control"
                rows={3}
                value={form[f.name] ?? ''}
                onChange={(e) => set(f.name, e.target.value)}
              />
            </div>
          );
        }

        if (f.type === 'checkbox') {
          return (
            <div className="mb-3" key={f.name}>
              <label className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={form[f.name] === 'true'}
                  onChange={(e) => set(f.name, e.target.checked ? 'true' : 'false')}
                />
                <span className="form-check-label">{f.label}</span>
              </label>
            </div>
          );
        }

        return (
          <div className="mb-3" key={f.name}>
            {label}
            <input
              id={f.name}
              type={f.type === 'password' ? 'password' : f.type === 'number' ? 'number' : 'text'}
              className="form-control"
              step={f.name.includes('price') ? '0.01' : undefined}
              value={form[f.name] ?? ''}
              onChange={(e) => set(f.name, e.target.value)}
              required={f.required && !isEdit && f.name !== 'password'}
              minLength={f.type === 'password' && !isEdit ? 8 : undefined}
            />
          </div>
        );
      })}
    </>
  );
}
