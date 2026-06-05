type Props = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="page-header d-print-none">
      <div className="container-xl">
        <div className="row g-2 align-items-center">
          <div className="col">
            <h1 className="page-title">{title}</h1>
            {subtitle && <div className="text-secondary mt-1">{subtitle}</div>}
          </div>
          {actions && <div className="col-auto ms-auto">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
