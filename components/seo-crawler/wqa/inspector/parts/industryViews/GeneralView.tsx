import React from 'react';
import { IndustryActionBlock } from './_helpers';

export default function GeneralView({ page: _page }: { page: any }) {
  return (
    <div>
      <IndustryActionBlock page={_page} />
      <div className="bg-[#0a0a0a] border border-[#222] rounded p-5 text-center">
        <div className="text-[13px] text-white font-semibold mb-1">No industry overlay</div>
        <div className="text-[12px] text-[#666]">
          Industry was not detected with enough confidence. You can override the industry from the right sidebar.
        </div>
      </div>
    </div>
  );
}
