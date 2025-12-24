
import React from 'react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex px-6 py-4 text-slate-400 text-xs font-bold uppercase tracking-widest" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {items.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            {index > 0 && (
              <svg className="w-3 h-3 text-slate-600 mx-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
              </svg>
            )}
            <span className={index === items.length - 1 ? "text-emerald-500" : "hover:text-slate-200 cursor-pointer transition-colors"}>
              {item.label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
