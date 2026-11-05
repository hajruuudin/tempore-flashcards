interface PageHeaderProps {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}

export default function PageHeader({ eyebrow, title, children }: PageHeaderProps) {
  return (
    <div className="border-b border-tf-line/70 pb-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="tf-eyebrow">{eyebrow}</span>
          <h1 className="text-2xl font-semibold leading-tight text-tf-text sm:text-4xl">
            {title}
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
