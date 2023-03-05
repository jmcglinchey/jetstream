import { ListItem } from '@jetstream/types';
import React, { Fragment, FunctionComponent } from 'react';
import { ComboboxListItemGroup } from './ComboboxListItemGroup';

// TODO: this should work with and without groups OR should we have two components?
export interface ComboboxVirtualItemsProps {
  items: ListItem[];
}

// TODO: need to enable virtual scroll - so this needs to take in a list and create everything
export const ComboboxVirtualItems: FunctionComponent<ComboboxVirtualItemsProps> = ({ items }) => {
  let CurrWrapper: any = Fragment;
  items.map((item) => {
    // if group, then put all prior items into wrapper and create new wrapper
    // if first item and group, then create new wrapper but don't se anything
    CurrWrapper = item.isGroup ? ComboboxListItemGroup : Fragment;
  });

  return (
    <ul className="slds-listbox slds-listbox_vertical" role="group" /** aria-label={label} */>
      <li role="presentation" className="slds-listbox__item slds-item">
        <div className="slds-media slds-listbox__option slds-listbox__option_plain slds-media_small" role="presentation">
          <h3 className="slds-listbox__option-header" role="presentation">
            {/* {label} */}
          </h3>
        </div>
      </li>
      {/* {children} */}
    </ul>
  );
};
