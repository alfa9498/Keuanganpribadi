import React from "react";

export const BentoGrid = ({ className, children }) => {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-[1600px] mx-auto ${className}`}
    >
      {children}
    </div>
  );
};

export const BentoCard = ({
  className,
  children,
  title,
  icon: Icon,
  description,
  headerAction,
}) => {
  return (
    <div
      className={`
        row-span-1 
        rounded-3xl group/bento 
        hover:shadow-xl transition duration-200 shadow-input 
        dark:shadow-none p-4 
        bg-white dark:bg-slate-900 
        border border-transparent dark:border-white/[0.1] 
        justify-between flex flex-col space-y-4
        ${className}
      `}
    >
      {(title || Icon || headerAction) && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-slate-500" />}
            {title && (
              <div>
                <div className="font-bold text-slate-700 dark:text-slate-200 transition duration-200">
                  {title}
                </div>
                {description && (
                  <div className="font-normal text-slate-500 text-xs dark:text-slate-400">
                    {description}
                  </div>
                )}
              </div>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="group-hover/bento:translate-x-1 transition duration-200 h-full w-full">
        {children}
      </div>
    </div>
  );
};

// Example Item for easy usage
export const BentoItem = ({ className, title, description, header, icon }) => {
  return (
    <BentoCard
      className={className}
      title={title}
      description={description}
      icon={icon}
    >
      {header}
    </BentoCard>
  );
};
