import React from "react";

interface AddMethodButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const  AddMethodButton = ({ onClick, icon, label }: AddMethodButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-indigo/20 py-2 text-[10.5px] font-bold uppercase tracking-[0.08em] text-indigo/70 hover:border-indigo/40 hover:text-indigo transition-colors"
    >
      {icon}
      {label}
    </button>
  );
}

export default AddMethodButton;