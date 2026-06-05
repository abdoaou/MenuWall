type Props = {
  type?: 'danger' | 'success' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
};

export function Alert({ type = 'danger', message, onClose }: Props) {
  if (!message) return null;
  return (
    <div className={`alert alert-${type} alert-dismissible`} role="alert">
      <div>{message}</div>
      {onClose && (
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
      )}
    </div>
  );
}
