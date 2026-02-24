import React from "react";
import { useI18n } from "@/i18n";

type ModalOverlayProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  open?: boolean;
  contentClassName?: string;
};

export const ModalOverlay: React.FC<ModalOverlayProps> = ({
  title,
  onClose,
  children,
  open = true,
  contentClassName,
}) => {
  const { t } = useI18n();
  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md ${
        open ? "" : "opacity-0 pointer-events-none"
      } ui-caps`}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 p-4 md:p-6 pb-[env(safe-area-inset-bottom)] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-2xl font-bold text-neon-green">{title}</h2>
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg bg-slate-800/60 text-white text-sm hover:bg-slate-700/80"
          >
            {t("common.close")}
          </button>
        </div>
        <div
          className={`flex-1 overflow-auto rounded-2xl bg-slate-950/70 p-4 md:p-6 ${
            contentClassName || ""
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
