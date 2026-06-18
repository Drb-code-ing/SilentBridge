﻿﻿﻿﻿interface Segment {
  id: string;
  label: string;
}

interface SegmentedControlProps {
  segments: Segment[];
  selectedId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function SegmentedControl({
  segments,
  selectedId,
  onChange,
  className = ""
}: SegmentedControlProps) {
  return (
    <div className={`inline-flex bg-gray-100 p-1 rounded-lg ${className}`}>
      {segments.map((segment) => (
        <button
          key={segment.id}
          onClick={() => onChange(segment.id)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            selectedId === segment.id
              ? "bg-white text-mint-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {segment.label}
        </button>
      ))}
    </div>
  );
}
