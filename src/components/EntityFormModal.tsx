import { FormFields } from './FormFields';
import type { FieldDef } from '../config/adminResources';

type Props = {
  title: string;
  fields: FieldDef[];
  form: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isEdit?: boolean;
  saving?: boolean;
  onClose: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
};

export function EntityFormModal({
  title,
  fields,
  form,
  setForm,
  isEdit,
  saving,
  onClose,
  onSave,
  saveDisabled,
}: Props) {
  return (
    <>
      <div className="modal modal-blur show d-block" tabIndex={-1} role="dialog">
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body">
              <FormFields fields={fields} form={form} setForm={setForm} isEdit={isEdit} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-link" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving || saveDisabled}
                onClick={onSave}
              >
                {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" onClick={onClose} />
    </>
  );
}
