import { useCallback, useEffect, useState } from 'react';
import { IconEdit, IconPlus, IconRefresh } from '@tabler/icons-react';
import { Alert } from '../components/Alert';
import { EntityFormModal } from '../components/EntityFormModal';
import { PageHeader } from '../components/PageHeader';
import type { ResourceDef } from '../config/adminResources';
import { useApi } from '../context/ApiContext';
import { rowToForm, useLookupData } from '../hooks/useLookupData';
import { buildFormBody, emptyFormFromFields } from '../utils/formBody';
import { rowText, unwrapList, type ApiRow } from '../utils/apiData';

type Props = { resource: ResourceDef };

function enrichFormFromRow(
  resource: ResourceDef,
  row: ApiRow,
  parentCategories: { id: number; website_id: number }[]
): Record<string, string> {
  const names = resource.formFields.map((f) => f.name);
  const form = rowToForm(row, names);

  if (resource.id === 'categories' && row.parent_id) {
    const pc = parentCategories.find((p) => p.id === Number(row.parent_id));
    if (pc) form.website_filter = String(pc.website_id);
  }

  if (resource.id === 'settings') {
    const val = row.value ?? row.value_json;
    form.value = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val ?? '');
    form.key = String(row.key ?? row.id ?? '');
  }

  if (resource.id === 'menus' && row.is_active !== undefined) {
    form.is_active = row.is_active ? 'true' : 'false';
  }

  return form;
}

export function ResourceListPage({ resource }: Props) {
  const { request, config } = useApi();
  const { parentCategories, refresh: refreshLookups } = useLookupData();
  const [rows, setRows] = useState<ApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<ApiRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const needsTenant = resource.needsTenant && !config.websiteId;
  const isEdit = Boolean(editing);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await request({
      method: 'GET',
      path: resource.path,
      query: { page: 1, limit: 100 },
    });
    setLoading(false);
    if (!res.ok) {
      setError((res.data as { message?: string })?.message ?? 'Failed to load');
      setRows([]);
      return;
    }
    const data = (res.data as { data?: unknown })?.data ?? res.data;
    setRows(unwrapList(data));
  }, [request, resource.path]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyFormFromFields(resource.formFields));
    setShowForm(true);
    refreshLookups();
  };

  const openEdit = (row: ApiRow) => {
    setEditing(row);
    setForm(enrichFormFromRow(resource, row, parentCategories));
    setShowForm(true);
    refreshLookups();
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({});
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const body = buildFormBody(form, resource.formFields, isEdit);

    if (resource.id === 'parent-categories' && !body.status) {
      body.status = 'active';
    }

    if (resource.id === 'admins' && isEdit && !body.password) {
      delete body.password;
    }

    let path = resource.path;
    let method = 'POST';

    if (isEdit) {
      const id = editing?.id ?? editing?.key;
      if (resource.id === 'settings') {
        path = `${resource.path}/${encodeURIComponent(String(editing?.key ?? editing?.id))}`;
      } else {
        path = `${resource.path}/${id}`;
      }
      method = 'PUT';
    } else if (resource.id === 'settings' && body.key) {
      method = 'PUT';
      path = `${resource.path}/${encodeURIComponent(String(body.key))}`;
      delete body.key;
    }

    const res = await request({ method, path, body });
    setSaving(false);
    if (!res.ok) {
      setError((res.data as { message?: string })?.message ?? 'Could not save');
      return;
    }
    closeForm();
    load();
  };

  const handleDelete = async (row: ApiRow) => {
    const id = row.id ?? row.key;
    if (!id || !confirm(`Delete this ${resource.title.slice(0, -1).toLowerCase()}?`)) return;
    const path =
      resource.id === 'settings'
        ? `${resource.path}/${encodeURIComponent(String(row.key ?? row.id))}`
        : `${resource.path}/${id}`;
    const res = await request({ method: 'DELETE', path });
    if (!res.ok) {
      setError((res.data as { message?: string })?.message ?? 'Delete failed');
      return;
    }
    load();
  };

  const editFields =
    resource.id === 'settings'
      ? resource.formFields
      : resource.formFields.map((f) =>
          f.showOn === 'create' ? { ...f, showOn: 'create' as const } : f
        );

  return (
    <>
      <PageHeader
        title={resource.title}
        subtitle={resource.subtitle}
        actions={
          <div className="btn-list">
            <button type="button" className="btn btn-outline-secondary" onClick={load} title="Refresh">
              <IconRefresh size={18} />
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={needsTenant}
              onClick={openCreate}
            >
              <IconPlus size={18} className="me-1" />
              Add
            </button>
          </div>
        }
      />

      <div className="page-body">
        <div className="container-xl">
          {needsTenant && (
            <Alert type="warning" message="Set Website ID in the top bar for this section." />
          )}
          <Alert type="danger" message={error} onClose={() => setError('')} />

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">{resource.title}</h3>
              <div className="card-actions">
                <span className="badge bg-blue-lt">{rows.length} records</span>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-vcenter card-table table-hover">
                <thead>
                  <tr>
                    {resource.columns.map((c) => (
                      <th key={c.key}>{c.label}</th>
                    ))}
                    <th className="w-1">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={resource.columns.length + 1} className="text-secondary">
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={resource.columns.length + 1} className="text-secondary">
                        No records yet.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    rows.map((row) => (
                      <tr key={String(row.id ?? row.key)}>
                        {resource.columns.map((c) => (
                          <td key={c.key}>
                            {c.render ? c.render(row) : rowText(row, c.key)}
                          </td>
                        ))}
                        <td>
                          <div className="btn-list flex-nowrap">
                            {resource.canEdit !== false && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => openEdit(row)}
                              >
                                <IconEdit size={16} />
                                Edit
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(row)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <EntityFormModal
          title={isEdit ? `Edit ${resource.title.slice(0, -1)}` : `Add ${resource.title.slice(0, -1)}`}
          fields={isEdit ? editFields : resource.formFields}
          form={form}
          setForm={setForm}
          isEdit={isEdit}
          saving={saving}
          onClose={closeForm}
          onSave={handleSave}
        />
      )}
    </>
  );
}
