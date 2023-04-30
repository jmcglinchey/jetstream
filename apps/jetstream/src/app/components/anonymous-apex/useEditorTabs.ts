import { useDebounce, useNonInitialEffect } from '@jetstream/shared/ui-utils';
import { useCallback, useRef, useState } from 'react';
import { STORAGE_KEYS } from '../../app-state';
import { EditorTab } from './AnonymousApex.types';

// TODO: move to function and add try catch
const defaultTab: EditorTab = {
  id: 0,
  label: 'Tab 1',
  value: '',
} as const;

let initialActiveTabIndexStr = localStorage.getItem(STORAGE_KEYS.ANONYMOUS_APEX_ACTIVE_TAB_STORAGE_KEY) || '0';
if (!/[0-9]/.test(initialActiveTabIndexStr)) {
  initialActiveTabIndexStr = '0';
}
const defaultActiveTabIndex = Number(initialActiveTabIndexStr);

let initialValue = localStorage.getItem(STORAGE_KEYS.ANONYMOUS_APEX_STORAGE_KEY) || '';
if (!initialValue || (!initialValue.startsWith('[') && !initialValue.endsWith(']'))) {
  initialValue = JSON.stringify([{ ...defaultTab, value: initialValue }]);
}
// TODO: fallback to blank if fails
const tabValues: EditorTab[] = JSON.parse(initialValue);

function saveToStorage(tabs: EditorTab[]) {
  localStorage.setItem(STORAGE_KEYS.ANONYMOUS_APEX_STORAGE_KEY, JSON.stringify(tabs));
}

export function useEditorTabs(initialTabValues: EditorTab[] = tabValues, initialActiveTabIndex = defaultActiveTabIndex) {
  const tabs = useRef(initialTabValues);
  const activeTabIndex = useRef(initialActiveTabIndex || 0);
  const [currentActiveTab, setCurrentActiveTab] = useState<EditorTab>(() => tabs.current[initialActiveTabIndex]);
  const debouncedActiveTab = useDebounce(currentActiveTab, 1000);

  useNonInitialEffect(() => {
    saveToStorage(tabs.current);
  }, [debouncedActiveTab]);

  useNonInitialEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ANONYMOUS_APEX_ACTIVE_TAB_STORAGE_KEY, activeTabIndex.current.toString());
  }, [activeTabIndex]);

  const setValue = useCallback((value: string) => {
    tabs.current[activeTabIndex.current] = { ...tabs.current[activeTabIndex.current], value };
    setCurrentActiveTab(tabs.current[activeTabIndex.current]);
    // TODO: save to storage?
    // TODO: should any of this be moved to store?
    // localStorage.setItem(STORAGE_KEYS.ANONYMOUS_APEX_STORAGE_KEY, JSON.stringify(tabs));
  }, []);

  const setActiveTab = useCallback((id: number) => {
    activeTabIndex.current = id;
    setCurrentActiveTab(tabs.current[id]);
  }, []);

  const addTab = useCallback(() => {
    tabs.current.push({ ...defaultTab, id: tabs.current.length, label: `Tab ${tabs.current.length + 1}` });
    activeTabIndex.current = tabs.current[tabs.current.length - 1].id;
    setCurrentActiveTab(tabs.current[activeTabIndex.current]);
  }, []);

  const deleteTab = useCallback((id: number) => {
    tabs.current = tabs.current.filter((tab) => tab.id !== id);
    if (tabs.current.length === 0) {
      tabs.current.push({ ...defaultTab });
    }
    tabs.current = tabs.current.map((tab, i) => ({ ...tab, id: i, label: `Tab ${i + 1}` }));

    // if deleted tab is left or current, tab indexes drop by 1
    if (activeTabIndex.current >= id) {
      activeTabIndex.current = Math.max(0, activeTabIndex.current - 1);
    }
    setCurrentActiveTab(tabs.current[activeTabIndex.current]);
    saveToStorage(tabs.current);
  }, []);

  return {
    tabs: tabs.current,
    activeTab: currentActiveTab,
    setValue,
    setActiveTab,
    addTab,
    deleteTab,
  };
}
