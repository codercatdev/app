import React from "react";

import ContextFilterButton from "components/atoms/ContextFilterButton/context-filter-button";
import Icon from "components/atoms/Icon/icon";

import cancelIcon from "img/x-circle.svg";

export type SortOptions = "name" | "";

interface SortedBySelectorProps {
  handleCancelClick: () => void;
  className?: string;
  selected?: SortOptions;
}

const SortedOrders: Record<SortOptions, string> = {
  "": "",
  "name": "Repository"
} as const;

const SortedBySelector: React.FC<SortedBySelectorProps> = ({
  handleCancelClick,
  selected
}) => {

  if (!selected) return <></>;

  return (
    <div className="max-w-max relative">
      <ContextFilterButton isSelected={!!selected}>
        <div className="flex">
          <span className="text-dark-slate-10">Sorted by:</span>
          <div className="flex items-center ml-1 text-light-slate-12">
            {SortedOrders[(selected as keyof typeof SortedOrders)]}

            <Icon
              className="ml-2 cursor-pointer"
              IconImage={cancelIcon}
              onClick={() => handleCancelClick()}
            />
          </div>
        </div>
      </ContextFilterButton>
    </div>
  );
};

export default SortedBySelector;
