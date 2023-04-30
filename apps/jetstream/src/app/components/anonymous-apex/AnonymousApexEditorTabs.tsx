/* eslint-disable jsx-a11y/anchor-is-valid */
import { css } from '@emotion/react';
import { Icon, Tooltip } from '@jetstream/ui';
import classNames from 'classnames';
import { useRef } from 'react';
import { EditorTab } from './AnonymousApex.types';

export interface AnonymousApexEditorTabsProps {
  tabs: EditorTab[];
  activeTab: EditorTab;
  setActiveTab: (id: number) => void;
  addTab: () => void;
  deleteTab: (id: number) => void;
}

export const AnonymousApexEditorTabs = ({ tabs, activeTab, setActiveTab, addTab, deleteTab }: AnonymousApexEditorTabsProps) => {
  const scrollContainer = useRef<HTMLUListElement>(null);

  return (
    <div className="slds-tabs_default">
      <ul
        ref={scrollContainer}
        className="slds-tabs_default__nav"
        role="tablist"
        css={css`
          padding-bottom: 1px;
          overflow-x: auto;
          overflow-y: clip;

          scrollbar-color: #999 #333;

          touch-action: none;

          &::-webkit-scrollbar {
            height: 10px;
          }

          &::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 15px;
            height: 15px;
            border: 1px solid black;
          }

          &::-webkit-scrollbar-thumb {
            background: #999;
          }

          &::-webkit-scrollbar-track {
            background: #333;
          }
        `}
        onWheel={(ev) => {
          if (scrollContainer.current) {
            scrollContainer.current.scrollLeft += ev.deltaY;
          }
        }}
      >
        {tabs.map((tab, i) => (
          <li
            key={tab.id}
            css={css`
              user-select: none;
            `}
            className={classNames('slds-tabs_default__item slds-grid slds-grid_vertical-align-center slds-p-horizontal_xx-small', {
              'slds-is-active': activeTab.id === tab.id,
            })}
            title={tab.label}
            role="presentation"
          >
            <a
              className="slds-tabs_default__link slds-p-horizontal_x-small"
              role="tab"
              tabIndex={i === 0 ? 0 : -1}
              aria-selected="true"
              id={`${tab.id}_tab`}
              onClick={(ev) => {
                ev.preventDefault();
                setActiveTab(tab.id);
              }}
            >
              {tab.label}
            </a>
            <button
              className="slds-button slds-button_icon slds-button_icon-container slds-button_icon-x-small"
              tabIndex={0}
              title={`Delete ${tab.label}`}
              onClick={() => deleteTab(tab.id)}
            >
              <Icon type="utility" icon="close" className="slds-button__icon" omitContainer />
            </button>
          </li>
        ))}
        <li className="slds-tabs_default__item slds-grid slds-grid_vertical-align-center">
          <a
            className="slds-tabs_default__link"
            onClick={(ev) => {
              ev.preventDefault();
              addTab();
            }}
          >
            <Tooltip content="Add new tab">
              <Icon type="utility" icon="add" className="slds-button__icon" omitContainer />
            </Tooltip>
          </a>
        </li>
      </ul>
    </div>
  );
};

export default AnonymousApexEditorTabs;
