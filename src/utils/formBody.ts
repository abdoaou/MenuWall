import type { FieldDef } from '../config/adminResources';

const SKIP_KEYS = new Set(['website_filter']);

export function buildFormBody(
  form: Record<string, string>,
  fields: FieldDef[],
  isEdit?: boolean,
  opts?: { skipImage?: boolean }
): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  fields.forEach((f) => {
    if (SKIP_KEYS.has(f.name)) return;
    if (opts?.skipImage && f.type === 'image') return;
    if (f.type === 'parent_category_readonly') {
      const pid = form[f.name]?.trim();
      if (pid) body[f.name] = Number(pid);
      return;
    }
    if (f.showOn === 'create' && isEdit) return;
    if (f.showOn === 'edit' && !isEdit) return;

    const raw = form[f.name]?.trim() ?? '';
    if (f.type === 'image') return;
    if (!raw) {
      if (f.name === 'password' && isEdit) return;
      return;
    }

    if (f.name === 'value') {
      try {
        body.value = JSON.parse(raw);
      } catch {
        body.value = raw;
      }
      return;
    }

    if (f.type === 'number' || f.name.endsWith('_id')) {
      body[f.name] = Number(raw);
      return;
    }

    if (f.type === 'checkbox') {
      body[f.name] = raw === 'true';
      return;
    }

    body[f.name] = raw;
  });

  if (!isEdit && !body.status && fields.some((f) => f.name === 'status')) {
    body.status = 'active';
  }

  return body;
}

export function buildMultipartBody(body: Record<string, unknown>, file: File): FormData {
  const fd = new FormData();
  Object.entries(body).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'boolean') {
      fd.append(key, value ? 'true' : 'false');
    } else {
      fd.append(key, String(value));
    }
  });
  fd.append('image', file);
  return fd;
}

export function emptyFormFromFields(fields: FieldDef[]): Record<string, string> {
  const form: Record<string, string> = {};
  fields.forEach((f) => {
    if (f.type === 'status' || f.type === 'status_product') form[f.name] = 'active';
    else if (f.type === 'checkbox') form[f.name] = 'false';
    else form[f.name] = '';
  });
  return form;
}
